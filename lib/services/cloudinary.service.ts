/**
 * Cloudinary Upload Service
 * Uploads a file buffer to Cloudinary and returns the secure URL.
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';

const CTX = 'CloudinaryService';

// ─── Configure once ───────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  try {
    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         'glitrai/reference-images',
          public_id:      `ref_${Date.now()}_${filename.replace(/\.[^.]+$/, '')}`,
          resource_type:  'image',
          transformation: [{ width: 2048, height: 2048, crop: 'limit' }],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('No result from Cloudinary'));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });

    logger.info('Image uploaded to Cloudinary', CTX);
    return url;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Cloudinary upload failed', CTX, err instanceof Error ? err : new Error(message));
    throw new AppError('Failed to upload image. Please try again.', 500, 'CLOUDINARY_ERROR');
  }
}
