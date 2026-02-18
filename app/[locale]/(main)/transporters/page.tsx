"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import {
  Truck,
  Star,
  BadgeCheck,
  MapPin,
  Search,
  Phone,
  Mail,
} from "lucide-react";

interface Transporter {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  countryCode: string;
  isVerified: boolean;
  isActive: boolean;
  averageRating: number | null;
  totalTransports: number;
  createdAt: Date;
}

export default function TransportersPage() {
  const t = useTranslations("transporters");
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(true);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTransporters = async () => {
      setIsLoading(true);
      try {
        const response = await LivestockTradingAPI.Transporters.All.Request({
          sorting: {
            key: "createdAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [
            {
              key: "isActive",
              type: "boolean",
              isUsed: true,
              values: [true],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

        setTransporters(
          response.map((t) => ({
            id: t.id,
            companyName: t.companyName,
            contactPerson: t.contactPerson,
            email: t.email,
            phone: t.phone,
            city: t.city,
            countryCode: t.countryCode,
            isVerified: t.isVerified,
            isActive: t.isActive,
            averageRating: t.averageRating as number | null,
            totalTransports: t.totalTransports,
            createdAt: t.createdAt,
          }))
        );
      } catch {
        // Silently handle
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransporters();
  }, []);

  const filtered = transporters.filter(
    (t) =>
      t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-8 w-8" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">{t("noTransporters")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((transporter) => (
              <Card key={transporter.id} className="hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{transporter.companyName}</h3>
                      <p className="text-sm text-muted-foreground">{transporter.contactPerson}</p>
                    </div>
                    {transporter.isVerified && (
                      <Badge variant="default" className="gap-1 shrink-0">
                        <BadgeCheck className="h-3 w-3" />
                        {t("verified")}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {transporter.city}, {transporter.countryCode}
                    </div>
                    {transporter.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        {transporter.phone}
                      </div>
                    )}
                    {transporter.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        {transporter.email}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {transporter.averageRating != null && transporter.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {Number(transporter.averageRating).toFixed(1)}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {transporter.totalTransports} {t("transports")}
                      </span>
                    </div>

                    <Link href={`/transporters/${transporter.id}`}>
                      <Button size="sm" variant="outline">
                        {t("viewProfile")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SimpleFooter />
    </div>
  );
}
