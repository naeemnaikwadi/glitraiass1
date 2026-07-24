/**
 * Prompt Generator Service
 *
 * Primary:  Gemini 2.0 Flash — with retry + exponential backoff.
 * Fallback: Local template — used if Gemini is unavailable for any reason.
 *
 * The service never throws due to Gemini being unavailable.
 * It only throws if the fallback itself errors (should never happen).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const CTX = 'PromptService';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 s, doubles each retry

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

// ─── Retry helper ─────────────────────────────────────────────────────────────

function isRetryable(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.includes('503') || msg.includes('500');
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
      const retryable = isRetryable(err);

      if (retryable && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1); // 2s → 4s → 8s
        logger.warn(`Gemini attempt ${attempt}/${MAX_RETRIES} failed. Retrying.`, CTX, { attempt, delay });
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  // Surface a clean error message — no raw API response, no stack trace
  const reason = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(reason);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates an image prompt.
 *
 * Tries Gemini first. If Gemini fails for any reason (quota, network, invalid
 * key, timeout, empty response), logs a concise warning and returns a
 * locally-generated fallback prompt instead.
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
