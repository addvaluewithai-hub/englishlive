import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { OttiMark } from '../character/otti/OttiMark';
import { authClient } from '../auth/client';

function errorMessage(value: unknown) {
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
  return 'حصلت مشكلة في تسجيل الحساب. جرّب تاني.';
}

export function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = authClient.useSession();
  const requestedNext = params.get('next');
  const safeNext = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/home';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session.isPending && session.data?.user) return <Navigate replace to={safeNext} />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 8) return;
    setBusy(true);
    setError(null);
    try {
      const result = mode === 'sign-up'
        ? await authClient.signUp.email({
            email: email.trim(),
            password,
            name: name.trim() || email.trim().split('@')[0],
          })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) throw result.error;
      navigate(mode === 'sign-up' ? '/onboarding' : safeNext, { replace: true });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError(null);
    try {
      const callbackPath = mode === 'sign-up' ? '/onboarding' : safeNext;
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}${callbackPath}`,
      });
      if (result?.error) throw result.error;
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  }

  const signingUp = mode === 'sign-up';
  return (
    <section className="v2-onboarding" dir="rtl">
      <header className="v2-onboarding-header">
        <Link className="v2-onboarding-brand" to="/"><span><OttiMark /></span><strong>Englotti</strong></Link>
      </header>
      <div className="v2-onboarding-card">
        <div className="v2-onboarding-step">
          <span className="v2-kicker">{signingUp ? 'حساب جديد' : 'أهلًا برجوعك'}</span>
          <h1>{signingUp ? 'ابدأ رحلتك مع Englotti' : 'سجّل دخولك وكمل من مكانك'}</h1>
          <p>{signingUp ? 'حسابك هيحفظ المدرس والتقدم والجلسات على أجهزتك.' : 'تقدمك محفوظ في Englotti Cloud ومربوط بحسابك.'}</p>

          <button type="button" className="v2-secondary-button" onClick={continueWithGoogle} disabled={busy}>
            المتابعة بحساب Google
          </button>

          <div className="v2-auth-divider"><span>أو بالبريد الإلكتروني</span></div>

          <form onSubmit={submit} className="v2-auth-form">
            {signingUp ? (
              <label>
                <span>الاسم</span>
                <input className="v2-text-input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} placeholder="اسمك" />
              </label>
            ) : null}
            <label>
              <span>البريد الإلكتروني</span>
              <input className="v2-text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" />
            </label>
            <label>
              <span>كلمة المرور</span>
              <input className="v2-text-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={signingUp ? 'new-password' : 'current-password'} minLength={8} required placeholder="8 حروف على الأقل" />
            </label>
            {error ? <div className="v2-auth-error" role="alert">{error}</div> : null}
            <button type="submit" className="v2-primary-button" disabled={busy || !email.trim() || password.length < 8}>
              {busy ? 'لحظة…' : signingUp ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="v2-auth-switch">
            {signingUp ? 'عندك حساب بالفعل؟ ' : 'لسه جديد؟ '}
            <Link to={signingUp ? '/auth/sign-in' : '/auth/sign-up'}>{signingUp ? 'سجّل دخول' : 'اعمل حساب'}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
