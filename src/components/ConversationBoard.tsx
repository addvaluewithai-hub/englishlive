import type { SupportBoard } from '../presentation/types';

export function ConversationBoard({
  board,
  visibleCount,
}: {
  board: SupportBoard;
  /** Optional progressive reveal limit. Omit to render the full board. */
  visibleCount?: number;
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

  return (
    <div className={`conversation-board board-${board.type}`}>
      <h2>{board.title}</h2>
      <div className="board-item-list">
        {board.items.slice(0, count).map((item, index) => (
          <article className="board-reveal-item" key={`${item.title}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{item.title}</strong>{item.body ? <p>{item.body}</p> : null}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
