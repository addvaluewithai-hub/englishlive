import type { CharacterPerformanceCue } from '../character/performance';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'error';

export interface LiveTokenResponse {
  token: string;
  model: string;
}

export interface LiveCallbacks {
  onStatus(status: LiveStatus): void;
  onInputTranscript(text: string): void;
  onOutputTranscript(text: string): void;
  onAudio(data: string, mimeType: string): void;
  /** @deprecated GeminiLiveTransport no longer requests or emits semantic performance cues. */
  onPerformanceCue?(cue: CharacterPerformanceCue): void;
  /** @deprecated GeminiLiveTransport no longer requests or emits semantic performance cues. */
  onPerformanceCancelled?(): void;
  onInterrupted(): void;
  onTurnComplete(): void;
  onError(message: string): void;
}

export interface LiveTransport {
  readonly connected: boolean;
  connect(systemInstruction: string): Promise<void>;
  sendAudio(base64Pcm16: string): void;
  endAudioStream(): void;
  sendText(text: string): void;
  close(): void;
}
