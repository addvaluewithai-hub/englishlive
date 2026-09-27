import { apiUrl } from '../config/api';

export interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(apiUrl('/api/health'), {
    headers: { accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`EnglishLive API health check failed (${response.status}).`);
  return response.json() as Promise<HealthResponse>;
}
