import type { ReactNode, RefObject } from 'react';
import { CharacterHost, type CharacterHostHandle } from '../../character/CharacterHost';
import { getCharacterDefinition } from '../../character/registry';
import { LiveConversationStatus } from '../../ui/product/LiveConversationChrome';
import type { LiveStatus } from '../../live/types';

/** The speaking-screen stage: Otti's caption, the animated character, and the turn status. */
export function TutorStage({ host, text, status, title, body, learnerTurn, children }: {
  host: RefObject<CharacterHostHandle | null>;
  text: string;
  status: LiveStatus;
  title: string;
  body: string;
  learnerTurn: boolean;
  children?: ReactNode;
}) {
  return <div className="fs-live-stage sp-scenario-stage practice-live-stage tutor-stage">
    {text ? <article className="sp-otti-transcript tutor-a11y-transcript" aria-live="polite">
      <small><bdi dir="ltr">Otti</bdi></small>
      <p dir="auto">{text}</p>
    </article> : null}
    <div className="fs-live-character sp-scenario-character">
      <CharacterHost ref={host} character={getCharacterDefinition('otti')} className="fs-live-character-host" />
    </div>
    <LiveConversationStatus status={status}
      title={status === 'speaking' && text ? 'Otti' : title}
      body={status === 'speaking' && text ? text : body} learnerTurn={learnerTurn} />
    {children ? <div className="tutor-stage-extra">{children}</div> : null}
  </div>;
}
