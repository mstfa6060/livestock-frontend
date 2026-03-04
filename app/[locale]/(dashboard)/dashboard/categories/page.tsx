"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PlusCircle, MoreVertical, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "inactive";

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
  createdAt: Date;
}

export default function CategoriesPage() {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { isAdmin, isLoaded: rolesLoaded } = useRoles();

  // Admin-only page
  useEffect(() => {
    if (rolesLoaded && !isAdmin) {
      toast.error(tc("unauthorized"));
      router.replace("/dashboard");
    }
  }, [isAdmin, rolesLoaded, router, tc]);

  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [extraPages, setExtraPages] = useState<Category[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapCategories = useCallback((response: any[]): Category[] => {
    return response.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      iconUrl: item.iconUrl,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      parentCategoryId: item.parentCategoryId || undefined,
      subCategoryCount: item.subCategoryCount,
      createdAt: item.createdAt,
    }));
  }, []);

  const { data: firstPageData, isLoading } = useQuery({
    queryKey: queryKeys.categories.list(locale),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Categories.All.Request({
        languageCode: locale,
        sorting: { key: "sortOrder", direction: 0 },
        filters: [],
        pageRequest: { currentPage: 1, perPageCount: PAGE_SIZE, listAll: false },
      });
      setHasMore(response.length === PAGE_SIZE);
      setCurrentPage(1);
      setExtraPages([]);
      return mapCategories(response);
    },
  });

  const categories = [...(firstPageData ?? []), ...extraPages];

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await LivestockTradingAPI.Categories.All.Request({
        languageCode: locale,
        sorting: { key: "sortOrder", direction: 0 },
        filters: [],
        pageRequest: { currentPage: nextPage, perPageCount: PAGE_SIZE, listAll: false },
      });
      setHasMore(response.length === PAGE_SIZE);
      setExtraPages((prev) => [...prev, ...mapCategories(response)]);
      setCurrentPage(nextPage);
    } catch {
      toast.error(t("fetchError"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredCategories =
    statusFilter === "all"
      ? categories
      : categories.filter((c) =>
          statusFilter === "active" ? c.isActive : !c.isActive
        );

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await LivestockTradingAPI.Categories.Delete.Request({ id: categoryToDelete });
      toast.success(t("deleteSuccess"));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleToggleStatus = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    try {
      const detail = await LivestockTradingAPI.Categories.Detail.Request({
        id: categoryId,
        languageCode: locale,
      });

      await LivestockTradingAPI.Categories.Update.Request({
        id: categoryId,
        name: detail.name,
        slug: detail.slug,
        description: detail.description,
        iconUrl: detail.iconUrl,
        sortOrder: detail.sortOrder,
        isActive: !category.isActive,
        parentCategoryId: detail.parentCategoryId || undefined,
        nameTranslations: detail.nameTranslations || "{}",
        descriptionTranslations: detail.descriptionTranslations || "{}",
        attributesTemplate: detail.attributesTemplate || "{}",
      });

      toast.success(
        !category.isActive ? t("activateSuccess") : t("deactivateSuccess")
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    } catch {
      toast.error(t("statusError"));
    }
  };

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              <SelectItem value="active">{t("filters.active")}</SelectItem>
              <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button asChild>
          <Link href="/dashboard/categories/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("addNew")}
          </Link>
        </Button>
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg mb-4">
            {t("noCategories")}
          </p>
          <Button asChild>
            <Link href="/dashboard/categories/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("createFirst")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_150px_80px_100px_100px_60px] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
            <div>{t("table.name")}</div>
            <div>{t("table.slug")}</div>
            <div className="text-center">{t("table.sortOrder")}</div>
            <div className="text-center">{t("table.subCategories")}</div>
            <div className="text-center">{t("table.status")}</div>
            <div></div>
          </div>

          {/* Table Body */}
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_150px_80px_100px_100px_60px] gap-2 md:gap-4 px-4 py-3 border-t items-center hover:bg-muted/30 transition-colors"
            >
              {/* Name */}
              <div>
                <p className="font-medium">{category.name}</p>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="text-sm text-muted-foreground truncate">
                <span className="md:hidden font-medium text-foreground mr-1">
                  {t("table.slug")}:
                </span>
                {category.slug}
              </div>

              {/* Sort Order */}
              <div className="text-center text-sm">
                <span className="md:hidden font-medium text-foreground mr-1">
                  {t("table.sortOrder")}:
                </span>
                {category.sortOrder}
              </div>

              {/* Sub Categories */}
              <div className="text-center text-sm">
                <span className="md:hidden font-medium text-foreground mr-1">
                  {t("table.subCategories")}:
                </span>
                {category.subCategoryCount}
              </div>

              {/* Status */}
              <div className="text-center">
                <Badge variant={category.isActive ? "default" : "secondary"}>
                  {category.isActive
                    ? t("filters.active")
                    : t("filters.inactive")}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t("table.actions")}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/categories/${category.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t("actions.edit")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(category.id)}
                    >
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
                      onClick={() => handleDeleteClick(category.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("loadingMore")}
              </>
            ) : (
              t("loadMore")
            )}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
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
