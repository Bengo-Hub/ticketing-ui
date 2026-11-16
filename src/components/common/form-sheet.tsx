"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormSheetSize = "sm" | "md" | "lg";

// Pick the size from what the form holds: sm for a field or two, md for a standard form, lg for
// two columns or several sections.
const WIDTH: Record<FormSheetSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/**
 * The one form container. Phones get a bottom sheet that scrolls inside and clears the home
 * indicator; from `sm` up it is a panel on the right edge whose width follows `size`.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  size?: FormSheetSize;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col bg-card text-card-foreground shadow-xl outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl",
            "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:rounded-none sm:border-l sm:border-border",
            WIDTH[size],
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Form"}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-5 sm:pb-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
