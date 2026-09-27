import type {
  CharacterEmotion,
  CharacterGesture,
  CharacterMode,
  CharacterRenderer,
  MouthPose,
  RecipeCharacterRendererConfig,
} from '../types';
import { loadCharacterEngine, recipeForCharacter } from './CharacterEngineLoader';

const modeEnergy: Record<CharacterMode, number> = {
  idle: 0.1,
  listening: 0.18,
  thinking: 0.12,
  speaking: 0.55,
};

export class RecipeCharacterRenderer implements CharacterRenderer {
  private host: HTMLElement | null = null;
  private rig: ReturnType<typeof window.CharacterMotion.createRig> | null = null;
  private mountVersion = 0;
  private mode: CharacterMode = 'idle';
  private emotion: CharacterEmotion = 'neutral';
  private intensity = 0.7;
  private mouth: MouthPose | null = null;

  constructor(
    private readonly name: string,
    private readonly config: RecipeCharacterRendererConfig,
  ) {}

  async mount(container: HTMLElement) {
    const version = ++this.mountVersion;
    this.unmount(false);
    this.host = container;
    container.dataset.renderer = 'svg-recipe';
    container.dataset.species = this.config.species;

    const engine = await loadCharacterEngine();
    if (version !== this.mountVersion || this.host !== container) return;
    if (!window.CharacterMotion || !window.CharacterFlight || !window.CharacterGeometry) {
      throw new Error('Bundled PixiLive motion engine did not load.');
    }

    const recipe = engine.normalize(recipeForCharacter(this.name, this.config));
    container.innerHTML = engine.render(recipe);
    container.querySelector('svg')?.setAttribute('aria-label', this.name);
    this.rig = window.CharacterMotion.createRig(container, {
      keyboard: false,
      externalControl: true,
      speechMotionScale: this.config.motionScale,
      appearance: () => engine.metrics(recipe),
    });
    this.applyState();
  }

  unmount(invalidate = true) {
    if (invalidate) this.mountVersion += 1;
    this.rig?.destroy();
    this.rig = null;
    if (this.host) {
      this.host.replaceChildren();
      delete this.host.dataset.renderer;
      delete this.host.dataset.species;
    }
    this.host = null;
  }

  setMode(mode: CharacterMode) {
    this.mode = mode;
    this.rig?.setEnergy(modeEnergy[mode] * this.config.motionScale);
  }

  setEmotion(emotion: CharacterEmotion, intensity = 0.7) {
    this.emotion = emotion;
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.rig?.setEmotion(emotion === 'neutral' ? 'happy' : emotion);
    this.rig?.setIntensity(emotion === 'neutral' ? 0 : this.intensity);
  }

  setGesture(gesture: CharacterGesture, durationSeconds = 2.4) {
    this.rig?.setGesture(gesture, durationSeconds);
  }

  setMouth(pose: MouthPose | null) {
    this.mouth = pose;
    this.rig?.setMouthPose(pose);
  }

  cancel() {
    this.mouth = null;
    this.rig?.cancelActions();
    this.rig?.setMouthPose(null);
  }

  private applyState() {
    this.setMode(this.mode);
    this.setEmotion(this.emotion, this.intensity);
    this.rig?.setMouthPose(this.mouth);
  }
}
