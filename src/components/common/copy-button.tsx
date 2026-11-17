"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

/**
 * Copies `text` to the clipboard and shows "Copied" for two seconds. The toasts and the button
 * label come from the caller so each place can say what was copied.
 */
export function CopyButton({
  text,
  ariaLabel,
  copiedToast,
  className,
}: {
  text: string;
  ariaLabel: string;
  copiedToast: string;
  className?: string;
}) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(copiedToast);
    } catch {
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void onCopy()}
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? t("common.copied") : t("common.copy")}
    </Button>
  );
}
