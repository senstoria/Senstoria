import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { registerServiceWorker } from './lib/pwa.ts';
import './index.css';

// Fase N11: iOS Safari hanya menyalakan :active (press feedback) bila
// halaman punya listener touchstart — tanpa ini seluruh umpan balik
// tekan berbasis :active/active: berisiko tidak pernah menyala di
// iPhone (motion-spec §1.3). Listener no-op, pasif, sekali seumur app.
document.addEventListener('touchstart', () => {}, { passive: true });

// Tahap 3 PWA (26 Nov 2026): service worker app-shell, production only.
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
