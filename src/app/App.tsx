import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ProductIcon } from '../components/ProductIcon';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';
import { FreeSpeakScreen } from '../screens/FreeSpeakScreen';
import { FreeSpeakSessionScreen } from '../screens/FreeSpeakSessionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { LessonReviewScreen } from '../screens/LessonReviewScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SceneLessonScreen } from '../screens/SceneLessonScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { UnitScreen } from '../screens/UnitScreen';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'v2-nav-link is-active' : 'v2-nav-link';

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isLegacySession = location.pathname.startsWith('/session/');
  const isLesson = location.pathname.startsWith('/lesson/');
  const isSceneLesson = location.pathname.startsWith('/scene-lesson/');
  const isFreeSpeakSession = /^\/speak\/[^/]+/.test(location.pathname);
  const isSession = isLegacySession || isLesson || isSceneLesson || isFreeSpeakSession;
  const isReview = location.pathname.startsWith('/review/') || location.pathname.startsWith('/lesson-review/');
  const isApp = !isLanding && !isOnboarding && !isSession && !isReview;
  const usesProductV2 = isApp || isOnboarding || isSceneLesson;

  return (
    <div className={`app-shell${isSession ? ' is-session' : ''}${isSceneLesson ? ' is-scene-lesson' : ''}${isLanding ? ' is-landing' : ''}${usesProductV2 ? ' is-product-v2' : ''}`}>
      {isApp ? (
        <header className="v2-app-header">
          <Link to="/home" className="v2-brand" aria-label="EnglishLive home">
            <span className="v2-brand-mark" aria-hidden="true">E</span>
            <span>English<span>Live</span></span>
          </Link>
          <button type="button" className="v2-icon-button" aria-label="Notifications">
            <ProductIcon name="bell" size={25} />
            <span className="v2-notification-dot" />
          </button>
        </header>
      ) : isOnboarding || isSceneLesson ? null : (
        <header className="app-header">
          <Link to={isLanding ? '/' : '/home'} className="brand" aria-label="EnglishLive home">
            <span className="brand-mark" aria-hidden="true">E</span>
            <span>EnglishLive</span>
          </Link>
          {isLanding ? (
            <Link className="header-action" to="/onboarding">Start learning</Link>
          ) : isSession ? (
            <Link className="header-action quiet-link" to={isFreeSpeakSession ? '/speak' : '/learn'}>Leave session</Link>
          ) : isReview ? (
            <Link className="header-action quiet-link" to="/learn">Back to Learn</Link>
          ) : null}
        </header>
      )}

      <main className={isSceneLesson ? 'app-main app-main-session v2-scene-main' : isSession ? 'app-main app-main-session' : usesProductV2 ? 'v2-app-main' : 'app-main'}>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/learn" element={<LearnScreen />} />
          <Route path="/learn/unit/:unitId" element={<UnitScreen />} />
          <Route path="/lesson/:lessonId" element={<LessonScreen />} />
          <Route path="/scene-lesson/:lessonId" element={<SceneLessonScreen />} />
          <Route path="/lesson-review/:runId" element={<LessonReviewScreen />} />
          <Route path="/speak" element={<FreeSpeakScreen />} />
          <Route path="/speak/:modeId" element={<FreeSpeakSessionScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/characters" element={<CharacterSelectScreen />} />
          <Route path="/session/:missionId" element={<SessionScreen />} />
          <Route path="/review/:sessionId" element={<ReviewScreen />} />
          <Route path="*" element={<LandingScreen />} />
        </Routes>
      </main>

      {isApp ? (
        <nav className="v2-bottom-nav" aria-label="Primary navigation" dir="rtl">
          <NavLink end to="/home" className={navClass}><ProductIcon name="home" /><span>الرئيسية</span></NavLink>
          <NavLink to="/learn" className={navClass}><ProductIcon name="learn" /><span>التعلم</span></NavLink>
          <NavLink end to="/speak" className={navClass}><ProductIcon name="speak" /><span>المحادثة</span></NavLink>
          <NavLink to="/progress" className={navClass}><ProductIcon name="profile" /><span>تقدمي</span></NavLink>
        </nav>
      ) : null}
    </div>
  );
}
