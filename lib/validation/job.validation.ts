import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

// ─── Schema ───────────────────────────────────────────────────────────────────

export const GenerateJobSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(1, 'productName is required')
    .max(200, 'productName must be 200 characters or fewer'),

  description: z
    .string()
    .trim()
    .min(1, 'description is required')
    .max(2000, 'description must be 2000 characters or fewer'),

  // Resolved before reaching this validator — always a valid URL at this point.
  referenceImage: z
    .string()
    .trim()
    .min(1, 'referenceImage is required')
    .url('referenceImage must be a valid URL'),
});

export type GenerateJobBody = z.infer<typeof GenerateJobSchema>;

// ─── Validator ────────────────────────────────────────────────────────────────

export function parseGenerateJobBody(body: unknown): GenerateJobBody {
  const result = GenerateJobSchema.safeParse(body);

  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_root';
      (fields[key] ??= []).push(issue.message);
    }
    throw new ValidationError('Validation failed', fields);
  }

  return result.data;
}
