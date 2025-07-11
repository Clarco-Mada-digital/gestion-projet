import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { store } from './store/store';
import AppInitializer from './components/AppInitializer';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <AppInitializer>
          <App />
        </AppInitializer>
      </Router>
    </Provider>
  </StrictMode>
);
