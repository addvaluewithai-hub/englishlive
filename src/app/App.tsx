import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { OttiMark } from '../character/otti/OttiMark';
import { ProductIcon } from '../components/ProductIcon';
import { AccountScreen } from '../screens/AccountScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';
import { FreeSpeakScreen } from '../screens/FreeSpeakScreen';
import { FreeSpeakSessionScreen } from '../screens/FreeSpeakSessionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { LevelScreen } from '../screens/LevelScreen';
import { LessonReviewScreen } from '../screens/LessonReviewScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SceneLessonCompleteScreen } from '../screens/SceneLessonCompleteScreen';
import { SceneLessonScreen } from '../screens/SceneLessonScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { StudioCurriculumScreen } from '../screens/StudioCurriculumScreen';
import { StudioScreen } from '../screens/StudioScreen';
import { UnitScreen } from '../screens/UnitScreen';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'v2-nav-link is-active' : 'v2-nav-link';

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname.startsWith('/auth/');
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isStudio = location.pathname.startsWith('/studio');
  const isCompletion = location.pathname.startsWith('/lesson-complete/');
  const isLegacySession = location.pathname.startsWith('/session/');
  const isLesson = location.pathname.startsWith('/lesson/');
  const isSceneLesson = location.pathname.startsWith('/scene-lesson/');
  const isFreeSpeakSession = /^\/speak\/[^/]+/.test(location.pathname);
  const isSession = isLegacySession || isLesson || isSceneLesson || isFreeSpeakSession;
  const isReview = location.pathname.startsWith('/review/') || location.pathname.startsWith('/lesson-review/');
  const isApp = !isLanding && !isAuth && !isOnboarding && !isStudio && !isSession && !isReview;
  const usesProductV2 = isApp || isAuth || isOnboarding || isSceneLesson || isStudio;
  const showProductHeader = isApp && !isCompletion;
  const hideGlobalHeader = isLanding || isAuth || isOnboarding || isStudio || isCompletion || isSceneLesson;
  const showBottomNav = isApp && !isCompletion;

  return (
    <div className={`app-shell${isSession ? ' is-session' : ''}${isSceneLesson ? ' is-scene-lesson' : ''}${isFreeSpeakSession ? ' is-free-speak-session' : ''}${isCompletion ? ' is-completion' : ''}${isLanding ? ' is-landing' : ''}${isStudio ? ' is-studio' : ''}${usesProductV2 ? ' is-product-v2' : ''}`}>
      {hideGlobalHeader ? null : showProductHeader ? (
        <header className="v2-app-header">
          <Link to="/home" className="v2-brand" aria-label="Englotti home">
            <span className="v2-brand-mark" aria-hidden="true"><OttiMark /></span>
            <span>Englotti</span>
          </Link>
          <Link className="v2-icon-button" to="/account" aria-label="حسابي">
            <ProductIcon name="profile" size={24} />
          </Link>
        </header>
      ) : (
        <header className="app-header">
          <Link to="/home" className="brand" aria-label="Englotti home">
            <span className="brand-mark" aria-hidden="true"><OttiMark /></span>
            <span>Englotti</span>
          </Link>
          {isSession ? (
            <Link className="header-action quiet-link" to={isFreeSpeakSession ? '/speak' : '/learn'}>
              {isFreeSpeakSession ? 'الرجوع للمحادثة' : 'Leave session'}
            </Link>
          ) : isReview ? (
            <Link className="header-action quiet-link" to="/learn">Back to Learn</Link>
          ) : null}
        </header>
      )}

      <main className={isSceneLesson ? 'app-main app-main-session v2-scene-main' : isSession ? 'app-main app-main-session' : usesProductV2 ? 'v2-app-main' : 'app-main'}>
        {isStudio ? (
          <nav className="studio-global-nav" aria-label="Studio navigation" dir="rtl">
            <Link className={location.pathname === '/studio' ? 'is-active' : ''} to="/studio">JSON Authoring</Link>
            <Link className={location.pathname === '/studio/curriculum' ? 'is-active' : ''} to="/studio/curriculum">المنهج</Link>
            <Link to="/home">تطبيق المتعلم</Link>
          </nav>
        ) : null}
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/auth/sign-in" element={<AuthScreen mode="sign-in" />} />
          <Route path="/auth/sign-up" element={<AuthScreen mode="sign-up" />} />
          <Route path="/onboarding" element={<RequireAuth requireProfile={false}><OnboardingScreen /></RequireAuth>} />
          <Route path="/studio" element={<RequireAuth requireProfile={false}><StudioScreen /></RequireAuth>} />
          <Route path="/studio/curriculum" element={<RequireAuth requireProfile={false}><StudioCurriculumScreen /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><HomeScreen /></RequireAuth>} />
          <Route path="/learn" element={<RequireAuth><LearnScreen /></RequireAuth>} />
          <Route path="/learn/level/:levelId" element={<RequireAuth><LevelScreen /></RequireAuth>} />
          <Route path="/learn/unit/:unitId" element={<RequireAuth><UnitScreen /></RequireAuth>} />
          <Route path="/lesson/:lessonId" element={<RequireAuth><LessonScreen /></RequireAuth>} />
          <Route path="/scene-lesson/:lessonId" element={<RequireAuth><SceneLessonScreen /></RequireAuth>} />
          <Route path="/lesson-complete/:lessonId" element={<RequireAuth><SceneLessonCompleteScreen /></RequireAuth>} />
          <Route path="/lesson-review/:runId" element={<RequireAuth><LessonReviewScreen /></RequireAuth>} />
          <Route path="/speak" element={<RequireAuth><FreeSpeakScreen /></RequireAuth>} />
          <Route path="/speak/:modeId" element={<RequireAuth><FreeSpeakSessionScreen /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><ProgressScreen /></RequireAuth>} />
          <Route path="/characters" element={<RequireAuth><CharacterSelectScreen /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><AccountScreen /></RequireAuth>} />
          <Route path="/session/:missionId" element={<RequireAuth><SessionScreen /></RequireAuth>} />
          <Route path="/review/:sessionId" element={<RequireAuth><ReviewScreen /></RequireAuth>} />
          <Route path="*" element={<LandingScreen />} />
        </Routes>
      </main>

      {showBottomNav ? (
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
