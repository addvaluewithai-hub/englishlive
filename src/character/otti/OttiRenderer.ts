import type {
  CharacterEmotion,
  CharacterGesture,
  CharacterMode,
  CharacterRenderer,
  MouthPose,
  OttiSvgRendererConfig,
} from '../types';

const modeEnergy: Record<CharacterMode, number> = {
  idle: 0.1,
  listening: 0.18,
  thinking: 0.12,
  speaking: 0.55,
};

export class OttiRenderer implements CharacterRenderer {
  private host: HTMLElement | null = null;
  private rig: ReturnType<typeof window.OctopusMotion.createRig> | null = null;

  constructor(private readonly config: OttiSvgRendererConfig) {}

  mount(container: HTMLElement) {
    if (!window.CharacterGeometry || !window.OctopusAnatomy || !window.OctopusMotion) {
      throw new Error('Bundled PixiLive Octo engine did not load.');
    }

    this.unmount();
    this.host = container;
    container.innerHTML = window.OctopusAnatomy.render({ name: 'Otti' }, false);
    container.dataset.renderer = 'otti-svg';
    this.rig = window.OctopusMotion.createRig(container, {
      // Keep the upstream Octo speech-motion tuning. The new rig uses actual
      // playback energy/visemes to decide when a subtle speech gesture belongs.
      speechMotionScale: this.config.motionScale ?? 0.5,
    });
    this.setMode('idle');
    this.setEmotion('neutral', 0.7);
  }

  unmount() {
    this.rig?.cancelActions();
    this.rig?.setMouthPose(null);
    this.rig?.destroy();
    this.rig = null;
    if (this.host) {
      this.host.replaceChildren();
      delete this.host.dataset.renderer;
    }
    this.host = null;
  }

  setMode(mode: CharacterMode) {
    // The dedicated Octo rig owns breathing, attentive listening, thinking and
    // audio-reactive speaking. Forward the semantic mode instead of layering a
    // second local speaking animation on top of it.
    this.rig?.setMode?.(mode);
    this.rig?.setEnergy(modeEnergy[mode] * (this.config.motionScale ?? 0.5));
  }

  setEmotion(emotion: CharacterEmotion, intensity = 0.7) {
    this.rig?.setEmotion(emotion);
    this.rig?.setIntensity(Math.max(0, Math.min(1, intensity)));
  }

  setGesture(gesture: CharacterGesture, durationSeconds = 2.4) {
    this.rig?.setGesture(gesture, durationSeconds);
  }

  setMouth(pose: MouthPose | null) {
    // MouthPose comes from the PCM that is actually scheduled for playback,
    // including energy/open and width/round when the analyzer can infer them.
    this.rig?.setMouthPose(pose);
  }

  cancel() {
    this.rig?.cancelActions();
    this.rig?.setMouthPose(null);
  }
}
