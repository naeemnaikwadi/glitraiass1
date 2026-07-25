/**
 * Pipeline Service
 *
 *   pending → processing → (Gemini prompt | fallback prompt) → image → completed
 *                                                                     ↘ failed (image error only)
 *
 * The job is NEVER marked failed due to Gemini being unavailable.
 * It is only marked failed if image generation itself fails.
 */

import { findJobByIdOrThrow, updateJob } from '@/lib/repositories/job.repository';
import { generatePrompt } from '@/lib/services/promptGenerator';
import { generateImage } from '@/lib/services/imageGenerator';
import { logger } from '@/lib/logger';

const CTX = 'Pipeline';

// ─── Timing helper ────────────────────────────────────────────────────────────

function elapsed(start: number): string {
  return `${(performance.now() - start).toFixed(0)}ms`;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function runGenerationPipeline(jobId: string): Promise<void> {
  const pipelineStart = performance.now();
  logger.info('Pipeline started', CTX, { jobId });

  // ── Step 1: mark as processing ────────────────────────────────────────────
  try {
    const current = await findJobByIdOrThrow(jobId);

    // Idempotency: skip if already past pending (handles duplicate calls)
    if (current.status === 'processing' || current.status === 'completed' || current.status === 'failed') {
      logger.info(`Pipeline skipped — job already in status "${current.status}"`, CTX, { jobId });
      return;
    }

    await updateJob(jobId, { status: 'processing' });
  } catch (err) {
    logger.error(
      'Failed to set processing status — aborting',
      CTX,
      err instanceof Error ? err : new Error(String(err)),
      { jobId },
    );
    return;
  }

  try {
    // ── Step 2: load job ──────────────────────────────────────────────────
    const job = await findJobByIdOrThrow(jobId);

    // ── Step 3: generate prompt (Gemini → fallback) ───────────────────────
    logger.info('Generating prompt', CTX, { jobId });
    const promptStart = performance.now();

    const { prompt: generatedPrompt, usedFallback } = await generatePrompt({
      productName: job.productName,
      description: job.description,
    });

    logger.info(`Prompt generated in ${elapsed(promptStart)}`, CTX, { jobId });

    if (usedFallback) {
      logger.warn('Gemini unavailable. Using fallback prompt.', CTX, { jobId });
    }

    // ── Step 4: generate image ────────────────────────────────────────────
    logger.info('Generating image', CTX, { jobId });
    const imageStart = performance.now();

    const generatedImage = await generateImage({
      prompt: generatedPrompt,
      referenceImage: job.referenceImage,
    });

    logger.info(`Image generated in ${elapsed(imageStart)}`, CTX, { jobId });

    // ── Step 5: complete ──────────────────────────────────────────────────
    const dbStart = performance.now();
    await updateJob(jobId, { status: 'completed', generatedPrompt, generatedImage });
    logger.info(`Database updated in ${elapsed(dbStart)}`, CTX, { jobId });

    logger.info(`Job completed — total ${elapsed(pipelineStart)}`, CTX, { jobId });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(message, CTX, err instanceof Error ? err : new Error(message), { jobId });

    try {
      await updateJob(jobId, { status: 'failed' });
    } catch (updateErr) {
      logger.error(
        'Failed to write failed status',
        CTX,
        updateErr instanceof Error ? updateErr : new Error(String(updateErr)),
        { jobId },
      );
    }

    logger.info(`Job failed — total ${elapsed(pipelineStart)}`, CTX, { jobId });
  }
}
