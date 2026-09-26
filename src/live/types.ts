import type { CharacterPerformanceCue } from '../character/performance';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'error';

export interface LiveTokenResponse {
  token: string;
  model: string;
}

export interface LiveToolTrace {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface LiveCallbacks {
  onStatus(status: LiveStatus): void;
  onInputTranscript(text: string): void;
  onOutputTranscript(text: string): void;
  onAudio(data: string, mimeType: string): void;
  onPerformanceCue(cue: CharacterPerformanceCue): void;
  onPerformanceCancelled(): void;
  onInterrupted(): void;
  onTurnComplete(): void;
  onError(message: string): void;
  /** Optional diagnostic hook for application tools only. Performance/transport noise is intentionally excluded. */
  onToolCall?(trace: LiveToolTrace): void;
}

export interface LiveTransport {
  readonly connected: boolean;
  connect(systemInstruction: string): Promise<void>;
  sendAudio(base64Pcm16: string): void;
  endAudioStream(): void;
  sendText(text: string): void;
  close(): void;
}
