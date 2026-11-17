"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { SearchInput, useDebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { useAdminArticleList, useDeleteArticle } from "@/hooks/useKB";
import { flattenPages } from "@/hooks/useTickets";
import { LoadMore } from "@/components/common/load-more";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ARTICLE_STATUS_OPTIONS } from "@/components/kb/ArticleForm";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { ArticleStatus, KBArticle } from "@/types/kb";
import { buildKBColumns } from "./kb-columns";

export default function AdminKBPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.kbManage);

  const [status, setStatus] = useState<ArticleStatus | "">("");
  const search = useDebouncedSearch();
  // Keyset pages: a new term or status starts again from the first page; later pages load on
  // "Load more". There is no total.
  const query = useAdminArticleList({ tenantSlug: orgSlug, status: status || undefined, limit: 25 }, search.term);
  const rows = useMemo(() => flattenPages(query.data), [query.data]);
  const deleteArticle = useDeleteArticle(orgSlug);
  const [removing, setRemoving] = useState<KBArticle | null>(null);

  const columns = useMemo(
    () =>
      buildKBColumns({
        onPreview: (a) => window.open(orgRoute(orgSlug, `/kb/${a.slug}`), "_blank", "noopener"),
        onEdit: canManage ? (a) => router.push(orgRoute(orgSlug, `/admin/kb/${a.id}`)) : undefined,
        onDelete: canManage ? setRemoving : undefined,
      }),
    [orgSlug, canManage, router],
  );

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deleteArticle.mutateAsync(removing.id);
      toast.success("Article deleted");
      setRemoving(null);
    } catch {
      toast.error("The article could not be deleted.");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={BookOpen}
        title="Knowledge base"
        subtitle="Newest first"
        actions={
          canManage ? (
            <Button onClick={() => router.push(orgRoute(orgSlug, "/admin/kb/new"))}>
              <PlusCircle className="h-4 w-4" /> New article
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        loading={query.isLoading}
        loadingRows={5}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyText={search.term || status ? "No articles match these filters." : "No articles yet."}
        onRowClick={canManage ? (a) => router.push(orgRoute(orgSlug, `/admin/kb/${a.id}`)) : undefined}
        storageKey="ticketing.admin-kb.columns"
        maxBodyHeight={false}
        toolbar={
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <SearchInput search={search} busy={query.isFetching && !query.isFetchingNextPage} placeholder="Search articles" />
            <SearchableCombobox
              options={ARTICLE_STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus(v as ArticleStatus | "")}
              placeholder="All statuses"
            />
          </div>
        }
      />
      <LoadMore
        shown={rows.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Delete "${removing?.title ?? "article"}"?`}
        description="This cannot be undone."
        confirmLabel="Delete article"
        loading={deleteArticle.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
