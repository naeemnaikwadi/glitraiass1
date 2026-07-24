import { type NextRequest } from 'next/server';
import { apiSuccess, apiError, withHandler, type RouteContext } from '@/lib/api-response';
import { uploadToCloudinary } from '@/lib/services/cloudinary.service';
import { logger } from '@/lib/logger';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload
 * Accepts multipart/form-data with a single "file" field.
 * Uploads to Cloudinary and returns { url }.
 */
export const POST = withHandler(async (req: NextRequest, _ctx: RouteContext) => {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return apiError('Invalid multipart form data', 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return apiError('No file provided. Include a "file" field.', 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return apiError('Invalid file type. Allowed: JPG, JPEG, PNG, WEBP.', 422, undefined, 'INVALID_FILE_TYPE');
  }

  if (file.size > MAX_BYTES) {
    return apiError('File too large. Maximum size is 5 MB.', 422, undefined, 'FILE_TOO_LARGE');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url    = await uploadToCloudinary(buffer, file.name);

  logger.info('Upload complete', 'POST /api/upload');

  return apiSuccess({ url }, 'Image uploaded successfully', 201);
});
