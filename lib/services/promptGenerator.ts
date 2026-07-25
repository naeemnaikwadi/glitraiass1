/**
 * Prompt Generator Service
 *
 * Primary:  Gemini 2.0 Flash — with retry + exponential backoff.
 * Fallback: Local template — used if Gemini is unavailable for any reason.
 *
 * Retry policy:
 *   - 429 (quota exceeded) → immediate fallback, no retry (no point waiting)
 *   - 500 / 502 / 503 / 504 / network timeout → retry with exponential backoff
 *   - anything else → immediate fallback, no retry
 *
 * The service never throws due to Gemini being unavailable.
 * It only throws if the fallback itself errors (should never happen).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const CTX = 'PromptService';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 s, doubles each retry: 2 s → 4 s → 8 s

export interface PromptGeneratorInput {
  productName: string;
  description: string;
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface PromptResult {
  prompt: string;
  /** true = Gemini succeeded, false = fallback was used */
  usedFallback: boolean;
}

// ─── Gemini client singleton ──────────────────────────────────────────────────

let _client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  _client ??= new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _client;
}

// ─── Retry classification ─────────────────────────────────────────────────────

/**
 * 429 = quota exceeded — no retry, go straight to fallback.
 * Retrying a quota error just wastes time burning through the timeout budget.
 */
function isQuotaExceeded(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.toLowerCase().includes('quota');
}

/**
 * Transient server/network errors worth retrying:
 * 500 Internal Server Error, 502 Bad Gateway,
 * 503 Service Unavailable, 504 Gateway Timeout,
 * or a network-level failure (fetch threw without an HTTP status).
 */
function isTransient(err: unknown): boolean {
  const msg = String(err);
  return (
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('fetch failed')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Fallback prompt ──────────────────────────────────────────────────────────

/**
 * Generates a deterministic, high-quality product photography prompt
 * from the product name and description alone — no external API needed.
 */
export function generateFallbackPrompt(productName: string, description: string): string {
  return [
    `Professional commercial product photography of a ${productName}`,
    description ? `— ${description}.` : '.',
    'Displayed on a clean premium studio background with soft natural daylight.',
    'Ultra realistic textures, shallow depth of field, luxury lifestyle aesthetic,',
    'high-end advertising photography, 8K resolution.',
  ]
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Gemini generation ────────────────────────────────────────────────────────

/**
 * Attempts to generate a prompt via Gemini with retry on transient errors.
 * Throws immediately on 429 (quota) so the caller can skip to fallback fast.
 * Throws after all retries are exhausted on transient errors.
 */
async function generateWithGemini(input: PromptGeneratorInput): Promise<string> {
  const { productName, description } = input;

  const systemInstruction = [
    'You are a professional AI image-prompt engineer specialising in cinematic product photography.',
    'Given a product name and description, output ONE image-generation prompt.',
    'The prompt MUST include: dramatic lighting, camera lens + angle, materials and textures,',
    'background scene, professional photography style, and high-quality modifiers.',
    'Do NOT explain. Return ONLY the prompt — no preamble, no labels, no markdown.',
  ].join(' ');

  const userMessage = `Product Name: ${productName}\nDescription: ${description}`;

  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = getClient().getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction,
      });

      const result = await model.generateContent(userMessage);
      const text = result.response.text().trim();

      if (!text) throw new Error('Gemini returned an empty response');

      logger.info('Prompt generated via Gemini', CTX);
      return text;
    } catch (err) {
      lastErr = err;

      // ── 429: quota exceeded — bail out immediately, no retry ─────────────
      if (isQuotaExceeded(err)) {
        logger.warn('Gemini quota exceeded (429). Skipping retries.', CTX);
        break;
      }

      // ── Transient error — retry with exponential backoff ─────────────────
      if (isTransient(err) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1); // 2 s → 4 s → 8 s
        logger.warn(
          `Gemini attempt ${attempt}/${MAX_RETRIES} failed (transient). Retrying in ${delay}ms.`,
          CTX,
          { attempt, delay },
        );
        await sleep(delay);
        continue;
      }

      // ── Non-retryable error (4xx other than 429, bad response, etc.) ─────
      break;
    }
  }

  const reason = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(reason);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates an image prompt.
 *
 * Tries Gemini first with the retry policy above.
 * Falls back to a local deterministic template on any failure.
 *
 * Never throws due to Gemini being unavailable.
 */
export async function generatePrompt(input: PromptGeneratorInput): Promise<PromptResult> {
  logger.info('Generating prompt', CTX);

  try {
    const prompt = await generateWithGemini(input);
    return { prompt, usedFallback: false };
  } catch {
    logger.warn('Gemini unavailable. Using fallback prompt.', CTX);
    const prompt = generateFallbackPrompt(input.productName, input.description);
    return { prompt, usedFallback: true };
  }
}
