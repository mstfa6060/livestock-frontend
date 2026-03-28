"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/useRoles";
import {
  useCountries,
  useProvinces,
  useDistricts,
} from "@/hooks/queries/useIAM";
import {
  Globe,
  MapPin,
  Building2,
  ShieldAlert,
  Search,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getTranslatedName(
  nameTranslations: string | null | undefined,
  locale: string,
  fallback: string
): string {
  if (!nameTranslations) return fallback;
  try {
    const translations = JSON.parse(nameTranslations);
    return translations[locale] || translations["en"] || fallback;
  } catch {
    return fallback;
  }
}

export default function LocationsAdminPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { isAdmin, isStaff } = useRoles();

  const [selectedCountry, setSelectedCountry] = useState<{
    id: number;
    name: string;
    code: string;
  } | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: provinces = [], isLoading: provincesLoading } = useProvinces(
    selectedCountry?.id ?? 0
  );
  const { data: districts = [], isLoading: districtsLoading } = useDistricts(
    selectedProvince?.id ?? 0
  );

  // Translated names
  const translatedProvinces = useMemo(
    () =>
      provinces.map((p: any) => ({
        ...p,
        displayName: getTranslatedName(p.nameTranslations, locale, p.name),
      })),
    [provinces, locale]
  );

  const translatedDistricts = useMemo(
    () =>
      districts.map((d: any) => ({
        ...d,
        displayName: getTranslatedName(d.nameTranslations, locale, d.name),
      })),
    [districts, locale]
  );

  // Filter logic based on current view
  const lowerQuery = searchQuery.toLowerCase().trim();

  const filteredCountries = useMemo(() => {
    if (!lowerQuery) return countries;
    return countries.filter(
      (c: any) =>
        c.name?.toLowerCase().includes(lowerQuery) ||
        c.code?.toLowerCase().includes(lowerQuery) ||
        c.nativeName?.toLowerCase().includes(lowerQuery)
    );
  }, [countries, lowerQuery]);

  const filteredProvinces = useMemo(() => {
    if (!lowerQuery) return translatedProvinces;
    return translatedProvinces.filter(
      (p: any) =>
        p.displayName?.toLowerCase().includes(lowerQuery) ||
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.code?.toLowerCase().includes(lowerQuery)
    );
  }, [translatedProvinces, lowerQuery]);

  const filteredDistricts = useMemo(() => {
    if (!lowerQuery) return translatedDistricts;
    return translatedDistricts.filter(
      (d: any) =>
        d.displayName?.toLowerCase().includes(lowerQuery) ||
        d.name?.toLowerCase().includes(lowerQuery)
    );
  }, [translatedDistricts, lowerQuery]);

  const handleCountrySelect = (country: any) => {
    setSelectedCountry({ id: country.id, name: country.name, code: country.code });
    setSelectedProvince(null);
    setSearchQuery("");
  };

  const handleProvinceSelect = (province: any) => {
    setSelectedProvince({ id: province.id, name: province.displayName });
    setSearchQuery("");
  };

  const handleBack = () => {
    if (selectedProvince) {
      setSelectedProvince(null);
      setSearchQuery("");
    } else if (selectedCountry) {
      setSelectedCountry(null);
      setSelectedProvince(null);
      setSearchQuery("");
    }
  };

  // Current view level
  const currentLevel = selectedProvince
    ? "districts"
    : selectedCountry
      ? "provinces"
      : "countries";

  if (!isAdmin && !isStaff) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("unauthorized")}</p>
        </div>
      </DashboardLayout>
    );
  }

  const isLoading =
    currentLevel === "countries"
      ? countriesLoading
      : currentLevel === "provinces"
        ? provincesLoading
        : districtsLoading;

  const currentCount =
    currentLevel === "countries"
      ? filteredCountries.length
      : currentLevel === "provinces"
        ? filteredProvinces.length
        : filteredDistricts.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            {t("locationsAdmin")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("locationsAdminDescription")}
          </p>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => {
              setSelectedCountry(null);
              setSelectedProvince(null);
              setSearchQuery("");
            }}
            className={`flex items-center gap-1 transition-colors ${!selectedCountry ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Globe className="h-3.5 w-3.5" />
            {t("countriesLabel")}
          </button>
          {selectedCountry && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => {
                  setSelectedProvince(null);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1 transition-colors ${!selectedProvince ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                <MapPin className="h-3.5 w-3.5" />
                {selectedCountry.name}
              </button>
            </>
          )}
          {selectedProvince && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {selectedProvince.name}
              </span>
            </>
          )}
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {(selectedCountry || selectedProvince) && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("back")}
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono">
                {currentCount}
              </Badge>
              <span>
                {currentLevel === "countries"
                  ? t("countriesCount")
                  : currentLevel === "provinces"
                    ? t("provincesCount")
                    : t("districtsCount")}
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                currentLevel === "countries"
                  ? t("searchCountry")
                  : currentLevel === "provinces"
                    ? t("searchProvince")
                    : t("searchDistrict")
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : currentCount === 0 ? (
          <div className="text-center py-16">
            <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {currentLevel === "countries" && (
                    <>
                      <th className="text-left px-4 py-3 font-medium w-16">#</th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("countryName")}
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("countryCode")}
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("currency")}
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("phoneCode")}
                      </th>
                      <th className="text-center px-4 py-3 font-medium w-20" />
                    </>
                  )}
                  {currentLevel === "provinces" && (
                    <>
                      <th className="text-left px-4 py-3 font-medium w-16">#</th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("provinceName")}
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("provinceCode")}
                      </th>
                      <th className="text-center px-4 py-3 font-medium w-20" />
                    </>
                  )}
                  {currentLevel === "districts" && (
                    <>
                      <th className="text-left px-4 py-3 font-medium w-16">#</th>
                      <th className="text-left px-4 py-3 font-medium">
                        {t("districtName")}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Countries */}
                {currentLevel === "countries" &&
                  filteredCountries.map((country: any, idx: number) => (
                    <tr
                      key={country.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleCountrySelect(country)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{country.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {country.code}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {country.defaultCurrencyCode && (
                          <span className="font-mono text-xs">
                            {country.defaultCurrencyCode}
                            {country.defaultCurrencySymbol &&
                              ` (${country.defaultCurrencySymbol})`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {country.phoneCode && `+${country.phoneCode}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                      </td>
                    </tr>
                  ))}

                {/* Provinces */}
                {currentLevel === "provinces" &&
                  filteredProvinces.map((province: any, idx: number) => (
                    <tr
                      key={province.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleProvinceSelect(province)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {province.displayName}
                          </span>
                          {province.displayName !== province.name && (
                            <span className="text-xs text-muted-foreground">
                              ({province.name})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {province.code && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {province.code}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                      </td>
                    </tr>
                  ))}

                {/* Districts */}
                {currentLevel === "districts" &&
                  filteredDistricts.map((district: any, idx: number) => (
                    <tr
                      key={district.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {district.displayName}
                          </span>
                          {district.displayName !== district.name && (
                            <span className="text-xs text-muted-foreground">
                              ({district.name})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
