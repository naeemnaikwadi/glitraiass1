/**
 * Pipeline Service
 *
 *   pending → processing → (Gemini prompt | fallback prompt) → image → completed
 *                                                                     ↘ failed (image error only)
 *
 * The job is NEVER marked failed due to Gemini being unavailable.
 * It is only marked failed if image generation itself fails.
 *
 * Fire-and-forget — never throws. All errors are caught and written to DB.
 */

import { findJobByIdOrThrow, updateJob } from '@/lib/repositories/job.repository';
import { generatePrompt } from '@/lib/services/promptGenerator';
import { generateImage } from '@/lib/services/imageGenerator';
import { logger } from '@/lib/logger';

const CTX = 'Pipeline';

export async function runGenerationPipeline(jobId: string): Promise<void> {
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

    const { prompt: generatedPrompt, usedFallback } = await generatePrompt({
      productName: job.productName,
      description: job.description,
    });

    if (usedFallback) {
      logger.warn('Gemini unavailable. Using fallback prompt.', CTX, { jobId });
    }

    // ── Step 4: generate image ────────────────────────────────────────────
    logger.info('Generating image', CTX, { jobId });

    const generatedImage = await generateImage({
      prompt: generatedPrompt,
      referenceImage: job.referenceImage,
    });

    logger.info('Image generated successfully', CTX, { jobId });

    // ── Step 5: complete ──────────────────────────────────────────────────
    await updateJob(jobId, { status: 'completed', generatedPrompt, generatedImage });
    logger.info('Job completed', CTX, { jobId });

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
  }
}
