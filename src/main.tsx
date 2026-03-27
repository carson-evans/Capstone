import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

async function bootstrap() {
  document.documentElement.lang = 'en';

  try {
    const { maybeInitRumFromStoredConsent } = await import('./lib/rum');
    maybeInitRumFromStoredConsent();
  } catch (error) {
    console.warn('RUM init check failed:', error);
  }

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element #root was not found.');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
