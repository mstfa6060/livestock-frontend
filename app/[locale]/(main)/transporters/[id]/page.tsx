"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { TransporterReviews } from "@/components/features/transporter-reviews";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Truck,
  Star,
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Shield,
  Calendar,
  Package,
  CheckCircle,
} from "lucide-react";

interface TransporterDetail {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  countryCode: string;
  logoUrl: string;
  description: string;
  licenseNumber: string;
  insuranceInfo: string;
  fleetInfo: string;
  serviceRegions: string;
  specializations: string;
  isVerified: boolean;
  isActive: boolean;
  averageRating: number | null;
  totalTransports: number;
  completedTransports: number;
  website: string;
  certifications: string;
  createdAt: Date;
}

export default function TransporterDetailPage() {
  const t = useTranslations("transporterDetail");
  const locale = useLocale();
  const params = useParams();
  const id = params.id as string;

  const { data: transporter = null, isLoading, isError: error } = useQuery({
    queryKey: queryKeys.transporters.detail(id),
    queryFn: async () => {
      const response = await LivestockTradingAPI.Transporters.Detail.Request({ id });
      return {
        id: response.id,
        userId: response.userId,
        companyName: response.companyName,
        contactPerson: response.contactPerson,
        email: response.email,
        phone: response.phone,
        address: response.address,
        city: response.city,
        countryCode: response.countryCode,
        logoUrl: response.logoUrl,
        description: response.description,
        licenseNumber: response.licenseNumber,
        insuranceInfo: response.insuranceInfo,
        fleetInfo: response.fleetInfo,
        serviceRegions: response.serviceRegions,
        specializations: response.specializations,
        isVerified: response.isVerified,
        isActive: response.isActive,
        averageRating: response.averageRating as number | null,
        totalTransports: response.totalTransports,
        completedTransports: response.completedTransports,
        website: response.website,
        certifications: response.certifications,
        createdAt: response.createdAt,
      } satisfies TransporterDetail;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <main id="main-content" className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !transporter) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">{t("notFound")}</h1>
          <Button asChild>
            <Link href="/transporters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToList")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const parseJsonField = (field: string): string[] => {
    if (!field) return [];
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [field];
    } catch {
      return field.split(",").map((s) => s.trim()).filter(Boolean);
    }
  };

  const serviceRegions = parseJsonField(transporter.serviceRegions);
  const specializations = parseJsonField(transporter.specializations);
  const certifications = parseJsonField(transporter.certifications);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/transporters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToList")}
            </Link>
          </Button>

          {/* Header Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Logo/Avatar */}
                <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {transporter.logoUrl ? (
                    <img
                      src={transporter.logoUrl}
                      alt={transporter.companyName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Truck className="h-10 w-10 text-primary" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{transporter.companyName}</h1>
                    {transporter.isVerified && (
                      <Badge variant="default" className="gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        {t("verified")}
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-3">{transporter.contactPerson}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4">
                    {transporter.averageRating != null && transporter.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {Number(transporter.averageRating).toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      {transporter.totalTransports} {t("totalTransports")}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      {transporter.completedTransports} {t("completed")}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(transporter.createdAt).toLocaleDateString(locale)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Description */}
            {transporter.description && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("about")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {transporter.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("contact")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {transporter.address && `${transporter.address}, `}
                    {transporter.city}, {transporter.countryCode}
                  </span>
                </div>
                {transporter.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{transporter.phone}</span>
                  </div>
                )}
                {transporter.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{transporter.email}</span>
                  </div>
                )}
                {transporter.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={transporter.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {transporter.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("businessInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transporter.licenseNumber && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("license")}</span>
                    <p className="text-sm font-medium">{transporter.licenseNumber}</p>
                  </div>
                )}
                {transporter.insuranceInfo && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("insurance")}</span>
                    <p className="text-sm font-medium">{transporter.insuranceInfo}</p>
                  </div>
                )}
                {transporter.fleetInfo && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("fleet")}</span>
                    <p className="text-sm font-medium">{transporter.fleetInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Regions */}
            {serviceRegions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("serviceRegions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {serviceRegions.map((region, i) => (
                      <Badge key={i} variant="secondary">
                        <MapPin className="h-3 w-3 mr-1" />
                        {region}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specializations */}
            {specializations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("specializations")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec, i) => (
                      <Badge key={i} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("certifications")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reviews */}
          <div className="mt-6">
            <TransporterReviews
              transporterId={transporter.id}
              averageRating={transporter.averageRating}
            />
          </div>
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
