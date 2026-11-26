import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { registerServiceWorker } from './lib/pwa.ts';
import './index.css';

// Tahap 3 PWA (26 Nov 2026): service worker app-shell, production only.
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
