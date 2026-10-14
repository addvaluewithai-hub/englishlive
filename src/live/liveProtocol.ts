import type { LiveSessionConfig } from './types';
import type { LiveClientTool } from './tools';

export async function decodeSocketMessage(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  }
  throw new Error(`Unsupported Gemini Live message: ${Object.prototype.toString.call(data)}`);
}

export function responseObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { result: value == null ? 'ok' : String(value) };
}

export function scheduledResponse(
  value: Record<string, unknown>,
  behavior: 'BLOCKING' | 'NON_BLOCKING' | undefined,
) {
  // Gemini FunctionResponse.scheduling belongs beside response, not inside the
  // arbitrary result data. Otherwise the Live server never sees SILENT.
  return behavior === 'NON_BLOCKING'
    ? { response: value, scheduling: 'SILENT' as const }
    : { response: value };
}

export function buildLiveSetup(model: string, instruction: string, config: LiveSessionConfig, functionDeclarations: LiveClientTool['declaration'][], resumptionHandle: string | null) {
  const generationConfig: Record<string, unknown> = {
    responseModalities: ['AUDIO'],
  };
  if (config.voiceName) {
    generationConfig.speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: config.voiceName,
        },
      },
    };
  }

  const setup: Record<string, unknown> = {
    model: `models/${model}`,
    generationConfig,
    systemInstruction: {
      parts: [{
        text: instruction || 'You are a warm English conversation partner. Keep the conversation natural and concise.',
      }],
    },
    realtimeInputConfig: {
      activityHandling: 'START_OF_ACTIVITY_INTERRUPTS',
      automaticActivityDetection: config.manualActivityDetection ? { disabled: true } : {
        disabled: false,
        startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
        endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
        prefixPaddingMs: 120,
        // A language learner may pause mid-sentence while searching for words.
        // Keep those pauses inside the same turn rather than rushing to answer.
        silenceDurationMs: config.silenceDurationMs ?? 3600,
      },
      turnCoverage: 'TURN_INCLUDES_ONLY_ACTIVITY',
    },
    ...(!config.disableInputTranscription ? { inputAudioTranscription: { languageCodes: ['en-US', 'ar-EG'] } } : {}),
    outputAudioTranscription: {},
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: resumptionHandle ? { handle: resumptionHandle } : {},
  };
  if (functionDeclarations.length) {
    setup.tools = [{ functionDeclarations }];
  }

  return setup;
}

export interface FunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

export interface ServerMessage {
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

export interface FunctionResponse {
  id?: string;
  name: string;
  response: Record<string, unknown>;
  scheduling?: 'SILENT' | 'WHEN_IDLE' | 'INTERRUPT';
}

