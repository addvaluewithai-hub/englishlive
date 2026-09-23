import { initialStageState, type StageState, type SupportBoard } from './types';

export class StageDirector {
  private state: StageState = initialStageState;
  private pending: SupportBoard | null = null;
  private speechActive = false;
  private readonly listeners = new Set<(state: StageState) => void>();

  constructor(onStateChange?: (state: StageState) => void) {
    if (onStateChange) this.listeners.add(onStateChange);
  }

  get snapshot(): StageState {
    return this.state.board
      ? { ...this.state, board: JSON.parse(JSON.stringify(this.state.board)) as SupportBoard }
      : { ...this.state };
  }

  subscribe(listener: (state: StageState) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  queueBoard(board: SupportBoard) {
    this.pending = board;
    if (this.speechActive) this.showPending();
  }

  speechStarted() {
    this.speechActive = true;
    this.showPending();
  }

  turnPlayed() {
    this.speechActive = false;
    this.pending = null;
    this.setState(initialStageState);
  }

  interrupt() {
    this.speechActive = false;
    this.pending = null;
    this.setState(initialStageState);
  }

  reset() {
    this.interrupt();
  }

  private showPending() {
    if (!this.pending) return;
    const board = this.pending;
    this.pending = null;
    this.setState({ mode: 'board', board });
  }

  private setState(state: StageState) {
    this.state = state;
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
