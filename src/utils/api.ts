/**
 * GazeTalk — API client for the FastAPI backend
 */
import { BACKEND_URL } from '../config';

/** Check if backend is reachable */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send keywords to backend for AI sentence enhancement */
export async function enhanceSentence(keywords: string[]): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  });

  if (!res.ok) {
    throw new Error(`Enhancement failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.sentence) {
    return data.sentence;
  }
  throw new Error('No sentence returned');
}


