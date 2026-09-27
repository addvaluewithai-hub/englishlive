import type { SupportBoard } from './types';

export interface BoardRevealChunk {
  title: string;
  body?: string;
}

export function boardRevealTotal(board: SupportBoard | null | undefined) {
  if (!board) return 0;
  if (board.type === 'note') return 1;
  if (board.type === 'compare') return 2;
  return board.items.length;
}

export function boardRevealChunk(
  board: SupportBoard | null | undefined,
  zeroBasedIndex: number,
): BoardRevealChunk | null {
  if (!board || zeroBasedIndex < 0) return null;
  if (board.type === 'note') {
    return zeroBasedIndex === 0 ? { title: board.title, body: board.body } : null;
  }
  if (board.type === 'compare') {
    if (zeroBasedIndex === 0) return { ...board.left };
    if (zeroBasedIndex === 1) return { ...board.right };
    return null;
  }
  const item = board.items[zeroBasedIndex];
  return item ? { ...item } : null;
}
