import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { LocaleProvider } from './i18n/LocaleProvider';
import { ExperienceProvider } from './ui/theme/ExperienceProvider';
import './ui/theme/tokens.css';
import './styles.css';
import './session-stage.css';
import './m9-shell.css';
import './m9-5-course.css';
import './scene-pilot.css';
import './product-v2.css';
import './product-v2-onboarding.css';
import './product-v2-secondary.css';
import './product-v2-scene.css';
import './product-v2-turn-taking.css';
import './product-v2-completion.css';
import './product-v3-premium.css';
import './product-v4-visual-qa.css';
import './product-v5-final-polish.css';
import './product-v6-session-polish.css';
import './product-v7-final-qa.css';
import './free-speak-v2.css';
import './free-speak-v2-fixes.css';
import './studio.css';
import './studio-curriculum.css';
import './otti.css';
import './lesson-stage-v2.css';
import './lesson-stage-v2-tuning.css';
import './product-v8-pixel-perfect.css';
import './product-v8-fixes.css';
import './product-v9-levels-polish.css';
import './speaking-v1.css';
import './speaking-v1-polish.css';
import './speaking-live-shared.css';
import './speaking-roadmap.css';
import './scene-adaptive.css';
import './guided-speaking.css';
import './speaking-learn-live-tuning.css';
import './practice.css';
import './practice-mission.css';
import './practice-hint-dynamic.css';

const root = document.getElementById('root');
if (!root) throw new Error('Englotti root element was not found.');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <ExperienceProvider>
          <App />
        </ExperienceProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);