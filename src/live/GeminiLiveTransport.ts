import type { FunctionCall, FunctionResponse, ServerMessage } from './liveProtocol';
import { decodeSocketMessage, responseObject, scheduledResponse, buildLiveSetup } from './liveProtocol';
import { apiUrl } from '../config/api';
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
    private readonly tokenProvider: () => Promise<LiveTokenResponse> = async () => {
      const response = await fetch(apiUrl('/api/gemini-token'), {
        method: 'POST',
        headers: { accept: 'application/json' },
      });
      const payload = (await response.json().catch(() => null)) as
        | { token?: string; model?: string; error?: string }
        | null;
      if (!response.ok || !payload?.token || !payload.model) {
        throw new Error(payload?.error || `Could not start voice session (${response.status}).`);
      }
      return { token: payload.token, model: payload.model };
    },
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

  private toolDeclarations() {
    return this.customTools.map((tool) => tool.declaration);
  }

  private async openSocket(token: string) {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(`${LIVE_ENDPOINT}?access_token=${encodeURIComponent(token)}`);
      socket.binaryType = 'arraybuffer';
      this.socket = socket;
      let settled = false;
      let setupTimer: number | null = null;
      const clearSetupTimer = () => {
        if (setupTimer !== null) window.clearTimeout(setupTimer);
        setupTimer = null;
      };
      const resolveSetup = () => {
        if (settled) return;
        settled = true;
        clearSetupTimer();
        resolve();
      };
      const rejectSetup = (error: Error) => {
        if (settled) return;
        settled = true;
        clearSetupTimer();
        reject(error);
      };

      socket.addEventListener('open', () => {
        if (this.socket !== socket) {
          socket.close();
          rejectSetup(new Error('Session cancelled.'));
          return;
        }
        setupTimer = window.setTimeout(() => {
          const error = new Error('Gemini Live did not complete setup in time.');
          this.callbacks.onError(error.message);
          this.callbacks.onStatus('error');
          rejectSetup(error);
          socket.close(1000, 'setup timeout');
        }, SETUP_TIMEOUT_MS);

        const setup = buildLiveSetup(this.model, this.systemInstruction, this.sessionConfig, this.toolDeclarations(), this.resumptionHandle);
        this.callbacks.onDiagnostic?.({ event: 'setup_sent', model: this.model, apiVersion: 'v1beta', tools: this.customTools.map((tool) => tool.declaration.name) });
        this.send({ setup });
      });

      socket.addEventListener('message', (event) => {
        this.messageChain = this.messageChain
          .then(async () => {
            if (this.socket !== socket) return;
            const message = JSON.parse(await decodeSocketMessage(event.data)) as ServerMessage;
            if (message.error) throw new Error(message.error.message || 'Gemini Live returned an error.');

            if (message.setupComplete !== undefined) {
              this.callbacks.onDiagnostic?.({ event: 'setup_accepted' });
              this.setupComplete = true;
              this.callbacks.onStatus('listening');
              resolveSetup();
              return;
            }

            if (message.sessionResumptionUpdate?.newHandle && message.sessionResumptionUpdate.resumable !== false) {
              this.resumptionHandle = message.sessionResumptionUpdate.newHandle;
            }

            if (message.goAway) {
              this.resumeSession();
              return;
            }

            const serverContent = message.serverContent;
            if (serverContent?.interrupted) this.callbacks.onInterrupted?.();
            const inputText = serverContent?.inputTranscription?.text?.trim();
            if (inputText) this.callbacks.onInputTranscript?.(inputText);
            const outputText = serverContent?.outputTranscription?.text?.trim();
            if (outputText) this.callbacks.onOutputTranscript?.(outputText);
            for (const part of serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                this.callbacks.onAudio?.(part.inlineData.data, part.inlineData.mimeType ?? 'audio/pcm;rate=24000');
              }
              if (part.text?.trim() && !outputText) this.callbacks.onOutputTranscript?.(part.text.trim());
            }
            if (serverContent?.turnComplete) this.callbacks.onTurnComplete?.();

            for (const call of message.toolCall?.functionCalls ?? []) {
              await this.handleFunctionCall(call);
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
        rejectSetup(error);
      });

      socket.addEventListener('close', (event) => {
        if (this.socket === socket) {
          this.socket = null;
          this.setupComplete = false;
        }
        clearSetupTimer();
        if (!settled && !this.reconnecting) rejectSetup(new Error(event.reason || 'Gemini Live connection closed.'));
      });
    });
  }

  private async handleFunctionCall(call: FunctionCall) {
    this.callbacks.onDiagnostic?.({ event: 'tool_call', name: call.name });
    if (!call.name) return;
    if (call.id && this.acknowledgedCallIds.has(call.id)) return;
    if (call.id) this.acknowledgedCallIds.add(call.id);
    const tool = this.customTools.find((candidate) => candidate.declaration.name === call.name);
    if (!tool) {
      this.callbacks.onDiagnostic?.({ event: 'unknown_tool', name: call.name });
      this.sendFunctionResponses([{ id: call.id, name: call.name, response: { error: `Unknown tool: ${call.name}` } }]);
      return;
    }
    try {
      const value = responseObject(await tool.handle(call.args ?? {}));
      this.callbacks.onDiagnostic?.({ event: 'tool_result', name: call.name, saved: value.saved === true });
      this.sendFunctionResponses([{
        id: call.id,
        name: call.name,
        response: scheduledResponse(value, tool.declaration.behavior),
      }]);
    } catch (reason) {
      this.callbacks.onDiagnostic?.({ event: 'tool_error', name: call.name });
      const message = reason instanceof Error ? reason.message : 'Tool failed.';
      this.sendFunctionResponses([{ id: call.id, name: call.name, response: { error: message } }]);
    }
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

