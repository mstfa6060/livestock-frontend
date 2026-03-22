"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useRoles } from "@/hooks/useRoles";
import { useCategories } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ──────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  parentCategoryId?: string;
  subCategoryCount: number;
  productCount: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  parentCategoryId?: string;
  iconUrl: string;
}

type StatusFilter = "all" | "active" | "inactive";

// ─── Helpers ────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function buildTree(categories: Category[]): Map<string | null, Category[]> {
  const map = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const parentId = cat.parentCategoryId ?? null;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId)!.push(cat);
  }
  // Sort children by sortOrder
  for (const [, children] of map) {
    children.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return map;
}

// ─── Tree Row Component ─────────────────────────────────
function CategoryRow({
  category,
  tree,
  depth,
  expandedIds,
  toggleExpand,
  onEdit,
  onAddChild,
  onToggleStatus,
  onDelete,
  t,
  statusFilter,
}: {
  category: Category;
  tree: Map<string | null, Category[]>;
  depth: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void;
  onAddChild: (parentId: string) => void;
  onToggleStatus: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  t: ReturnType<typeof useTranslations>;
  statusFilter: StatusFilter;
}) {
  const children = tree.get(category.id) ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category.id);

  // Filter by status
  if (statusFilter === "active" && !category.isActive) return null;
  if (statusFilter === "inactive" && category.isActive) return null;

  return (
    <>
      <div
        className="grid grid-cols-[1fr_80px_80px_80px_48px] gap-2 px-4 py-2.5 border-t items-center hover:bg-muted/30 transition-colors"
      >
        {/* Name with tree indent */}
        <div className="flex items-center gap-1 min-w-0" style={{ paddingLeft: `${depth * 24}px` }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(category.id)}
              className="p-0.5 rounded hover:bg-muted shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium truncate text-sm">{category.name}</p>
            {category.description && (
              <p className="text-xs text-muted-foreground truncate">{category.description}</p>
            )}
          </div>
        </div>

        {/* Sort Order */}
        <div className="text-center text-sm text-muted-foreground">
          {category.sortOrder}
        </div>

        {/* Product Count */}
        <div className="text-center text-sm text-muted-foreground">
          {category.productCount}
        </div>

        {/* Status */}
        <div className="text-center">
          <Badge variant={category.isActive ? "default" : "secondary"} className="text-xs">
            {category.isActive ? t("filters.active") : t("filters.inactive")}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(category.id)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("actions.addChild")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(category)}>
                {category.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t("actions.deactivate")}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("actions.activate")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Render children if expanded */}
      {isExpanded &&
        children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            tree={tree}
            depth={depth + 1}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            t={t}
            statusFilter={statusFilter}
          />
        ))}
    </>
  );
}

// ─── Category Form Dialog ───────────────────────────────
function CategoryFormDialog({
  open,
  onOpenChange,
  editCategory,
  parentId,
  allCategories,
  onSubmit,
  isSubmitting,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCategory: Category | null;
  parentId: string | null;
  allCategories: Category[];
  onSubmit: (data: CategoryFormData, editId?: string) => Promise<void>;
  isSubmitting: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    isActive: true,
    parentCategoryId: undefined,
    iconUrl: "",
  });
  const [slugManual, setSlugManual] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    setSlugManual(false);
    setErrors({});

    if (editCategory) {
      setForm({
        name: editCategory.name,
        slug: editCategory.slug,
        description: editCategory.description,
        sortOrder: editCategory.sortOrder,
        isActive: editCategory.isActive,
        parentCategoryId: editCategory.parentCategoryId,
        iconUrl: editCategory.iconUrl || "",
      });
      setSlugManual(true); // Don't auto-slug on edit
    } else {
      // Find max sortOrder among siblings
      const siblings = allCategories.filter((c) =>
        parentId ? c.parentCategoryId === parentId : !c.parentCategoryId
      );
      const maxSort = siblings.reduce((max, c) => Math.max(max, c.sortOrder), 0);

      setForm({
        name: "",
        slug: "",
        description: "",
        sortOrder: maxSort + 1,
        isActive: true,
        parentCategoryId: parentId ?? undefined,
        iconUrl: "",
      });
    }
  }, [open, editCategory, parentId, allCategories]);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManual ? prev.slug : slugify(value),
    }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSlugChange = (value: string) => {
    setForm((prev) => ({ ...prev, slug: value }));
    setSlugManual(true);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; slug?: string } = {};
    if (!form.name.trim()) newErrors.name = t("form.errors.nameRequired");
    if (!form.slug.trim()) newErrors.slug = t("form.errors.slugRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form, editCategory?.id);
  };

  const isEdit = !!editCategory;
  const parentName = parentId
    ? allCategories.find((c) => c.id === parentId)?.name
    : null;

  // Build parent options: only root categories + siblings at same level
  const parentOptions = allCategories.filter((c) => !c.parentCategoryId && c.id !== editCategory?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parent info */}
          {parentName && !isEdit && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
              {t("form.parentCategory")}: <span className="font-medium text-foreground">{parentName}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">{t("form.name")} *</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t("form.namePlaceholder")}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">{t("form.slug")} *</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder={t("form.slugPlaceholder")}
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">{t("form.description")}</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("form.descriptionPlaceholder")}
              rows={2}
            />
          </div>

          {/* Parent Category (only for edit or root-level create) */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label>{t("form.parentCategory")}</Label>
              <Select
                value={form.parentCategoryId ?? "none"}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, parentCategoryId: v === "none" ? undefined : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.parentCategoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("form.noParent")}</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">{t("form.sortOrder")}</Label>
              <Input
                id="cat-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                min={0}
              />
            </div>

            {/* Active */}
            <div className="flex items-end gap-3 pb-1">
              <Switch
                id="cat-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
              />
              <Label htmlFor="cat-active">{t("form.isActive")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? t("form.updating") : t("form.submitting")}
                </>
              ) : (
                t("form.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function CategoriesPage() {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { isAdmin, isLoaded: rolesLoaded } = useRoles();
  const queryClient = useQueryClient();

  // Admin-only page
  useEffect(() => {
    if (rolesLoaded && !isAdmin) {
      toast.error(tc("unauthorized"));
      router.replace("/dashboard");
    }
  }, [isAdmin, rolesLoaded, router, tc]);

  // Fetch ALL categories (listAll: true for tree view)
  const { data: categoriesRaw, isLoading } = useCategories(locale);

  const allCategories: Category[] = useMemo(
    () =>
      (categoriesRaw ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        iconUrl: c.iconUrl || "",
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        parentCategoryId: c.parentCategoryId || undefined,
        subCategoryCount: c.subCategoryCount || 0,
        productCount: c.productCount || 0,
      })),
    [categoriesRaw]
  );

  const tree = useMemo(() => buildTree(allCategories), [allCategories]);
  const rootCategories = tree.get(null) ?? [];

  // UI State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [addChildParentId, setAddChildParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set(allCategories.filter((c) => (tree.get(c.id)?.length ?? 0) > 0).map((c) => c.id));
    setExpandedIds(all);
  };

  const collapseAll = () => setExpandedIds(new Set());

  // ─── CRUD handlers ─────────────────────────────────
  const handleOpenCreate = (parentId: string | null = null) => {
    setEditCategory(null);
    setAddChildParentId(parentId);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditCategory(cat);
    setAddChildParentId(null);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (data: CategoryFormData, editId?: string) => {
    setIsSubmitting(true);
    try {
      if (editId) {
        // Fetch current detail to preserve translations
        const detail = await LivestockTradingAPI.Categories.Detail.Request({
          id: editId,
          languageCode: locale,
        });
        await LivestockTradingAPI.Categories.Update.Request({
          id: editId,
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description.trim(),
          iconUrl: data.iconUrl.trim(),
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          parentCategoryId: data.parentCategoryId,
          nameTranslations: detail.nameTranslations || "{}",
          descriptionTranslations: detail.descriptionTranslations || "{}",
          attributesTemplate: detail.attributesTemplate || "{}",
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.Categories.Create.Request({
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description.trim(),
          iconUrl: data.iconUrl.trim(),
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          parentCategoryId: data.parentCategoryId,
          nameTranslations: "{}",
          descriptionTranslations: "{}",
          attributesTemplate: "{}",
        });
        toast.success(t("createSuccess"));

        // Auto-expand parent so new child is visible
        if (data.parentCategoryId) {
          setExpandedIds((prev) => new Set([...prev, data.parentCategoryId!]));
        }
      }

      setFormDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : editId ? t("updateError") : t("createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const detail = await LivestockTradingAPI.Categories.Detail.Request({
        id: cat.id,
        languageCode: locale,
      });
      await LivestockTradingAPI.Categories.Update.Request({
        id: cat.id,
        name: detail.name,
        slug: detail.slug,
        description: detail.description,
        iconUrl: detail.iconUrl,
        sortOrder: detail.sortOrder,
        isActive: !cat.isActive,
        parentCategoryId: detail.parentCategoryId || undefined,
        nameTranslations: detail.nameTranslations || "{}",
        descriptionTranslations: detail.descriptionTranslations || "{}",
        attributesTemplate: detail.attributesTemplate || "{}",
      });
      toast.success(!cat.isActive ? t("activateSuccess") : t("deactivateSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("statusError"));
    }
  };

  const handleDeleteClick = (cat: Category) => {
    setCategoryToDelete(cat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await LivestockTradingAPI.Categories.Delete.Request({ id: categoryToDelete.id });
      toast.success(t("deleteSuccess"));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteError"));
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FolderTree className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              <SelectItem value="active">{t("filters.active")}</SelectItem>
              <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={expandAll}>
            {t("expandAll")}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            {t("collapseAll")}
          </Button>
        </div>

        <Button onClick={() => handleOpenCreate(null)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t("addNew")}
        </Button>
      </div>

      {/* Tree Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : rootCategories.length === 0 ? (
        <div className="text-center py-16">
          <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-4">{t("noCategories")}</p>
          <Button onClick={() => handleOpenCreate(null)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("createFirst")}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_48px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div>{t("table.name")}</div>
            <div className="text-center">{t("table.sortOrder")}</div>
            <div className="text-center">{t("table.products")}</div>
            <div className="text-center">{t("table.status")}</div>
            <div />
          </div>

          {/* Tree Rows */}
          {rootCategories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              tree={tree}
              depth={0}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={handleOpenEdit}
              onAddChild={(parentId) => handleOpenCreate(parentId)}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteClick}
              t={t}
              statusFilter={statusFilter}
            />
          ))}
        </div>
      )}

      {/* Category count */}
      {!isLoading && allCategories.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {t("totalCount", { count: allCategories.length })}
        </p>
      )}

      {/* Create/Edit Dialog */}
      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        editCategory={editCategory}
        parentId={addChildParentId}
        allCategories={allCategories}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        t={t}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete && (tree.get(categoryToDelete.id)?.length ?? 0) > 0
                ? t("deleteDialog.hasChildren")
                : t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
