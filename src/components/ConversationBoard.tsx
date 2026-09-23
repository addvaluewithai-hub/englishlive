import type { SupportBoard } from '../presentation/types';

export function ConversationBoard({ board }: { board: SupportBoard }) {
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
        <div className="board-compare-grid">
          <article><strong>{board.left.title}</strong>{board.left.body ? <p>{board.left.body}</p> : null}</article>
          <article><strong>{board.right.title}</strong>{board.right.body ? <p>{board.right.body}</p> : null}</article>
        </div>
      </div>
    );
  }

  return (
    <div className={`conversation-board board-${board.type}`}>
      <h2>{board.title}</h2>
      <div className="board-item-list">
        {board.items.map((item, index) => (
          <article key={`${item.title}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{item.title}</strong>{item.body ? <p>{item.body}</p> : null}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
