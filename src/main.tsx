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

const root = document.getElementById('root');
if (!root) throw new Error('EnglishLive root element was not found.');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
