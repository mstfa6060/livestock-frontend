"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { IconUpload } from "@/components/features/icon-upload";

interface ParentCategory {
  id: string;
  name: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function NewCategoryPage() {
  const t = useTranslations("categories");
  const tc = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [iconUrl, setIconUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  // Fetch parent categories for dropdown
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await LivestockTradingAPI.Categories.Pick.Request({
          selectedIds: [],
          keyword: "",
          limit: 100,
          languageCode: "tr",
        });
        setParentCategories(
          response.map((item: any) => ({ id: item.id, name: item.name }))
        );
      } catch {
        // Silently fail - parent selection is optional
      }
    };
    fetchParents();
  }, []);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
  };

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
      await LivestockTradingAPI.Categories.Create.Request({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        iconUrl: iconUrl.trim(),
        sortOrder,
        isActive,
        parentCategoryId: parentCategoryId || undefined,
        nameTranslations: "{}",
        descriptionTranslations: "{}",
        attributesTemplate: "{}",
      });

      toast.success(t("createSuccess"));
      router.push("/dashboard/categories");
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title={t("form.newTitle")}
    >
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("form.name")} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
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
            onChange={(e) => handleSlugChange(e.target.value)}
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
                {t("form.submitting")}
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
