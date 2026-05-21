/**
 * GazeTalk — API client for the FastAPI backend
 */
import { BACKEND_URL, LanguageId, LANGUAGES } from '../config';

/** Check if backend is reachable */
export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
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

/** Translate text between languages using backend NLLB model */
export async function translateText(
  text: string,
  srcLang: LanguageId,
  tgtLang: LanguageId,
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      src_lang: LANGUAGES[srcLang].nllbCode,
      tgt_lang: LANGUAGES[tgtLang].nllbCode,
    }),
  });

  if (!res.ok) {
    throw new Error(`Translation failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.translated_text) {
    return data.translated_text;
  }
  throw new Error('No translation returned');
}


