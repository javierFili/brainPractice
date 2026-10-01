import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { createServices } from '@/app/composition';
import { GAME_MODULES } from '@/games/registry';
import { cryptoSeedSource } from '@/infrastructure/CryptoSeedSource';
import { openBrowserStorage } from '@/infrastructure/browserStorage';
import { LocalStorageProgressRepository } from '@/infrastructure/LocalStorageProgressRepository';
import { systemClock } from '@/infrastructure/SystemClock';
import './index.css';

const { storage, persistence } = openBrowserStorage();
const services = createServices({
  modules: GAME_MODULES,
  clock: systemClock,
  seeds: cryptoSeedSource,
  progress: new LocalStorageProgressRepository(storage),
  persistence,
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
);
