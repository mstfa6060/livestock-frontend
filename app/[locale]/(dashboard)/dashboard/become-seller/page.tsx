"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { toast } from "sonner";
import { Loader2, Store, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { becomeSellerFormSchema, type BecomeSellerFormData } from "@/lib/validations";

export default function BecomeSellerPage() {
  const router = useRouter();
  const t = useTranslations("becomeSeller");
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSeller, setIsCheckingSeller] = useState(true);
  const [existingSeller, setExistingSeller] = useState<{ id: string } | null>(null);

  // Form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BecomeSellerFormData>({
    resolver: zodResolver(becomeSellerFormSchema),
    defaultValues: {
      businessName: "",
      businessType: "individual",
      taxNumber: "",
      description: "",
      phone: "",
      website: "",
    },
  });

  // Check if user already has a seller profile
  useEffect(() => {
    const checkSellerProfile = async () => {
      if (!user?.id) return;

      setIsCheckingSeller(true);
      try {
        // Try to find seller by userId
        const response = await LivestockTradingAPI.Sellers.All.Request({
          sorting: { key: "createdAt", direction: 1 },
          filters: [
            {
              key: "userId",
              type: "guid",
              isUsed: true,
              values: [user.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
        });

        if (response && response.length > 0) {
          setExistingSeller({ id: response[0].id });
        }
      } catch {
        // No seller profile found, which is fine
        console.log("No existing seller profile found");
      } finally {
        setIsCheckingSeller(false);
      }
    };

    checkSellerProfile();
  }, [user?.id]);

  const onSubmit = async (data: BecomeSellerFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await LivestockTradingAPI.Sellers.Create.Request({
        userId: user.id,
        businessName: data.businessName,
        businessType: data.businessType,
        taxNumber: data.taxNumber || "",
        registrationNumber: "",
        description: data.description || "",
        logoUrl: "",
        bannerUrl: "",
        email: user.email,
        phone: data.phone,
        website: data.website || "",
        isActive: true,
        status: 0, // Pending verification
        businessHours: "",
        acceptedPaymentMethods: "",
        returnPolicy: "",
        shippingPolicy: "",
        socialMediaLinks: "",
      });

      toast.success(t("success"));
      router.push("/dashboard/listings/new");
    } catch (error) {
      console.error("Failed to create seller profile:", error);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSeller) {
    return (
      <DashboardLayout title={t("title")}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // If user already has a seller profile
  if (existingSeller) {
    return (
      <DashboardLayout title={t("title")}>
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("alreadySeller")}</h2>
            <Button asChild className="mt-4">
              <Link href="/dashboard/my-listings">{t("goToListings")}</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t("businessInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">{t("businessName")} *</Label>
              <Input
                id="businessName"
                {...register("businessName")}
                placeholder={t("businessNamePlaceholder")}
                className={errors.businessName ? "border-red-500" : ""}
              />
              {errors.businessName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">{t("businessType")} *</Label>
              <Controller
                name="businessType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.businessType ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("businessTypePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        {t("businessTypes.individual")}
                      </SelectItem>
                      <SelectItem value="company">
                        {t("businessTypes.company")}
                      </SelectItem>
                      <SelectItem value="cooperative">
                        {t("businessTypes.cooperative")}
                      </SelectItem>
                      <SelectItem value="farm">{t("businessTypes.farm")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.businessType && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.businessType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNumber">{t("taxNumber")}</Label>
              <Input
                id="taxNumber"
                {...register("taxNumber")}
                placeholder={t("taxNumberPlaceholder")}
                className={errors.taxNumber ? "border-red-500" : ""}
              />
              {errors.taxNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.taxNumber.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                10 veya 11 haneli vergi numaranizi girin (opsiyonel)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("descriptionPlaceholder")}
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")} *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder={t("phonePlaceholder")}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Ornek: +90 555 123 45 67 veya 0555 123 45 67
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">{t("website")}</Label>
              <Input
                id="website"
                type="text"
                {...register("website")}
                placeholder={t("websitePlaceholder")}
                className={errors.website ? "border-red-500" : ""}
              />
              {errors.website && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.website.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Ornek: www.isletmem.com veya https://isletmem.com
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
