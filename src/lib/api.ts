import type { Benefit } from '../app/data/benefitsData';

export type AnswerMap = Record<string, string>;
export type ChecklistProgressMap = Record<string, boolean[]>;

export type PacketRequestPayload = {
  profile: AnswerMap;
  matchedBenefits?: Benefit[];
  selectedBenefits: string[];
  checklistProgress: ChecklistProgressMap;
};

export type PacketResult = {
  url?: string;
  pdfBase64?: string;
  filename?: string;
  runId?: string;
};

type ApiObject = Record<string, unknown>;

const DEFAULT_API_TIMEOUT_MS = 15_000;

function isApiObject(value: unknown): value is ApiObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canUseWindow() {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined';
}

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isAllowedDownloadHost(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  return (
    normalizedHostname.endsWith('.amazonaws.com') ||
    normalizedHostname.endsWith('.cloudfront.net')
  );
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function getErrorMessage(payload: ApiObject, fallback: string): string {
  return firstString(payload.error, payload.message, payload.detail) ?? fallback;
}

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) {
    throw new Error('API URL is missing.');
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  const parsed = canUseWindow()
    ? new URL(trimmed, window.location.origin)
    : new URL(trimmed);

  const isLocal = isLoopbackHost(parsed.hostname);

  if (!isLocal && parsed.protocol !== 'https:') {
    throw new Error('API URL must use HTTPS outside local development.');
  }

  if (canUseWindow() && !import.meta.env.DEV && !isLocal) {
    if (parsed.origin !== window.location.origin) {
      throw new Error('API URL must stay on the same origin in production.');
    }
  }

  return parsed.toString();
}

function normalizeDownloadUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) {
    throw new Error('Download URL is missing.');
  }

  const parsed = canUseWindow()
    ? new URL(trimmed, window.location.origin)
    : new URL(trimmed);

  const isLocal = isLoopbackHost(parsed.hostname);

  if (!isLocal && parsed.protocol !== 'https:') {
    throw new Error('Download URL must use HTTPS outside local development.');
  }

  if (isLocal) {
    return parsed.toString();
  }

  if (canUseWindow() && parsed.origin === window.location.origin) {
    return parsed.toString();
  }

  if (isAllowedDownloadHost(parsed.hostname)) {
    return parsed.toString();
  }

  throw new Error('Download URL origin is not allowed.');
}

function getEligibilityApiUrl(): string {
  return normalizeApiUrl(
    import.meta.env.VITE_ELIGIBILITY_API_URL?.trim() || '/api/eligibility/check'
  );
}

function getPacketApiUrl(): string {
  return normalizeApiUrl(
    import.meta.env.VITE_PACKET_API_URL?.trim() || '/api/packet'
  );
}

async function readApiPayload(
  response: Response,
  apiName: string
): Promise<ApiObject> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {};
  }

  let parsedOuter: unknown;
  try {
    parsedOuter = JSON.parse(rawText);
  } catch {
    throw new Error(`${apiName} returned invalid JSON.`);
  }

  if (!isApiObject(parsedOuter)) {
    throw new Error(`${apiName} returned an unexpected response shape.`);
  }

  const body = parsedOuter.body;
  if (typeof body === 'string' && body.trim()) {
    try {
      const parsedBody = JSON.parse(body);
      if (isApiObject(parsedBody)) {
        return { ...parsedOuter, ...parsedBody };
      }
    } catch {
      return parsedOuter;
    }
  }

  return parsedOuter;
}

function createTimeoutController(timeoutMs = DEFAULT_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeoutId),
  };
}

async function postJson(
  apiUrl: string,
  payload: unknown,
  apiName: string
): Promise<{ response: Response; payload: ApiObject }> {
  const { signal, cleanup } = createTimeoutController();

  try {
    let response: Response;

    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        redirect: 'error',
        referrerPolicy: 'strict-origin-when-cross-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`${apiName} timed out. Please try again.`);
      }

      throw new Error(`${apiName} request failed. Please try again.`);
    }

    const parsedPayload = await readApiPayload(response, apiName);
    return { response, payload: parsedPayload };
  } finally {
    cleanup();
  }
}

export async function evaluateEligibilityRequest(
  profile: AnswerMap,
  selectedBenefits: string[] = []
): Promise<Benefit[]> {
  const requestPayload =
    selectedBenefits.length > 0
      ? { profile, selectedBenefits }
      : { profile };

  const { response, payload } = await postJson(
    getEligibilityApiUrl(),
    requestPayload,
    'Eligibility API'
  );

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Failed to evaluate eligibility.'));
  }

  const rawMatches =
    payload.matchedBenefits ??
    payload.matched_benefits ??
    payload.matches ??
    payload.benefits;

  if (!Array.isArray(rawMatches)) {
    throw new Error('Eligibility API returned an invalid matches payload.');
  }

  return rawMatches as Benefit[];
}

export async function generatePacketRequest(
  payload: PacketRequestPayload
): Promise<PacketResult> {
  const { response, payload: parsedPayload } = await postJson(
    getPacketApiUrl(),
    payload,
    'Packet API'
  );

  if (!response.ok) {
    throw new Error(getErrorMessage(parsedPayload, 'Failed to generate PDF packet.'));
  }

  const rawUrl = firstString(
    parsedPayload.download_url,
    parsedPayload.url,
    parsedPayload.presigned_url,
    parsedPayload.location
  );

  const normalizedUrl = rawUrl ? normalizeDownloadUrl(rawUrl) : undefined;

  return {
    url: normalizedUrl,
    pdfBase64: normalizedUrl
      ? undefined
      : firstString(parsedPayload.pdf_base64, parsedPayload.pdfBase64),
    filename: firstString(parsedPayload.filename) ?? 'CommonMASS-Packet.pdf',
    runId: firstString(parsedPayload.run_id, parsedPayload.runId),
  };
}