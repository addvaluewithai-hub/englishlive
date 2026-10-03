import { Navigate, useParams } from 'react-router-dom';

export function LegacyLearnPilotRedirect() {
  const { lessonId } = useParams();
  return <Navigate replace to={lessonId ? `/learn/lesson/${lessonId}` : '/learn'} />;
}
