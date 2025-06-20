import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ProjectManager from './components/ProjectManager';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectManager />
  </StrictMode>
);
