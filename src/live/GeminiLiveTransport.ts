import type { FunctionResponse, ServerMessage } from './liveProtocol';
import { decodeSocketMessage, buildLiveSetup } from './liveProtocol';
import { answerFunctionCall } from './functionCalls';
import { fetchLiveToken } from './liveToken';
import { dispatchServerContent } from './serverContent';
import { createSetupGate } from './setupGate';
import { DEFAULT_LIVE_MODEL, isLiveModel, type LiveModel } from './models';
import type { LiveClientTool } from './tools';
import type { LiveCallbacks, LiveSessionConfig, LiveTokenResponse, LiveTransport } from './types';

const LIVE_ENDPOINT =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
const SETUP_TIMEOUT_MS = 12_000;

export class GeminiLiveTransport implements LiveTransport {
  private model: LiveModel = DEFAULT_LIVE_MODEL;
  private socket: WebSocket | null = null;
  private setupComplete = false;
  private connectGeneration = 0;
  private messageChain: Promise<void> = Promise.resolve();
  private systemInstruction = '';
  private sessionConfig: LiveSessionConfig = {};
  private resumptionHandle: string | null = null;
  private reconnecting = false;
  private readonly acknowledgedCallIds = new Set<string>();

  constructor(
    private readonly callbacks: LiveCallbacks,
    private readonly customTools: readonly LiveClientTool[] = [],
    private readonly tokenProvider: () => Promise<LiveTokenResponse> = fetchLiveToken,
  ) {}

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN && this.setupComplete;
  }

  async connect(systemInstruction: string, config: LiveSessionConfig = {}) {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    const generation = ++this.connectGeneration;
    this.systemInstruction = systemInstruction.trim();
    this.sessionConfig = {
      voiceName: config.voiceName?.trim() || undefined,
      silenceDurationMs: config.silenceDurationMs === undefined ? undefined : Math.max(500, Math.min(5000, config.silenceDurationMs)),
      disableInputTranscription: config.disableInputTranscription === true,
    };
    this.callbacks.onStatus('connecting');
    const issued = await this.tokenProvider();
    if (generation !== this.connectGeneration) throw new Error('Session was closed.');
    if (!isLiveModel(issued.model)) throw new Error(`Unexpected Live model: ${issued.model}`);
    if (issued.model !== this.model) this.resumptionHandle = null;
    this.model = issued.model;
    await this.openSocket(issued.token);
  }

  sendAudio(base64Pcm16: string) {
    if (!this.connected) return;
    this.send({ realtimeInput: { audio: { data: base64Pcm16, mimeType: 'audio/pcm;rate=16000' } } });
  }

  endAudioStream() {
    if (this.connected) this.send({ realtimeInput: { audioStreamEnd: true } });
  }

  sendText(text: string) {
    const value = text.trim();
    if (this.connected && value) this.send({ realtimeInput: { text: value } });
  }

  close() {
    this.connectGeneration += 1;
    this.reconnecting = false;
    this.setupComplete = false;
    this.acknowledgedCallIds.clear();
    this.socket?.close(1000, 'client close');
    this.socket = null;
    this.callbacks.onStatus('idle');
  }

  private async openSocket(token: string) {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(`${LIVE_ENDPOINT}?access_token=${encodeURIComponent(token)}`);
      socket.binaryType = 'arraybuffer';
      this.socket = socket;
      const gate = createSetupGate(resolve, reject);

      socket.addEventListener('open', () => {
        if (this.socket !== socket) {
          socket.close();
          gate.reject(new Error('Session cancelled.'));
          return;
        }
        gate.arm(SETUP_TIMEOUT_MS, () => {
          const error = new Error('Gemini Live did not complete setup in time.');
          this.callbacks.onError(error.message);
          this.callbacks.onStatus('error');
          gate.reject(error);
          socket.close(1000, 'setup timeout');
        });

        const setup = buildLiveSetup(this.model, this.systemInstruction, this.sessionConfig,
          this.customTools.map((tool) => tool.declaration), this.resumptionHandle);
        this.callbacks.onDiagnostic?.({ event: 'setup_sent', model: this.model, apiVersion: 'v1beta', tools: this.customTools.map((tool) => tool.declaration.name) });
        this.send({ setup });
      });

      socket.addEventListener('message', (event) => {
        this.messageChain = this.messageChain
          .then(async () => {
            if (this.socket !== socket) return;
            const message = JSON.parse(await decodeSocketMessage(event.data)) as ServerMessage;
            if (message.error) {
              this.callbacks.onDiagnostic?.({ event: 'server_error' });
              throw new Error(message.error.message || 'Gemini Live returned an error.');
            }

            if (message.setupComplete !== undefined) {
              this.callbacks.onDiagnostic?.({ event: 'setup_accepted' });
              this.setupComplete = true;
              this.callbacks.onStatus('listening');
              gate.resolve();
              return;
            }

            if (message.sessionResumptionUpdate?.newHandle && message.sessionResumptionUpdate.resumable !== false) {
              this.resumptionHandle = message.sessionResumptionUpdate.newHandle;
            }

            if (message.goAway) {
              this.resumeSession();
              return;
            }

            dispatchServerContent(message.serverContent, this.callbacks);

            for (const call of message.toolCall?.functionCalls ?? []) {
              await answerFunctionCall(call, this.customTools, this.acknowledgedCallIds, this.callbacks,
                (responses) => this.sendFunctionResponses(responses));
            }
          })
          .catch((reason) => {
            const message = reason instanceof Error ? reason.message : 'Gemini Live connection error.';
            this.callbacks.onError(message);
            this.callbacks.onStatus('error');
          });
      });

      socket.addEventListener('error', () => {
        const error = new Error('Gemini Live WebSocket error.');
        this.callbacks.onError(error.message);
        this.callbacks.onStatus('error');
        gate.reject(error);
      });

      socket.addEventListener('close', (event) => {
        if (this.socket === socket) {
          this.socket = null;
          this.setupComplete = false;
        }
        gate.clearTimer();
        if (!gate.settled && !this.reconnecting) gate.reject(new Error(event.reason || 'Gemini Live connection closed.'));
      });
    });
  }

  async flushPendingMessages() {
    await this.messageChain;
  }

  private sendFunctionResponses(functionResponses: FunctionResponse[]) {
    this.send({ toolResponse: { functionResponses } });
  }

  private resumeSession() {
    if (this.reconnecting || !this.resumptionHandle || !this.socket) return;
    this.reconnecting = true;
    this.callbacks.onStatus('reconnecting');
    const oldSocket = this.socket;
    oldSocket.close(1000, 'session resume');
    const generation = this.connectGeneration;
    window.setTimeout(async () => {
      if (generation !== this.connectGeneration) return;
      try {
        const issued = await this.tokenProvider();
        if (generation !== this.connectGeneration) return;
        if (!isLiveModel(issued.model)) throw new Error(`Unexpected Live model: ${issued.model}`);
        this.model = issued.model;
        await this.openSocket(issued.token);
        this.reconnecting = false;
      } catch (reason) {
        if (generation !== this.connectGeneration) return;
        this.reconnecting = false;
        const message = reason instanceof Error ? reason.message : 'Could not resume Live session.';
        this.callbacks.onError(message);
        this.callbacks.onStatus('error');
      }
    }, 250);
  }

  private send(payload: Record<string, unknown>) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }
}

