"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/base";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

/** Confirmation for destructive or sensitive actions. Never use window.confirm. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: "danger" | "warning";
  loading?: boolean;
}) {
  const { t } = useT();
  const Icon = variant === "danger" ? Trash2 : TriangleAlert;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl outline-none">
          <div
            className={cn(
              "mb-3 flex h-10 w-10 items-center justify-center rounded-full",
              variant === "danger" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className={cn("mt-1 text-sm text-muted-foreground", !description && "sr-only")}>
            {description ?? title}
          </Dialog.Description>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button variant={variant === "danger" ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel ?? t("common.confirm")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
