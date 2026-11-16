"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

/**
 * Footer of a keyset list: how many rows are on screen and a button for the next page. Keyset
 * lists have no total, so the count is of loaded rows only and the button shows while the API
 * says more exist.
 */
export function LoadMore({
  shown,
  hasMore,
  loading,
  onLoadMore,
  label,
  className,
}: {
  shown: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** Button text; "Load more" when absent. */
  label?: string;
  className?: string;
}) {
  const { t } = useT();
  if (shown === 0 && !hasMore) return null;
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2", className)}>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {hasMore ? t("list.shownMore", { n: shown }) : t("list.shownAll", { n: shown })}
      </p>
      {hasMore && (
        <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {label ?? t("list.loadMore")}
        </Button>
      )}
    </div>
  );
}
