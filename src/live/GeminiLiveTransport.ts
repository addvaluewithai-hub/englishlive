import { apiUrl } from '../config/api';
import { DEFAULT_LIVE_MODEL, isLiveModel, type LiveModel } from './models';
import type { LiveClientTool } from './tools';
import type { LiveCallbacks, LiveTokenResponse, LiveTransport } from './types';

const LIVE_ENDPOINT =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
const SETUP_TIMEOUT_MS = 12_000;

interface FunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

interface ServerMessage {
  error?: { message?: string };
  setupComplete?: Record<string, never>;
  serverContent?: {
    interrupted?: boolean;
    generationComplete?: boolean;
    turnComplete?: boolean;
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    modelTurn?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string };
        text?: string;
      }>;
    };
  };
  toolCall?: { functionCalls?: FunctionCall[] };
  sessionResumptionUpdate?: { newHandle?: string; resumable?: boolean };
  goAway?: { timeLeft?: string };
}

interface FunctionResponse {
  id?: string;
  name: string;
  response: Record<string, unknown>;
}

async function decodeSocketMessage(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  }
  throw new Error(`Unsupported Gemini Live message: ${Object.prototype.toString.call(data)}`);
}

function responseObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { result: value == null ? 'ok' : String(value) };
}

function scheduledResponse(
  value: Record<string, unknown>,
  behavior: 'BLOCKING' | 'NON_BLOCKING' | undefined,
) {
  return behavior === 'NON_BLOCKING'
    ? { ...value, scheduling: 'SILENT' }
    : value;
}

export class GeminiLiveTransport implements LiveTransport {
  private model: LiveModel = DEFAULT_LIVE_MODEL;
  private socket: WebSocket | null = null;
  private setupComplete = false;
  private connectGeneration = 0;
  private messageChain: Promise<void> = Promise.resolve();
  private systemInstruction = '';
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

  async connect(systemInstruction: string) {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    const generation = ++this.connectGeneration;
    this.systemInstruction = systemInstruction.trim();
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

        const functionDeclarations = this.toolDeclarations();
        const setup: Record<string, unknown> = {
          model: `models/${this.model}`,
          generationConfig: { responseModalities: ['AUDIO'] },
          systemInstruction: {
            parts: [{
              text: this.systemInstruction || 'You are a warm English conversation partner. Keep the conversation natural and concise.',
            }],
          },
          realtimeInputConfig: {
            activityHandling: 'START_OF_ACTIVITY_INTERRUPTS',
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
              endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
              prefixPaddingMs: 120,
              silenceDurationMs: 760,
            },
            turnCoverage: 'TURN_INCLUDES_ONLY_ACTIVITY',
          },
          inputAudioTranscription: { languageCodes: ['en-US', 'ar-EG'] },
          outputAudioTranscription: {},
          contextWindowCompression: { slidingWindow: {} },
          sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {},
        };
        if (functionDeclarations.length) {
          setup.tools = [{ functionDeclarations }];
        }

        this.send({ setup });
      });

      socket.addEventListener('message', (event) => {
        this.messageChain = this.messageChain
          .then(async () => {
            if (this.socket !== socket) return;
            const message = JSON.parse(await decodeSocketMessage(event.data)) as ServerMessage;
            if (message.error) throw new Error(message.error.message || 'Gemini Live returned an error.');

            if (message.setupComplete !== undefined) {
              this.setupComplete = true;
              this.callbacks.onStatus('listening');
              resolveSetup();
            }

            const content = message.serverContent;
            if (content?.interrupted) {
              this.callbacks.onInterrupted();
              this.callbacks.onStatus('listening');
            }

            if (message.toolCall?.functionCalls?.length) {
              await this.handleToolCalls(message.toolCall.functionCalls, Boolean(content?.interrupted));
            }

            const input = content?.inputTranscription?.text?.trim();
            if (input) this.callbacks.onInputTranscript(input);
            const output = content?.outputTranscription?.text?.trim();
            if (output && !content?.interrupted) this.callbacks.onOutputTranscript(output);

            if (!content?.interrupted) {
              for (const part of content?.modelTurn?.parts ?? []) {
                if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                  this.callbacks.onAudio(part.inlineData.data, part.inlineData.mimeType);
                }
              }
            }

            if (content?.turnComplete) {
              this.callbacks.onTurnComplete();
            }

            if (message.sessionResumptionUpdate?.resumable && message.sessionResumptionUpdate.newHandle) {
              this.resumptionHandle = message.sessionResumptionUpdate.newHandle;
            }
            if (message.goAway && !this.reconnecting) void this.resumeSession();
          })
          .catch((reason) => {
            const message = reason instanceof Error ? reason.message : 'Gemini Live message handling failed.';
            this.callbacks.onError(message);
            this.callbacks.onStatus('error');
          });
      });

      socket.addEventListener('error', () => {
        const error = new Error('Gemini Live WebSocket error.');
        this.callbacks.onError(error.message);
        if (!this.setupComplete) {
          this.callbacks.onStatus('error');
          rejectSetup(error);
        }
      });

      socket.addEventListener('close', (event) => {
        if (this.socket !== socket) {
          clearSetupTimer();
          return;
        }
        const wasReady = this.setupComplete;
        this.setupComplete = false;
        clearSetupTimer();
        if (!wasReady) rejectSetup(new Error(`Gemini Live closed during setup (${event.code}).`));
        if (!event.wasClean && wasReady && this.resumptionHandle && !this.reconnecting) {
          void this.resumeSession();
        } else if (!this.reconnecting && wasReady) {
          this.callbacks.onStatus('idle');
        }
      });
    });
  }

  private async handleToolCalls(functionCalls: FunctionCall[], interrupted: boolean) {
    const responses: FunctionResponse[] = [];

    for (const call of functionCalls) {
      if (call.id && this.acknowledgedCallIds.has(call.id)) continue;
      if (call.id) this.acknowledgedCallIds.add(call.id);

      if (interrupted) {
        responses.push({
          id: call.id,
          name: call.name,
          response: { result: 'cancelled' },
        });
        continue;
      }

      const tool = this.customTools.find((candidate) => candidate.declaration.name === call.name);
      if (!tool) {
        responses.push({
          id: call.id,
          name: call.name,
          response: { error: `Unsupported client tool: ${call.name}` },
        });
        continue;
      }

      try {
        const result = await tool.handle(call.args ?? {});
        responses.push({
          id: call.id,
          name: call.name,
          response: scheduledResponse(responseObject(result), tool.declaration.behavior),
        });
      } catch (reason) {
        responses.push({
          id: call.id,
          name: call.name,
          response: scheduledResponse({
            error: reason instanceof Error ? reason.message : `Client tool ${call.name} failed.`,
          }, tool.declaration.behavior),
        });
      }
    }

    if (responses.length && this.connected) this.send({ toolResponse: { functionResponses: responses } });
  }

  private async resumeSession() {
    if (this.reconnecting || !this.resumptionHandle) return;
    this.reconnecting = true;
    this.callbacks.onStatus('reconnecting');
    try {
      this.socket?.close(1000, 'session resume');
      const issued = await this.tokenProvider();
      if (issued.model !== this.model) throw new Error('Live model changed during session resumption.');
      await this.openSocket(issued.token);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not resume Live session.';
      this.callbacks.onError(message);
      this.callbacks.onStatus('error');
    } finally {
      this.reconnecting = false;
    }
  }

  private send(payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(payload));
  }
}
