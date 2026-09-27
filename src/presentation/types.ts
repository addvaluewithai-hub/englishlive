export type SupportBoard =
  | { type: 'note'; title: string; body?: string }
  | { type: 'compare'; title?: string; left: { title: string; body?: string }; right: { title: string; body?: string } }
  | { type: 'examples'; title: string; items: Array<{ title: string; body?: string }> }
  | { type: 'steps'; title: string; items: Array<{ title: string; body?: string }> };

export type StageMode = 'hero' | 'board';

export interface StageState {
  mode: StageMode;
  board: SupportBoard | null;
}

export const initialStageState: StageState = { mode: 'hero', board: null };
