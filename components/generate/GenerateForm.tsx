'use client';

import { useState } from 'react';
import { Button, Input, Textarea, ImageUpload } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export type GenerateFormValues = {
  productName:    string;
  description:    string;
  referenceImageUrl: string;
};

type FieldErrors = Partial<Record<keyof GenerateFormValues | 'referenceImage' | 'file', string>>;

type Props = {
  onJobCreated: (jobId: string) => void;
};

const EMPTY: GenerateFormValues = {
  productName:       '',
  description:       '',
  referenceImageUrl: '',
};

export function GenerateForm({ onJobCreated }: Props) {
  const { toast } = useToast();
  const [values,     setValues]     = useState<GenerateFormValues>(EMPTY);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [errors,     setErrors]     = useState<FieldErrors>({});
  const [loading,    setLoading]    = useState(false);

  // ── Field updater ─────────────────────────────────────────────────────────
  function set(field: keyof GenerateFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined }));
    };
  }

  function handleFileChange(file: File | null) {
    setUploadFile(file);
    setErrors((er) => ({ ...er, file: undefined, referenceImage: undefined }));
  }

  // ── Client-side validation ────────────────────────────────────────────────
  function validate(): boolean {
    const next: FieldErrors = {};

    if (!values.productName.trim()) next.productName = 'Product name is required';
    if (!values.description.trim()) next.description  = 'Description is required';

    const hasFile = uploadFile !== null;
    const hasUrl  = values.referenceImageUrl.trim().length > 0;

    if (!hasFile && !hasUrl) {
      next.referenceImage = 'Provide an uploaded image or a Reference Image URL';
    } else if (!hasFile && hasUrl) {
      try { new URL(values.referenceImageUrl); }
      catch { next.referenceImageUrl = 'Must be a valid URL'; }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('productName', values.productName.trim());
      formData.append('description', values.description.trim());

      if (uploadFile) {
        formData.append('file', uploadFile);
      } else {
        formData.append('referenceImageUrl', values.referenceImageUrl.trim());
      }

      const res  = await fetch('/api/generate', { method: 'POST', body: formData });
      const json = await res.json();

      if (!json.success) {
        if (json.details && typeof json.details === 'object') {
          const fieldErrs: FieldErrors = {};
          for (const [k, v] of Object.entries(json.details)) {
            const msgs = Array.isArray(v) ? v : [String(v)];
            fieldErrs[k as keyof FieldErrors] = msgs[0];
          }
          setErrors(fieldErrs);
        }
        toast(json.error ?? 'Failed to create job', 'error');
        return;
      }

      setValues(EMPTY);
      setUploadFile(null);
      setErrors({});
      toast('Job created — generation started!', 'success');
      onJobCreated(json.data.id);
    } catch {
      toast('Network error. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const hasFile = uploadFile !== null;
  const hasUrl  = values.referenceImageUrl.trim().length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Product Image</CardTitle>
        <CardDescription>
          Describe your product and get a cinematic AI-generated image.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            label="Product Name"
            placeholder="e.g. Wireless Noise-Cancelling Headphones"
            value={values.productName}
            onChange={set('productName')}
            error={errors.productName}
            required
            disabled={loading}
          />

          <Textarea
            label="Description"
            placeholder="Materials, colors, feel, target audience, key features…"
            value={values.description}
            onChange={set('description')}
            error={errors.description}
            required
            disabled={loading}
            rows={4}
          />

          {/* ── Upload field ─────────────────────────────────────────────── */}
          <ImageUpload
            label="Upload Product Image"
            value={uploadFile}
            onChange={handleFileChange}
            error={errors.file}
            disabled={loading}
          />

          {/* ── URL field (shown dimmed when a file is selected) ─────────── */}
          <div className={hasFile ? 'opacity-40 pointer-events-none select-none' : undefined}>
            <Input
              label="Reference Image URL"
              placeholder="https://example.com/product.jpg"
              value={values.referenceImageUrl}
              onChange={set('referenceImageUrl')}
              error={!hasFile ? errors.referenceImageUrl : undefined}
              disabled={loading || hasFile}
              type="url"
              hint={
                hasFile
                  ? 'Disabled — uploaded image takes priority'
                  : hasUrl
                  ? undefined
                  : 'Or paste a public image URL instead of uploading'
              }
            />
          </div>

          {/* Cross-field error (neither upload nor URL) */}
          {errors.referenceImage && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.referenceImage}
            </p>
          )}

          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Submitting…' : 'Generate Image'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
