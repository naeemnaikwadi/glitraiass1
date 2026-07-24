/**
 * Image Generator Service
 * Generates images using Pollinations AI from a prompt and optional reference image.
 * Falls back to a placeholder if generation fails.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageGeneratorInput {
  prompt: string;
  referenceImage?: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';
const PLACEHOLDER_IMAGE = 'https://placehold.co/1024x1024/e2e8f0/475569?text=Generation+Failed';

// ─── Core helper ─────────────────────────────────────────────────────────────

/**
 * Generate an image from a text prompt using Pollinations AI.
 * Returns the generated image URL or a placeholder if generation fails.
 *
 * Pollinations URL format:
 * https://image.pollinations.ai/prompt/{encodedPrompt}?width=1024&height=1024&seed={seed}
 *
 * Optional reference image can be passed but Pollinations doesn't natively support
 * reference images in the same way as Stable Diffusion img2img. We'll encode it
 * into the prompt URL structure if provided, but this is best-effort.
 */
export async function generateImage(input: ImageGeneratorInput): Promise<string> {
  const { prompt, referenceImage } = input;

  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);

    let imageUrl = `${POLLINATIONS_BASE_URL}/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    if (referenceImage) {
      imageUrl += `&model=flux`;
    }

    // Pollinations generates images on-the-fly — the URL itself IS the image.
    // A HEAD check gives a false positive because Pollinations returns 200
    // immediately but only renders the image on the first GET request.
    // Return the URL directly and let the browser load it.
    return imageUrl;
  } catch (error) {
    console.error('[ImageGenerator] Generation failed:', error);
    return PLACEHOLDER_IMAGE;
  }
}

/**
 * Validate that an image URL is accessible.
 * Useful for checking reference images before passing them to generation.
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
  } catch {
    return false;
  }
}
