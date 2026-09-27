import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
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
import './learn-journey.css';
import './home-redesign.css';
import './studio.css';
import './studio-curriculum.css';
import './otti.css';
import './lesson-stage-v2.css';
import './lesson-stage-v2-tuning.css';
import './product-v8-pixel-perfect.css';
import './product-v8-fixes.css';
import './product-v9-levels-polish.css';

const root = document.getElementById('root');
if (!root) throw new Error('Englotti root element was not found.');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
