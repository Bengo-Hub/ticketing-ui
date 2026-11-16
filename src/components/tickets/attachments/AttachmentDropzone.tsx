"use client";

import { useId, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";
import { formatBytes } from "./format";

/** The API takes files up to 10 MB: PDF, text, images, Word and Excel, checked by content. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;
const ACCEPT = ".pdf,.txt,.csv,image/*,.doc,.docx,.xls,.xlsx";

/**
 * Files waiting to go with a reply. Drop them on the box or pick them; files over the limit are
 * refused here with a message rather than after the upload. Staff may keep the files internal.
 */
export function AttachmentDropzone({
  files,
  onChange,
  internal,
  onInternalChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  /** Shown only when the uploader may mark files internal (staff on a public reply). */
  internal?: boolean;
  onInternalChange?: (internal: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useT();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    const ok = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
    const next = [...files, ...ok].slice(0, MAX_FILES);
    if (tooBig.length) setError(t("attachments.tooBig", { name: tooBig[0].name }));
    else if (files.length + ok.length > MAX_FILES) setError(t("attachments.tooMany", { n: MAX_FILES }));
    else setError(null);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) add(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors",
          over ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Paperclip className="h-4 w-4 shrink-0" />
        <span>{t("attachments.drop")}</span>
        <input
          ref={input}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            add(e.target.files);
            if (input.current) input.current.value = "";
          }}
        />
      </label>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex max-w-full items-center gap-1.5 rounded-full bg-secondary py-0.5 pl-2.5 pr-1 text-xs text-secondary-foreground"
            >
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={t("attachments.removeFile", { name: f.name })}
                className="rounded-full p-0.5 hover:bg-background"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && onInternalChange && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!internal}
            onChange={(e) => onInternalChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-input"
          />
          {t("attachments.internalOnly")}
        </label>
      )}
    </div>
  );
}
