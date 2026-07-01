"use client";

import { useMemo, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { cn } from "@/components/ui";

type FileUploadProps = {
  name: string;
  label: string;
  accept?: string;
  required?: boolean;
  multiple?: boolean;
  hint?: string;
  maxSizeMb?: number;
};

export function FileUpload({ name, label, accept = "image/png,image/jpeg,image/webp", required, multiple, hint, maxSizeMb = 8 }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const previewUrl = useMemo(() => file && file.type.startsWith("image/") ? URL.createObjectURL(file) : "", [file]);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-forest">{label}</span>
      <span className={cn(
        "focus-within:ring-2 focus-within:ring-forest/40 block rounded-3xl border border-dashed border-forest/20 bg-white/75 p-4 shadow-sm",
        error && "border-red-300 bg-red-50"
      )}>
        <input
          className="sr-only"
          name={name}
          type="file"
          accept={accept}
          required={required}
          multiple={multiple}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files || []);
            const nextFile = files[0] || null;
            const tooLarge = files.find((selected) => selected.size > maxSizeMb * 1024 * 1024);
            if (tooLarge) {
              event.currentTarget.value = "";
              setFile(null);
              setError(`Every file must be ${maxSizeMb} MB or smaller.`);
              return;
            }
            if (nextFile && nextFile.size > maxSizeMb * 1024 * 1024) {
              event.currentTarget.value = "";
              setFile(null);
              setError(`File must be ${maxSizeMb} MB or smaller.`);
              return;
            }
            setFile(nextFile);
            setError("");
          }}
        />
        {previewUrl ? (
          <span className="block overflow-hidden rounded-2xl border border-forest/10 bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={`${label} preview`} className="h-44 w-full object-cover" />
          </span>
        ) : (
          <span className="grid min-h-36 place-items-center rounded-2xl bg-sand text-center">
            <span>
              <ImagePlus className="mx-auto h-7 w-7 text-sage" />
              <span className="mt-2 block font-black text-forest">Tap to upload file</span>
              <span className="mt-1 block text-xs text-charcoal/60">{hint || `PNG, JPG, or WEBP up to ${maxSizeMb} MB.`}</span>
            </span>
          </span>
        )}
        {file && (
          <span className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/80 p-3 text-sm">
            <span>
              <span className="block font-bold text-forest">{file.name}</span>
              <span className="text-xs text-charcoal/60">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </span>
            <span className="inline-flex items-center gap-2 text-sage">
              <RefreshCw className="h-4 w-4" /> Replace
            </span>
          </span>
        )}
        {error && <span className="mt-2 flex items-center gap-2 text-sm font-bold text-red-700"><X className="h-4 w-4" /> {error}</span>}
      </span>
    </label>
  );
}
