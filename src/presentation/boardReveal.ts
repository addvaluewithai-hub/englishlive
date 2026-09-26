import type { SupportBoard } from './types';

export function boardRevealTotal(board: SupportBoard | null | undefined) {
  if (!board) return 0;
  if (board.type === 'note') return 1;
  if (board.type === 'compare') return 2;
  return board.items.length;
}
