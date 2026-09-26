import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { createCharacterRenderer } from './createRenderer';
import type {
  CharacterDefinition,
  CharacterEmotion,
  CharacterGesture,
  CharacterMode,
  CharacterRenderer,
  MouthPose,
} from './types';

export interface CharacterHostHandle {
  setMode(mode: CharacterMode): void;
  setEmotion(emotion: CharacterEmotion, intensity?: number): void;
  setGesture(gesture: CharacterGesture, durationSeconds?: number): void;
  setMouth(pose: MouthPose | null): void;
  cancel(): void;
}

export const CharacterHost = forwardRef<
  CharacterHostHandle,
  { character: CharacterDefinition; className?: string }
>(function CharacterHost({ character, className = '' }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<CharacterRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = createCharacterRenderer(character);
    rendererRef.current = renderer;
    delete container.dataset.rendererError;

    const mounted = renderer.mount(container);
    if (mounted instanceof Promise) {
      mounted.catch((error) => {
        if (rendererRef.current !== renderer) return;
        container.dataset.rendererError = 'true';
        console.error(`Character renderer failed for ${character.id}`, error);
      });
    }

    return () => {
      renderer.unmount();
      if (rendererRef.current === renderer) rendererRef.current = null;
    };
  }, [character]);

  useImperativeHandle(
    ref,
    () => ({
      setMode: (mode) => rendererRef.current?.setMode(mode),
      setEmotion: (emotion, intensity) =>
        rendererRef.current?.setEmotion(emotion, intensity),
      setGesture: (gesture, durationSeconds) =>
        rendererRef.current?.setGesture(gesture, durationSeconds),
      setMouth: (pose) => rendererRef.current?.setMouth(pose),
      cancel: () => rendererRef.current?.cancel(),
    }),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={`character-host ${className}`.trim()}
      aria-label={`${character.name}, your conversation partner`}
      role="img"
    />
  );
});
