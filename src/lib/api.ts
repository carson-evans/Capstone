import type { Benefit } from '@/app/data/benefitsData';

export type AnswerMap = Record<string, string>;
export type ChecklistProgressMap = Record<string, boolean[]>;

export type PacketRequestPayload = {
  profile: AnswerMap;
  matchedBenefits: Benefit[];
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

function isApiObject(value: unknown): value is ApiObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function getErrorMessage(payload: ApiObject, fallback: string): string {
  return firstString(payload.error, payload.message, payload.detail) ?? fallback;
}

async function readApiPayload(response: Response, apiName: string): Promise<ApiObject> {
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
        return {
          ...parsedOuter,
          ...parsedBody,
        };
      }
    } catch {
      return parsedOuter;
    }
  }

  return parsedOuter;
}

function getEligibilityApiUrl(): string {
  return import.meta.env.VITE_ELIGIBILITY_API_URL?.trim() || '/api/eligibility/check';
}

function getPacketApiUrl(): string {
  return import.meta.env.VITE_PACKET_API_URL?.trim() || '/api/packet';
}

export async function evaluateEligibilityRequest(profile: AnswerMap): Promise<Benefit[]> {
  const response = await fetch(getEligibilityApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile }),
  });

  const payload = await readApiPayload(response, 'Eligibility API');

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Failed to evaluate eligibility.'));
  }

  const rawMatches =
    payload.matchedBenefits ?? payload.matched_benefits ?? payload.matches ?? payload.benefits;

  if (!Array.isArray(rawMatches)) {
    throw new Error('Eligibility API returned an invalid matches payload.');
  }

  return rawMatches as Benefit[];
}

export async function generatePacketRequest(
  payload: PacketRequestPayload
): Promise<PacketResult> {
  const response = await fetch(getPacketApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const parsedPayload = await readApiPayload(response, 'Packet API');

  if (!response.ok) {
    throw new Error(getErrorMessage(parsedPayload, 'Failed to generate PDF packet.'));
  }

  return {
    url: firstString(
      parsedPayload.download_url,
      parsedPayload.url,
      parsedPayload.presigned_url,
      parsedPayload.location
    ),
    pdfBase64: firstString(parsedPayload.pdf_base64, parsedPayload.pdfBase64),
    filename: firstString(parsedPayload.filename),
    runId: firstString(parsedPayload.run_id, parsedPayload.runId),
  };
}