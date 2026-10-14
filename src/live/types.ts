import type { CharacterPerformanceCue } from '../character/performance';

export type LiveStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'error';

export interface LiveTokenResponse {
  token: string;
  model: string;
}

export interface LiveSessionConfig {
  voiceName?: string;
  /** Per-session pause tolerance; other modes retain their existing default. */
  silenceDurationMs?: number;
  /** When true, do not request unreliable Live input text in this session. */
  disableInputTranscription?: boolean;
}

export type LiveDiagnostic = {
  event: 'setup_sent' | 'setup_accepted' | 'tool_call' | 'tool_result' | 'unknown_tool' | 'tool_error' | 'server_error'
    | 'missing_turn_complete' | 'finish_requested' | 'finish_reminder' | 'finish_received' | 'finish_missing';
  model?: string; apiVersion?: string; tools?: string[]; name?: string; saved?: boolean; ms?: number;
};

export interface LiveCallbacks {
  /** Metadata only: never tokens, audio, or tool arguments. */
  onDiagnostic?(event: LiveDiagnostic): void;
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
  /** The model finished generating this turn; turnComplete may still follow (or, rarely, never arrive). */
  onGenerationComplete?(): void;
  onError(message: string): void;
}

export interface LiveTransport {
  readonly connected: boolean;
  connect(systemInstruction: string, config?: LiveSessionConfig): Promise<void>;
  sendAudio(base64Pcm16: string): void;
  endAudioStream(): void;
  sendText(text: string): void;
  close(): void;
}

