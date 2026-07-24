import { type NextRequest, after } from 'next/server';
import { apiSuccess, apiError, withHandler, type RouteContext } from '@/lib/api-response';
import { parseGenerateJobBody } from '@/lib/validation/job.validation';
import { initiateGenerateJob } from '@/lib/services/job.service';
import { uploadToCloudinary } from '@/lib/services/cloudinary.service';
import { logger } from '@/lib/logger';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/generate
 *
 * Accepts two content types:
 *   - application/json        { productName, description, referenceImage }
 *   - multipart/form-data     productName, description, referenceImageUrl?, file?
 *
 * Priority: uploaded file > referenceImageUrl
 * At least one of file or referenceImageUrl must be provided.
 *
 * Returns 201 with { id, status, createdAt } — poll /api/jobs/:id for updates.
 */
export const POST = withHandler(async (req: NextRequest, _ctx: RouteContext) => {
  const contentType = req.headers.get('content-type') ?? '';
  let productName:    string;
  let description:    string;
  let referenceImage: string;

  if (contentType.includes('multipart/form-data')) {
    // ── Multipart path ──────────────────────────────────────────────────────
    const formData = await req.formData().catch(() => null);
    if (!formData) return apiError('Invalid multipart form data', 400);

    productName  = String(formData.get('productName')     ?? '').trim();
    description  = String(formData.get('description')     ?? '').trim();
    const urlField = String(formData.get('referenceImageUrl') ?? '').trim();
    const file     = formData.get('file');

    if (!productName) return apiError('Validation failed', 422, { productName: ['productName is required'] }, 'VALIDATION_ERROR');
    if (!description) return apiError('Validation failed', 422, { description: ['description is required'] }, 'VALIDATION_ERROR');

    if (file instanceof File && file.size > 0) {
      // Validate file
      if (!ALLOWED_TYPES.has(file.type)) {
        return apiError('Invalid file type. Allowed: JPG, JPEG, PNG, WEBP.', 422, undefined, 'INVALID_FILE_TYPE');
      }
      if (file.size > MAX_BYTES) {
        return apiError('File too large. Maximum size is 5 MB.', 422, undefined, 'FILE_TOO_LARGE');
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      referenceImage = await uploadToCloudinary(buffer, file.name);
    } else if (urlField) {
      try { new URL(urlField); } catch {
        return apiError('Validation failed', 422, { referenceImageUrl: ['Must be a valid URL'] }, 'VALIDATION_ERROR');
      }
      referenceImage = urlField;
    } else {
      return apiError(
        'Validation failed',
        422,
        { referenceImage: ['Provide an uploaded image or a Reference Image URL'] },
        'VALIDATION_ERROR',
      );
    }
  } else {
    // ── JSON path (backward-compatible) ────────────────────────────────────
    const raw = await req.json().catch(() => null);
    const body = parseGenerateJobBody(raw);
    productName    = body.productName;
    description    = body.description;
    referenceImage = body.referenceImage;
  }

  const job = await initiateGenerateJob({ productName, description, referenceImage });
  logger.info('Job created', 'POST /api/generate', { jobId: job.id });

  after(() => {
    logger.debug('after() — pipeline running', 'POST /api/generate', { jobId: job.id });
  });

  return apiSuccess(job, 'Job created successfully', 201);
});
