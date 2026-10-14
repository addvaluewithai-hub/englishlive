import type { ServerMessage } from './liveProtocol';
import type { LiveCallbacks } from './types';

/** Route one serverContent frame (interruption, transcripts, audio, completion) to callbacks. */
export function dispatchServerContent(serverContent: ServerMessage['serverContent'], callbacks: LiveCallbacks) {
  if (!serverContent) return;
  if (serverContent.interrupted) callbacks.onInterrupted?.();
  const inputText = serverContent.inputTranscription?.text?.trim();
  if (inputText) callbacks.onInputTranscript?.(inputText);
  const outputText = serverContent.outputTranscription?.text?.trim();
  if (outputText) callbacks.onOutputTranscript?.(outputText);
  for (const part of serverContent.modelTurn?.parts ?? []) {
    if (part.inlineData?.data) callbacks.onAudio?.(part.inlineData.data, part.inlineData.mimeType ?? 'audio/pcm;rate=24000');
    if (part.text?.trim() && !outputText) callbacks.onOutputTranscript?.(part.text.trim());
  }
  if (serverContent.generationComplete) callbacks.onGenerationComplete?.();
  if (serverContent.turnComplete) callbacks.onTurnComplete?.();
}
