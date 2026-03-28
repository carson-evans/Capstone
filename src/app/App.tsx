import React from 'react';
import { Link, RouterProvider } from 'react-router';
import { Toaster } from 'sonner';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  getStoredAnalyticsConsent,
  setAnalyticsConsent,
  shouldEnableRumByConfig,
} from '../lib/rum';
import { router } from './routes';

function AnalyticsConsentBanner() {
  const [consent, setConsent] = React.useState(() => getStoredAnalyticsConsent());

  if (!shouldEnableRumByConfig() || consent !== 'unknown') {
    return null;
  }

  return (
    <section
      aria-labelledby="analytics-consent-title"
      aria-describedby="analytics-consent-description analytics-consent-links"
      className="fixed inset-x-4 bottom-4 z-[120] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-900"
    >
      <h2
        id="analytics-consent-title"
        className="text-base font-semibold text-slate-900 dark:text-slate-100"
      >
        Performance monitoring preference
      </h2>

      <p
        id="analytics-consent-description"
        className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
      >
        CommonMASS can use privacy-conscious performance monitoring to detect
        application errors and reliability issues. Monitoring stays off unless you
        choose to allow it.
      </p>

      <p
        id="analytics-consent-links"
        className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
      >
        Read our{' '}
        <Link
          to="/cookies"
          className="font-medium underline underline-offset-4 hover:text-[#1e3a5f] dark:hover:text-sky-200"
        >
          Cookie Policy
        </Link>{' '}
        and{' '}
        <Link
          to="/privacy"
          className="font-medium underline underline-offset-4 hover:text-[#1e3a5f] dark:hover:text-sky-200"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent('granted');
            setConsent('granted');
          }}
          className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f] focus:outline-none focus:ring-4 focus:ring-[#1e3a5f]/25"
        >
          Allow monitoring
        </button>

        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent('denied');
            setConsent('denied');
          }}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Keep it off
        </button>
      </div>
    </section>
  );
}

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <RouterProvider router={router} />
      <AnalyticsConsentBanner />
      <Toaster position="top-center" richColors theme={theme} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}