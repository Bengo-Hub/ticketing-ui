"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, PlusCircle, Tags } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/useCategories";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button, Input } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { Category } from "@/types/tickets";
import { buildCategoryColumns } from "./categories-columns";

function CategorySheet({
  orgSlug,
  category,
  categories,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  category: Category | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [parentId, setParentId] = useState(category?.parent_id ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [active, setActive] = useState(category?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateCategory(orgSlug);
  const update = useUpdateCategory(orgSlug);
  const pending = create.isPending || update.isPending;

  // A category cannot be its own parent.
  const parentOptions = categories
    .filter((c) => c.id !== category?.id)
    .map((c) => ({ value: c.id, label: c.name }));

  const save = async () => {
    setError(null);
    const sort = /^\d+$/.test(sortOrder.trim()) ? Number(sortOrder) : NaN;
    if (name.trim().length < 2) return setError("The category name needs at least 2 characters.");
    if (Number.isNaN(sort)) return setError("Order must be a whole number.");
    try {
      if (category) {
        await update.mutateAsync({
          id: category.id,
          data: {
            name: name.trim(),
            description: description.trim(),
            parent_id: parentId || undefined,
            sort_order: sort,
            is_active: active,
          },
        });
        toast.success("Category updated");
      } else {
        await create.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          parent_id: parentId || undefined,
          sort_order: sort,
        });
        toast.success("Category created");
      }
      onOpenChange(false);
    } catch {
      setError("The category could not be saved. The name may already be in use.");
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={category ? `Edit ${category.name}` : "New category"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {category ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" htmlFor="cat-name" required>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Billing" />
        </Field>
        <Field label="Description" htmlFor="cat-desc">
          <Input id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Parent" hint="Leave empty for a top-level category.">
          <SearchableCombobox
            options={parentOptions}
            value={parentId}
            onChange={setParentId}
            placeholder="Top level"
            emptyText="No other categories"
          />
        </Field>
        <Field label="Order" htmlFor="cat-order" hint="Lower numbers are listed first.">
          <Input
            id="cat-order"
            type="number"
            inputMode="numeric"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </Field>
        {category && (
          <SwitchField
            label="Active"
            description="Inactive categories are hidden when raising a ticket."
            checked={active}
            onChange={setActive}
          />
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}

export default function CategoriesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.categoriesManage);
  const { data: categories = [], isLoading, isError, refetch } = useCategories(orgSlug);
  const deleteCategory = useDeleteCategory(orgSlug);

  const [editing, setEditing] = useState<Category | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<Category | null>(null);

  const parentName = useCallback((id?: string) => (id ? categories.find((c) => c.id === id)?.name : undefined), [categories]);
  const columns = useMemo(
    () =>
      buildCategoryColumns({
        parentName,
        canManage,
        onEdit: (c) => {
          setEditing(c);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [parentName, canManage],
  );

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deleteCategory.mutateAsync(removing.id);
      toast.success("Category deleted");
      setRemoving(null);
    } catch {
      // The API refuses to delete a category that still has sub-categories or tickets.
      toast.error("The category could not be deleted. Move its tickets and sub-categories first, or mark it inactive.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: "Admin" }}
        icon={Tags}
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" /> New category
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={categories}
        rowKey={(c) => c.id}
        defaultSort={{ key: "sort_order", dir: "asc" }}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText="No categories yet."
        onRowClick={
          canManage
            ? (c) => {
                setEditing(c);
                setSheetOpen(true);
              }
            : undefined
        }
        maxBodyHeight={false}
      />

      {sheetOpen && (
        <CategorySheet
          key={editing?.id ?? "new"}
          orgSlug={orgSlug}
          category={editing}
          categories={categories}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Delete ${removing?.name ?? "category"}?`}
        description="A category with tickets or sub-categories cannot be deleted; mark it inactive instead."
        confirmLabel="Delete category"
        loading={deleteCategory.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
