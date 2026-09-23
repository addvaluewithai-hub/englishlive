import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SessionScreen } from '../screens/SessionScreen';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'app-nav-link is-active' : 'app-nav-link';

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isSession = location.pathname.startsWith('/session/');
  const isApp = !isLanding && !isOnboarding && !isSession;

  return (
    <div className={`app-shell${isSession ? ' is-session' : ''}${isLanding ? ' is-landing' : ''}`}>
      <header className="app-header">
        <Link to={isApp ? '/home' : '/'} className="brand" aria-label="EnglishLive home">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span>EnglishLive</span>
        </Link>

        {isLanding ? (
          <Link className="header-action" to="/onboarding">Start speaking</Link>
        ) : isOnboarding ? (
          <Link className="header-action quiet-link" to="/">Not now</Link>
        ) : isSession ? (
          <Link className="header-action quiet-link" to="/home">Leave session</Link>
        ) : (
          <nav className="desktop-nav" aria-label="Primary navigation">
            <NavLink end to="/home" className={navClass}>Home</NavLink>
            <NavLink to="/characters" className={navClass}>Partners</NavLink>
          </nav>
        )}
      </header>

      <main className={isSession ? 'app-main app-main-session' : 'app-main'}>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/characters" element={<CharacterSelectScreen />} />
          <Route path="/session/:missionId" element={<SessionScreen />} />
          <Route path="*" element={<LandingScreen />} />
        </Routes>
      </main>

      {isApp ? (
        <nav className="app-nav" aria-label="Primary navigation">
          <NavLink end to="/home" className={navClass}>Home</NavLink>
          <NavLink to="/characters" className={navClass}>Partners</NavLink>
        </nav>
      ) : null}
    </div>
  );
}
