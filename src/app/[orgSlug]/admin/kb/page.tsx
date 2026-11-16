"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { SearchInput, useDebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { useAdminArticleSearch, useDeleteArticle } from "@/hooks/useKB";
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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [status, setStatus] = useState<ArticleStatus | "">("");
  const search = useDebouncedSearch({ onTermChange: () => setPage(1) });
  const query = useAdminArticleSearch({ tenantSlug: orgSlug, status: status || undefined, page, limit }, search.term);
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

  const total = query.data?.total ?? 0;

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
        subtitle={`${total} articles`}
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
        rows={query.data?.data ?? []}
        rowKey={(a) => a.id}
        loading={query.isLoading}
        loadingRows={5}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyText={search.term || status ? "No articles match these filters." : "No articles yet."}
        onRowClick={canManage ? (a) => router.push(orgRoute(orgSlug, `/admin/kb/${a.id}`)) : undefined}
        storageKey="ticketing.admin-kb.columns"
        maxBodyHeight={false}
        page={page}
        totalPages={Math.max(1, Math.ceil(total / limit))}
        onPageChange={setPage}
        total={total}
        pageSize={limit}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
        toolbar={
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <SearchInput search={search} busy={query.isFetching} placeholder="Search articles" />
            <SearchableCombobox
              options={ARTICLE_STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v as ArticleStatus | "");
                setPage(1);
              }}
              placeholder="All statuses"
            />
          </div>
        }
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
