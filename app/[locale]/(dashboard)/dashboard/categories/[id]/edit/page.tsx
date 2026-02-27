"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { IconUpload } from "@/components/features/icon-upload";
import { useRoles } from "@/hooks/useRoles";

interface ParentCategory {
  id: string;
  name: string;
}

export default function EditCategoryPage() {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { isAdmin } = useRoles();

  // Admin-only page
  useEffect(() => {
    if (!isAdmin) {
      toast.error(tc("unauthorized"));
      router.replace("/dashboard");
    }
  }, [isAdmin, router, tc]);

  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [iconUrl, setIconUrl] = useState("");
  const [nameTranslations, setNameTranslations] = useState("{}");
  const [descriptionTranslations, setDescriptionTranslations] = useState("{}");
  const [attributesTemplate, setAttributesTemplate] = useState("{}");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  // Fetch category detail
  const { data: categoryDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: queryKeys.categories.detail(categoryId, locale),
    queryFn: () =>
      LivestockTradingAPI.Categories.Detail.Request({
        id: categoryId,
        languageCode: locale,
      }),
    enabled: !!categoryId,
  });

  // Fetch parent categories
  const { data: parentCategories = [], isLoading: isLoadingParents } = useQuery({
    queryKey: queryKeys.categories.pick(locale),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Categories.Pick.Request({
        selectedIds: [],
        keyword: "",
        limit: 100,
        languageCode: locale,
      });
      return response
        .filter((item) => item.id !== categoryId)
        .map((item) => ({ id: item.id, name: item.name })) as ParentCategory[];
    },
  });

  const isLoadingCategory = isLoadingDetail || isLoadingParents;

  // Populate form state when category detail loads
  const formPopulated = useRef(false);
  useEffect(() => {
    if (categoryDetail && !formPopulated.current) {
      formPopulated.current = true;
      setName(categoryDetail.name);
      setSlug(categoryDetail.slug);
      setDescription(categoryDetail.description || "");
      setParentCategoryId(categoryDetail.parentCategoryId || "none");
      setSortOrder(categoryDetail.sortOrder);
      setIsActive(categoryDetail.isActive);
      setIconUrl(categoryDetail.iconUrl || "");
      setNameTranslations(categoryDetail.nameTranslations || "{}");
      setDescriptionTranslations(categoryDetail.descriptionTranslations || "{}");
      setAttributesTemplate(categoryDetail.attributesTemplate || "{}");
    }
  }, [categoryDetail]);

  const validate = (): boolean => {
    const newErrors: { name?: string; slug?: string } = {};
    if (!name.trim()) newErrors.name = t("form.errors.nameRequired");
    if (!slug.trim()) newErrors.slug = t("form.errors.slugRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await LivestockTradingAPI.Categories.Update.Request({
        id: categoryId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        iconUrl: iconUrl.trim(),
        sortOrder,
        isActive,
        parentCategoryId: parentCategoryId === "none" ? undefined : parentCategoryId,
        nameTranslations,
        descriptionTranslations,
        attributesTemplate,
      });

      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      router.push("/dashboard/categories");
    } catch {
      toast.error(t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCategory) {
    return (
      <DashboardLayout title={t("form.editTitle")}>
        <div className="max-w-2xl space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("form.editTitle")}>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("form.name")} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name)
                setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder={t("form.namePlaceholder")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">{t("form.slug")} *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              if (errors.slug)
                setErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            placeholder={t("form.slugPlaceholder")}
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t("form.description")}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("form.descriptionPlaceholder")}
            rows={3}
          />
        </div>

        {/* Parent Category */}
        <div className="space-y-2">
          <Label>{t("form.parentCategory")}</Label>
          <Select
            value={parentCategoryId}
            onValueChange={setParentCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("form.parentCategoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("form.noParent")}</SelectItem>
              {parentCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">{t("form.sortOrder")}</Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
          />
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <Label>{t("form.iconUrl")}</Label>
          <IconUpload value={iconUrl} onChange={setIconUrl} />
        </div>

        {/* Is Active */}
        <div className="flex items-center gap-3">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="isActive">{t("form.isActive")}</Label>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("form.updating")}
              </>
            ) : (
              t("form.submit")
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/categories")}
          >
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
