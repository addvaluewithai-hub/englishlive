import { NavLink, Route, Routes } from 'react-router-dom';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { runtimePlatform } from '../platform/runtime';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'app-nav-link is-active' : 'app-nav-link';

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand" aria-label="EnglishLive home">
          <span className="brand-mark">EL</span>
          <span>EnglishLive</span>
        </NavLink>
        <span className="runtime-badge">{runtimePlatform()}</span>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/characters" element={<CharacterSelectScreen />} />
          <Route path="/session/:missionId" element={<SessionScreen />} />
          <Route path="*" element={<HomeScreen />} />
        </Routes>
      </main>

      <nav className="app-nav" aria-label="Primary navigation">
        <NavLink end to="/" className={navClass}>Home</NavLink>
        <NavLink to="/characters" className={navClass}>Characters</NavLink>
        <NavLink to="/session/foundation-demo" className={navClass}>Session</NavLink>
      </nav>
    </div>
  );
}
