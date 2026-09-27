import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hydrateCloudLearnerState } from '../cloud/bootstrap';
import type { LearnerProfile } from '../product/profile';
import { authClient } from './client';

export function RequireAuth({ children, requireProfile = true }: { children: ReactNode; requireProfile?: boolean }) {
  const location = useLocation();
  const session = authClient.useSession();
  const userId = session.data?.user?.id ?? null;
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const next = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);

  useEffect(() => {
    if (!userId) {
      setHydratedUserId(null);
      setProfile(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setHydratedUserId(null);
    hydrateCloudLearnerState()
      .then((result) => {
        if (cancelled) return;
        setProfile(result.profile);
        setHydratedUserId(userId);
      })
      .catch((reason) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'تعذر تحميل بيانات الحساب.');
      });
    return () => { cancelled = true; };
  }, [userId, retryNonce]);

  if (session.isPending) {
    return <section className="v2-empty-screen" dir="rtl"><h1>بنفتح حسابك…</h1><p>ثواني ونرجعك لمكانك.</p></section>;
  }

  if (!session.data?.user) {
    return <Navigate replace to={`/auth/sign-in?next=${encodeURIComponent(next)}`} />;
  }

  if (error) {
    return (
      <section className="v2-empty-screen" dir="rtl">
        <h1>مش قادرين نحمل حسابك دلوقتي</h1>
        <p>{error}</p>
        <button type="button" className="v2-primary-button" onClick={() => setRetryNonce((value) => value + 1)}>حاول تاني</button>
      </section>
    );
  }

  if (hydratedUserId !== userId) {
    return <section className="v2-empty-screen" dir="rtl"><h1>بنزامن تقدمك…</h1><p>بنجيب بياناتك من Englotti Cloud.</p></section>;
  }

  if (requireProfile && !profile && location.pathname !== '/onboarding') {
    return <Navigate replace to="/onboarding" />;
  }

  return children;
}
