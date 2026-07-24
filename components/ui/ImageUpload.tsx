'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT = '.jpg,.jpeg,.png,.webp';

export type ImageUploadProps = {
  label?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
};

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP.';
  }
  if (file.size > MAX_BYTES) {
    return 'File too large. Maximum size is 5 MB.';
  }
  return null;
}

export function ImageUpload({ label, value, onChange, error, disabled }: ImageUploadProps) {
  const inputRef       = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error ?? localError ?? undefined;

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setLocalError(err);
        onChange(null);
        return;
      }
      setLocalError(null);
      onChange(file);
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDrag(true);
  };

  const handleRemove = () => {
    onChange(null);
    setLocalError(null);
  };

  const previewUrl = value ? URL.createObjectURL(value) : null;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}

      {value && previewUrl ? (
        /* ── Preview ──────────────────────────────────────────────────── */
        <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative h-48 w-full">
            <Image
              src={previewUrl}
              alt="Upload preview"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
              {value.name}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="ml-3 shrink-0 rounded p-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none dark:hover:bg-red-900/20"
              aria-label="Remove selected image"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ────────────────────────────────────────────────── */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload product image"
          aria-disabled={disabled}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDrag(false)}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              inputRef.current?.click();
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2',
            'rounded-lg border-2 border-dashed px-4 py-8 text-center',
            'transition-colors duration-150',
            drag
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/20'
              : displayError
              ? 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/20'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-slate-800/40',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          {/* Upload icon */}
          <svg
            className="h-8 w-8 text-slate-400 dark:text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Drag &amp; drop or{' '}
              <span className="text-blue-600 dark:text-blue-400">browse</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              JPG, JPEG, PNG, WEBP — max 5 MB
            </p>
          </div>
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      {displayError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {displayError}
        </p>
      )}
    </div>
  );
}
