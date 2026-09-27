import type { SupportBoard } from '../presentation/types';

export function ConversationBoard({
  board,
  visibleCount,
  revealMode = 'accumulate',
}: {
  board: SupportBoard;
  /** Optional progressive reveal limit. Omit to render the full board. */
  visibleCount?: number;
  /** Scene lessons can focus on only the latest teaching point instead of stacking old content. */
  revealMode?: 'accumulate' | 'focus';
}) {
  const count = visibleCount == null ? Number.POSITIVE_INFINITY : Math.max(0, visibleCount);
  if (count <= 0) return null;

  if (board.type === 'note') {
    return (
      <div className="conversation-board board-note">
        <small>Quick support</small>
        <h2>{board.title}</h2>
        {board.body ? <p>{board.body}</p> : null}
      </div>
    );
  }

  if (board.type === 'compare') {
    return (
      <div className="conversation-board board-compare">
        {board.title ? <h2>{board.title}</h2> : null}
        <div className={`board-compare-grid${count < 2 ? ' is-partial' : ''}`}>
          {count >= 1 ? (
            <article className="board-reveal-item"><strong>{board.left.title}</strong>{board.left.body ? <p>{board.left.body}</p> : null}</article>
          ) : null}
          {count >= 2 ? (
            <article className="board-reveal-item"><strong>{board.right.title}</strong>{board.right.body ? <p>{board.right.body}</p> : null}</article>
          ) : null}
        </div>
      </div>
    );
  }

  const visibleItems = board.items.slice(0, count);
  const renderedItems = revealMode === 'focus' && visibleItems.length
    ? [visibleItems[visibleItems.length - 1]]
    : visibleItems;
  const firstVisibleIndex = revealMode === 'focus' && visibleItems.length
    ? visibleItems.length - 1
    : 0;

  return (
    <div className={`conversation-board board-${board.type}${revealMode === 'focus' ? ' is-focus-board' : ''}`}>
      <h2>{board.title}</h2>
      <div className="board-item-list">
        {renderedItems.map((item, index) => (
          <article className="board-reveal-item" key={`${item.title}-${firstVisibleIndex + index}`}>
            <span>{String(firstVisibleIndex + index + 1).padStart(2, '0')}</span>
            <div><strong>{item.title}</strong>{item.body ? <p>{item.body}</p> : null}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
