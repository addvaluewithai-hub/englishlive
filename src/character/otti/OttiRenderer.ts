import type {
  CharacterEmotion,
  CharacterGesture,
  CharacterMode,
  CharacterRenderer,
  MouthPose,
  OttiSvgRendererConfig,
} from '../types';
import { renderOttiSvg } from './OttiArt';

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export class OttiRenderer implements CharacterRenderer {
  private host: HTMLElement | null = null;
  private gestureTimer: number | null = null;

  constructor(private readonly _config: OttiSvgRendererConfig) {}

  mount(container: HTMLElement) {
    this.unmount();
    this.host = container;
    container.innerHTML = renderOttiSvg({ pose: 'idle', className: 'otti-live-art' });
    container.dataset.renderer = 'otti-svg';
    container.dataset.mode = 'idle';
    container.dataset.emotion = 'neutral';
    container.dataset.gesture = 'none';
    container.style.setProperty('--otti-intensity', '0.65');
  }

  unmount() {
    if (this.gestureTimer !== null) window.clearTimeout(this.gestureTimer);
    this.gestureTimer = null;
    if (this.host) {
      this.host.replaceChildren();
      delete this.host.dataset.renderer;
      delete this.host.dataset.mode;
      delete this.host.dataset.emotion;
      delete this.host.dataset.gesture;
      this.host.style.removeProperty('--otti-intensity');
    }
    this.host = null;
  }

  setMode(mode: CharacterMode) {
    if (!this.host) return;
    this.host.dataset.mode = mode;
  }

  setEmotion(emotion: CharacterEmotion, intensity = 0.7) {
    if (!this.host) return;
    this.host.dataset.emotion = emotion;
    this.host.style.setProperty('--otti-intensity', String(clamp(intensity)));
  }

  setGesture(gesture: CharacterGesture, durationSeconds = 2.4) {
    if (!this.host) return;
    if (this.gestureTimer !== null) window.clearTimeout(this.gestureTimer);
    this.host.dataset.gesture = gesture;
    if (gesture === 'none') return;
    this.gestureTimer = window.setTimeout(() => {
      if (this.host) this.host.dataset.gesture = 'none';
      this.gestureTimer = null;
    }, Math.max(350, durationSeconds * 1000));
  }

  setMouth(pose: MouthPose | null) {
    if (!this.host) return;
    const mouth = this.host.querySelector<SVGEllipseElement>('[data-otti-mouth]');
    const smile = this.host.querySelector<SVGPathElement>('[data-otti-smile]');
    if (!mouth || !smile) return;

    const open = clamp(pose?.open ?? 0);
    const energy = clamp(pose?.energy ?? 0);
    const width = clamp(pose?.width ?? 0.52);
    const round = clamp(pose?.round ?? 0.18);
    const talking = open > 0.055 || energy > 0.08;

    if (!talking) {
      mouth.setAttribute('opacity', '0');
      smile.setAttribute('opacity', '1');
      return;
    }

    const rx = Math.max(9, 14 + width * 10 - round * 5);
    const ry = Math.max(4, 4 + open * 14 + energy * 3);
    mouth.setAttribute('rx', rx.toFixed(2));
    mouth.setAttribute('ry', ry.toFixed(2));
    mouth.setAttribute('opacity', String(0.82 + energy * 0.18));
    smile.setAttribute('opacity', '0');
  }

  cancel() {
    if (this.gestureTimer !== null) window.clearTimeout(this.gestureTimer);
    this.gestureTimer = null;
    if (this.host) this.host.dataset.gesture = 'none';
    this.setMouth(null);
  }
}
