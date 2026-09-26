import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
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

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'app-nav-link is-active' : 'app-nav-link';

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

  return (
    <div className={`app-shell${isSession ? ' is-session' : ''}${isLanding ? ' is-landing' : ''}`}>
      <header className="app-header">
        <Link to={isApp ? '/home' : '/'} className="brand" aria-label="EnglishLive home">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span>EnglishLive</span>
        </Link>

        {isLanding ? (
          <Link className="header-action" to="/onboarding">Start learning</Link>
        ) : isOnboarding ? (
          <Link className="header-action quiet-link" to="/">Not now</Link>
        ) : isSession ? (
          <Link className="header-action quiet-link" to={isFreeSpeakSession ? '/speak' : '/learn'}>Leave session</Link>
        ) : isReview ? (
          <Link className="header-action quiet-link" to="/learn">Back to Learn</Link>
        ) : (
          <nav className="desktop-nav" aria-label="Primary navigation">
            <NavLink end to="/home" className={navClass}>Home</NavLink>
            <NavLink to="/learn" className={navClass}>Learn</NavLink>
            <NavLink end to="/speak" className={navClass}>Speak</NavLink>
            <NavLink to="/progress" className={navClass}>Progress</NavLink>
          </nav>
        )}
      </header>

      <main className={isSession ? 'app-main app-main-session' : 'app-main'}>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/learn" element={<LearnScreen />} />
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
        <nav className="app-nav" aria-label="Primary navigation">
          <NavLink end to="/home" className={navClass}>Home</NavLink>
          <NavLink to="/learn" className={navClass}>Learn</NavLink>
          <NavLink end to="/speak" className={navClass}>Speak</NavLink>
          <NavLink to="/progress" className={navClass}>Progress</NavLink>
        </nav>
      ) : null}
    </div>
  );
}
