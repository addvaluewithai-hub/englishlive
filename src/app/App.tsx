import { Link, NavLink, Route, Routes, matchPath, useLocation } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { OttiMark } from '../character/otti/OttiMark';
import { ProductIcon } from '../components/ProductIcon';
import { AccountScreen } from '../screens/AccountScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';
import { FreeSpeakRecapScreen } from '../screens/FreeSpeakRecapScreen';
import { FreeSpeakSessionScreen } from '../screens/FreeSpeakSessionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { LearnV2LessonScreen } from '../screens/LearnV2LessonScreen';
import { LegacyLearnPilotRedirect } from '../screens/LegacyLearnPilotRedirect';
import { LevelScreen } from '../screens/LevelScreen';
import { LessonReviewScreen } from '../screens/LessonReviewScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PracticeCompleteScreen } from '../screens/PracticeCompleteScreen';
import { PracticeHomeScreen } from '../screens/PracticeHomeScreen';
import { PracticeLiveScreen } from '../screens/PracticeLiveScreen';
import { PracticeMissionScreen } from '../screens/PracticeMissionScreen';
import { PracticeWorldScreen } from '../screens/PracticeWorldScreen';
import { PrimaryProgressScreen as ProgressScreen } from '../screens/PrimaryProgressScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SceneLessonCompleteScreen } from '../screens/SceneLessonCompleteScreen';
import { SceneLessonScreen } from '../screens/SceneLessonScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { SpeakingLiveEntryScreen } from '../screens/SpeakingLiveEntryScreen';
import { SpeakingProgressScreen } from '../screens/SpeakingProgressScreen';
import { SpeakingRecapScreen } from '../screens/SpeakingRecapScreen';
import { SpeakingScenarioScreen } from '../screens/SpeakingScenarioScreen';
import { SpeakingWorldScreen } from '../screens/SpeakingWorldScreen';
import { StudioCurriculumScreen } from '../screens/StudioCurriculumScreen';
import { StudioScreen } from '../screens/StudioScreen';
import { UnitScreen } from '../screens/UnitScreen';
import { AppLayout } from '../ui/layouts/AppLayout';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'v2-nav-link is-active' : 'v2-nav-link';

export function App() {
  const location = useLocation();
  // Opt in per migrated route. Legacy selectors never wrap the new UI.
  if (matchPath('/home', location.pathname)) {
    return <AppLayout><RequireAuth><HomeScreen /></RequireAuth></AppLayout>;
  }
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname.startsWith('/auth/');
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isStudio = location.pathname.startsWith('/studio');
  const isCompletion = location.pathname.startsWith('/lesson-complete/');
  const isLegacySession = location.pathname.startsWith('/session/');
  const isLesson = location.pathname.startsWith('/lesson/');
  const isSceneLesson = location.pathname.startsWith('/scene-lesson/');
  const isPracticeLive = location.pathname.startsWith('/practice/live/');
  const isFreeSpeakRecap = location.pathname.startsWith('/speak/recap/');
  const isSpeakingRecap = location.pathname.startsWith('/speak/scenario-recap/');
  const isSpeakingScenario = location.pathname.startsWith('/speak/scenario/');
  const isSpeakingLive = location.pathname.startsWith('/speak/live/');
  const isFreeSpeakSession = /^\/speak\/(?!recap(?:\/|$)|scenario-recap(?:\/|$)|world(?:\/|$)|scenario(?:\/|$)|progress(?:\/|$)|live(?:\/|$))[^/]+/.test(location.pathname);
  const isSession = isLegacySession || isLesson || isSceneLesson || isFreeSpeakSession || isSpeakingLive || isPracticeLive;
  const isReview = location.pathname.startsWith('/review/') || location.pathname.startsWith('/lesson-review/');
  const isApp = !isLanding && !isAuth && !isOnboarding && !isStudio && !isSession && !isReview && !isSpeakingScenario;
  const usesProductV2 = isApp || isAuth || isOnboarding || isSceneLesson || isStudio || isFreeSpeakSession || isSpeakingScenario || isSpeakingLive || isPracticeLive;
  const showProductHeader = isApp && !isCompletion;
  const hideGlobalHeader = isLanding || isAuth || isOnboarding || isStudio || isCompletion || isSceneLesson || isFreeSpeakSession || isSpeakingScenario || isSpeakingLive || isPracticeLive;
  const showBottomNav = isApp && !isCompletion;

  return (
    <div className={`app-shell${isSession ? ' is-session' : ''}${isSceneLesson ? ' is-scene-lesson' : ''}${isFreeSpeakSession ? ' is-free-speak-session' : ''}${isSpeakingLive ? ' is-speaking-live' : ''}${isPracticeLive ? ' is-practice-live' : ''}${isSpeakingScenario ? ' is-speaking-scenario' : ''}${isFreeSpeakRecap ? ' is-free-speak-recap' : ''}${isSpeakingRecap ? ' is-speaking-recap' : ''}${isCompletion ? ' is-completion' : ''}${isLanding ? ' is-landing' : ''}${isStudio ? ' is-studio' : ''}${usesProductV2 ? ' is-product-v2' : ''}`}>
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
            <Link className="header-action quiet-link" to={isFreeSpeakSession || isSpeakingLive || isPracticeLive ? '/practice' : '/learn'}>
              {isFreeSpeakSession || isSpeakingLive || isPracticeLive ? 'الرجوع للتدريب' : 'Leave session'}
            </Link>
          ) : isReview ? (
            <Link className="header-action quiet-link" to="/learn">Back to Learn</Link>
          ) : null}
        </header>
      )}

      <main className={isSceneLesson ? 'app-main app-main-session v2-scene-main' : isFreeSpeakSession ? 'app-main app-main-session free-speak-v2-main' : isSpeakingLive || isPracticeLive ? 'app-main app-main-session sp-live-main' : isSpeakingScenario ? 'v2-app-main sp-start-main' : isSession ? 'app-main app-main-session' : usesProductV2 ? 'v2-app-main' : 'app-main'}>
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
          <Route path="/learn" element={<RequireAuth><LearnScreen /></RequireAuth>} />
          <Route path="/learn/lesson/:lessonId" element={<RequireAuth><LearnV2LessonScreen /></RequireAuth>} />
          <Route path="/learn/pilot/:lessonId" element={<RequireAuth><LegacyLearnPilotRedirect /></RequireAuth>} />
          <Route path="/learn/level/:levelId" element={<RequireAuth><LevelScreen /></RequireAuth>} />
          <Route path="/learn/unit/:unitId" element={<RequireAuth><UnitScreen /></RequireAuth>} />
          <Route path="/lesson/:lessonId" element={<RequireAuth><LessonScreen /></RequireAuth>} />
          <Route path="/scene-lesson/:lessonId" element={<RequireAuth><SceneLessonScreen /></RequireAuth>} />
          <Route path="/lesson-complete/:lessonId" element={<RequireAuth><SceneLessonCompleteScreen /></RequireAuth>} />
          <Route path="/lesson-review/:runId" element={<RequireAuth><LessonReviewScreen /></RequireAuth>} />
          <Route path="/practice" element={<RequireAuth><PracticeHomeScreen /></RequireAuth>} />
          <Route path="/practice/:levelId/world/:worldId" element={<RequireAuth><PracticeWorldScreen /></RequireAuth>} />
          <Route path="/practice/mission/:missionId" element={<RequireAuth><PracticeMissionScreen /></RequireAuth>} />
          <Route path="/practice/live/:missionId" element={<RequireAuth><PracticeLiveScreen /></RequireAuth>} />
          <Route path="/practice/complete/:missionId" element={<RequireAuth><PracticeCompleteScreen /></RequireAuth>} />
          <Route path="/speak" element={<RequireAuth><PracticeHomeScreen /></RequireAuth>} />
          <Route path="/speak/world/:worldId" element={<RequireAuth><SpeakingWorldScreen /></RequireAuth>} />
          <Route path="/speak/scenario/:scenarioId" element={<RequireAuth><SpeakingScenarioScreen /></RequireAuth>} />
          <Route path="/speak/live/:scenarioId" element={<RequireAuth><SpeakingLiveEntryScreen /></RequireAuth>} />
          <Route path="/speak/progress" element={<RequireAuth><SpeakingProgressScreen /></RequireAuth>} />
          <Route path="/speak/scenario-recap/:sessionId" element={<RequireAuth><SpeakingRecapScreen /></RequireAuth>} />
          <Route path="/speak/recap/:sessionId" element={<RequireAuth><FreeSpeakRecapScreen /></RequireAuth>} />
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
          <NavLink to="/practice" className={navClass}><ProductIcon name="speak" /><span>التدريب</span></NavLink>
          <NavLink to="/account" className={navClass}><ProductIcon name="profile" /><span>حسابي</span></NavLink>
        </nav>
      ) : null}
    </div>
  );
}
