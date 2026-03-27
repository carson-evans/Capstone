export type AnalyticsConsentState = 'granted' | 'denied' | 'unknown';

declare global {
  interface Window {
    AwsRum?: new (
      applicationId: string,
      applicationVersion: string,
      applicationRegion: string,
      config: {
        allowCookies: boolean;
        endpoint: string;
        sessionSampleRate: number;
        telemetries: string[];
        signing: boolean;
      }
    ) => unknown;
  }
}

const ANALYTICS_CONSENT_KEY = 'commonmass_analytics_consent';

let awsRumInstance: unknown;
let rumInitAttempted = false;

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredAnalyticsConsent(): AnalyticsConsentState {
  if (!canUseBrowserStorage()) {
    return 'unknown';
  }

  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);

  if (value === 'granted' || value === 'denied') {
    return value;
  }

  return 'unknown';
}

export function setAnalyticsConsent(
  nextValue: Exclude<AnalyticsConsentState, 'unknown'>
) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextValue);

  if (nextValue === 'granted') {
    void initRum();
  }
}

export function shouldEnableRumByConfig() {
  return import.meta.env.VITE_ENABLE_RUM === 'true' && !import.meta.env.DEV;
}

export function maybeInitRumFromStoredConsent() {
  if (!shouldEnableRumByConfig()) {
    return;
  }

  if (getStoredAnalyticsConsent() === 'granted') {
    void initRum();
  }
}

export async function initRum() {
  if (!shouldEnableRumByConfig()) return;
  if (awsRumInstance || rumInitAttempted) return;

  rumInitAttempted = true;

  try {
    if (typeof window === 'undefined') {
      return;
    }

    const AwsRum = window.AwsRum;

    if (!AwsRum) {
      console.warn('AWS RUM SDK was not found on window. Monitoring remains disabled.');
      return;
    }

    const applicationId = import.meta.env.VITE_RUM_APP_ID?.trim();
    const applicationVersion =
      import.meta.env.VITE_RUM_APP_VERSION?.trim() || '1.0.0';
    const applicationRegion =
      import.meta.env.VITE_RUM_REGION?.trim() || 'us-east-1';

    if (!applicationId) {
      console.warn('RUM app id is missing. Monitoring remains disabled.');
      return;
    }

    const rawSampleRate = Number(
      import.meta.env.VITE_RUM_SESSION_SAMPLE_RATE ?? '0.25'
    );
    const sessionSampleRate = Number.isFinite(rawSampleRate)
      ? Math.min(Math.max(rawSampleRate, 0), 1)
      : 0.25;

    const enableHttpTelemetry = import.meta.env.VITE_RUM_ENABLE_HTTP === 'true';

    awsRumInstance = new AwsRum(applicationId, applicationVersion, applicationRegion, {
      allowCookies: false,
      endpoint: `https://dataplane.rum.${applicationRegion}.amazonaws.com`,
      sessionSampleRate,
      telemetries: enableHttpTelemetry
        ? ['errors', 'performance', 'http']
        : ['errors', 'performance'],
      signing: false,
    });
  } catch (error) {
    console.error('Failed to initialize AWS RUM:', error);
  }
}