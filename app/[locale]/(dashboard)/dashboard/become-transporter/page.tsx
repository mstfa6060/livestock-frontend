"use client";

import { useState } from "react";
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
import { useTransporterByUserId, useCountries } from "@/hooks/queries";
import { toast } from "sonner";
import { Loader2, Truck, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { becomeTransporterFormSchema, type BecomeTransporterFormData } from "@/lib/validations";

export default function BecomeTransporterPage() {
  const router = useRouter();
  const t = useTranslations("becomeTransporter");
  const { user, refreshSession } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BecomeTransporterFormData>({
    resolver: zodResolver(becomeTransporterFormSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: user?.email ?? "",
      phone: "",
      city: "",
      countryCode: "",
      description: "",
      serviceRegions: "",
      specializations: "",
    },
  });

  const { data: transporterData, isLoading: isCheckingTransporter } = useTransporterByUserId(
    user?.id ?? "",
    { enabled: !!user?.id }
  );
  const existingTransporter = transporterData?.id ? { id: transporterData.id } : null;

  const { data: countries } = useCountries();

  const onSubmit = async (data: BecomeTransporterFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await LivestockTradingAPI.Transporters.Create.Request({
        userId: user.id,
        companyName: data.companyName,
        contactPerson: data.contactPerson || "",
        email: data.email,
        phone: data.phone,
        address: "",
        city: data.city,
        countryCode: data.countryCode,
        logoUrl: "",
        description: data.description || "",
        licenseNumber: "",
        taxNumber: "",
        insuranceInfo: "",
        fleetInfo: "",
        serviceRegions: data.serviceRegions || "",
        specializations: data.specializations || "",
        isActive: true,
        website: "",
        certifications: "",
        documentUrls: "",
      });

      // Refresh JWT to include new Transporter role before navigating
      await refreshSession();
      toast.success(t("success"));
      router.push("/dashboard/transport");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingTransporter) {
    return (
      <DashboardLayout title={t("title")}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // If user already has a transporter profile
  if (existingTransporter) {
    return (
      <DashboardLayout title={t("title")}>
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("alreadyTransporter")}</h2>
            <p className="text-muted-foreground mb-6">{t("alreadyTransporterDescription")}</p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/dashboard/transport">{t("goToTransport")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {t("companyInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("companyName")} *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder={t("companyNamePlaceholder")}
                className={errors.companyName ? "border-destructive" : ""}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">{t("contactPerson")}</Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder={t("contactPersonPlaceholder")}
                className={errors.contactPerson ? "border-destructive" : ""}
              />
              {errors.contactPerson && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("descriptionPlaceholder")}
                rows={4}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive flex items-center gap-1">
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
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder={t("emailPlaceholder")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")} *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder={t("phonePlaceholder")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("phoneHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t("city")} *</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder={t("cityPlaceholder")}
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.city.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryCode">{t("countryCode")} *</Label>
              <Controller
                name="countryCode"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.countryCode ? "border-destructive" : ""}>
                      <SelectValue placeholder={t("countryCodePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.countryCode && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.countryCode.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("serviceInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceRegions">{t("serviceRegions")}</Label>
              <Input
                id="serviceRegions"
                {...register("serviceRegions")}
                placeholder={t("serviceRegionsPlaceholder")}
                className={errors.serviceRegions ? "border-destructive" : ""}
              />
              {errors.serviceRegions && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.serviceRegions.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("serviceRegionsHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specializations">{t("specializations")}</Label>
              <Input
                id="specializations"
                {...register("specializations")}
                placeholder={t("specializationsPlaceholder")}
                className={errors.specializations ? "border-destructive" : ""}
              />
              {errors.specializations && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.specializations.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("specializationsHelp")}
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
