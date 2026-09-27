import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../auth/client';
import { clearLearnerProfile } from '../product/profile';
import { replaceProductCourseProgressCache } from '../productV2/progress';

export function AccountScreen() {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const user = session.data?.user;

  async function signOut() {
    setBusy(true);
    try {
      await authClient.signOut();
      clearLearnerProfile();
      replaceProductCourseProgressCache(null);
      navigate('/', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="v2-progress-screen" dir="rtl">
      <header className="v2-progress-heading">
        <span className="v2-kicker">حسابي</span>
        <h1>{user?.name || 'حساب Englotti'}</h1>
        <p>{user?.email || 'بيانات الحساب والتعلّم محفوظة في Englotti Cloud.'}</p>
      </header>

      <section className="v2-progress-lessons">
        <h2>إعدادات التعلم</h2>
        <article className="v2-progress-lesson">
          <div><strong>المدرس</strong><small>غيّر الشخصية من غير ما يتغير تقدمك.</small></div>
          <Link to="/characters">تغيير</Link>
        </article>
        <article className="v2-progress-lesson">
          <div><strong>الأهداف وطريقة البداية</strong><small>تقدر تعدّل بيانات الـonboarding.</small></div>
          <Link to="/onboarding">تعديل</Link>
        </article>
      </section>

      <button type="button" className="v2-secondary-button" onClick={signOut} disabled={busy}>
        {busy ? 'جاري تسجيل الخروج…' : 'تسجيل الخروج'}
      </button>
    </section>
  );
}
