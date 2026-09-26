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

const root = document.getElementById('root');
if (!root) throw new Error('Englotti root element was not found.');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
