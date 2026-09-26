import type {
  CharacterEmotion,
  CharacterGesture,
  CharacterMode,
  CharacterRenderer,
  MouthPose,
  SvgMascotRendererConfig,
} from '../types';

const modeEnergy: Record<CharacterMode, number> = {
  idle: 0.1,
  listening: 0.18,
  thinking: 0.12,
  speaking: 0.55,
};

export class SvgMascotRenderer implements CharacterRenderer {
  private host: HTMLElement | null = null;
  private rig: ReturnType<typeof window.MascotMotion.createRig> | null = null;

  constructor(private readonly config: SvgMascotRendererConfig) {}

  mount(container: HTMLElement) {
    if (!window.CharacterGeometry || !window.MascotArt || !window.MascotMotion) {
      throw new Error('Bundled PixiLive mascot engine did not load.');
    }

    this.unmount();
    this.host = container;
    container.innerHTML = window.MascotArt.render(this.config.preset);
    container.dataset.renderer = 'svg-mascot';
    container.dataset.character = this.config.preset;
    this.rig = window.MascotMotion.createRig(container, {
      preset: this.config.preset,
      speechMotionScale: this.config.motionScale,
    });
    this.setMode('idle');
    this.setEmotion('neutral', 0.7);
  }

  unmount() {
    this.rig?.destroy();
    this.rig = null;
    if (this.host) {
      this.host.replaceChildren();
      delete this.host.dataset.renderer;
      delete this.host.dataset.character;
    }
    this.host = null;
  }

  setMode(mode: CharacterMode) {
    this.rig?.setEnergy(modeEnergy[mode] * this.config.motionScale);
  }

  setEmotion(emotion: CharacterEmotion, intensity = 0.7) {
    this.rig?.setEmotion(emotion);
    this.rig?.setIntensity(Math.max(0, Math.min(1, intensity)));
  }

  setGesture(gesture: CharacterGesture, durationSeconds = 2.4) {
    this.rig?.setGesture(gesture, durationSeconds);
  }

  setMouth(pose: MouthPose | null) {
    this.rig?.setMouthPose(pose);
  }

  cancel() {
    this.rig?.cancelActions();
    this.rig?.setMouthPose(null);
  }
}
