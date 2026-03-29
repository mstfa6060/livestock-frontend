"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProvinces, useDistricts, useNeighborhoods } from "@/hooks/queries/useIAM";
import { useLocale, useTranslations } from "next-intl";

interface LocationSelectorProps {
  countryId: number;
  provinceId: number | null;
  districtId: number | null;
  neighborhoodId?: number | null;
  onProvinceChange: (provinceId: number | null, provinceName: string) => void;
  onDistrictChange: (districtId: number | null, districtName: string) => void;
  onNeighborhoodChange?: (neighborhoodId: number | null, neighborhoodName: string) => void;
  className?: string;
}

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

export function LocationSelector({
  countryId,
  provinceId,
  districtId,
  neighborhoodId,
  onProvinceChange,
  onDistrictChange,
  onNeighborhoodChange,
  className,
}: LocationSelectorProps) {
  const t = useTranslations("newListing");
  const locale = useLocale();
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  const { data: provinces, isLoading: provincesLoading } =
    useProvinces(countryId);
  const { data: districts, isLoading: districtsLoading } = useDistricts(
    provinceId ?? 0
  );
  const { data: neighborhoods, isLoading: neighborhoodsLoading } = useNeighborhoods(
    districtId ?? 0
  );

  const translatedProvinces = useMemo(
    () =>
      provinces?.map((p) => ({
        ...p,
        displayName: getTranslatedName(p.nameTranslations, locale, p.name),
      })) ?? [],
    [provinces, locale]
  );

  const translatedDistricts = useMemo(
    () =>
      districts?.map((d) => ({
        ...d,
        displayName: getTranslatedName(d.nameTranslations, locale, d.name),
      })) ?? [],
    [districts, locale]
  );

  const selectedProvince = translatedProvinces.find(
    (p) => p.id === provinceId
  );
  const selectedDistrict = translatedDistricts.find(
    (d) => d.id === districtId
  );
  const selectedNeighborhood = neighborhoods?.find(
    (n) => n.id === neighborhoodId
  );

  const hasNeighborhoods = neighborhoods && neighborhoods.length > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Province/State selector */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
          <MapPin className="inline h-3.5 w-3.5 mr-1" />
          {t("province")}
        </label>
        <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={provinceOpen}
              className="w-full justify-between font-normal"
              disabled={!countryId || provincesLoading}
            >
              <span className="truncate">
                {selectedProvince
                  ? selectedProvince.displayName
                  : provincesLoading
                    ? t("loading")
                    : t("selectProvince")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchProvince")} />
              <CommandList>
                <CommandEmpty>{t("noProvince")}</CommandEmpty>
                <CommandGroup>
                  {translatedProvinces.map((province) => (
                    <CommandItem
                      key={province.id}
                      value={`${province.displayName} ${province.name} ${province.code}`}
                      onSelect={() => {
                        const isDeselect = provinceId === province.id;
                        onProvinceChange(
                          isDeselect ? null : province.id,
                          isDeselect ? "" : province.displayName
                        );
                        if (!isDeselect) {
                          onDistrictChange(null, "");
                          onNeighborhoodChange?.(null, "");
                        }
                        setProvinceOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          provinceId === province.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span>{province.displayName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* District/City selector */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
          <MapPin className="inline h-3.5 w-3.5 mr-1" />
          {t("district")}
        </label>
        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={districtOpen}
              className="w-full justify-between font-normal"
              disabled={!provinceId || districtsLoading}
            >
              <span className="truncate">
                {selectedDistrict
                  ? selectedDistrict.displayName
                  : !provinceId
                    ? t("selectProvinceFirst")
                    : districtsLoading
                      ? t("loading")
                      : t("selectDistrict")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("searchDistrict")} />
              <CommandList>
                <CommandEmpty>{t("noDistrict")}</CommandEmpty>
                <CommandGroup>
                  {translatedDistricts.map((district) => (
                    <CommandItem
                      key={district.id}
                      value={`${district.displayName} ${district.name}`}
                      onSelect={() => {
                        const isDeselect = districtId === district.id;
                        onDistrictChange(
                          isDeselect ? null : district.id,
                          isDeselect ? "" : district.displayName
                        );
                        if (!isDeselect) onNeighborhoodChange?.(null, "");
                        setDistrictOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          districtId === district.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span>{district.displayName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Neighborhood selector (only shown when district has neighborhoods) */}
      {districtId && !neighborhoodsLoading && hasNeighborhoods && (
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            <MapPin className="inline h-3.5 w-3.5 mr-1" />
            {t("neighborhood")}
          </label>
          <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={neighborhoodOpen}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {selectedNeighborhood
                    ? selectedNeighborhood.name
                    : t("selectNeighborhood")}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder={t("searchNeighborhood")} />
                <CommandList>
                  <CommandEmpty>{t("noNeighborhood")}</CommandEmpty>
                  <CommandGroup>
                    {neighborhoods?.map((neighborhood) => (
                      <CommandItem
                        key={neighborhood.id}
                        value={neighborhood.name}
                        onSelect={() => {
                          const isDeselect = neighborhoodId === neighborhood.id;
                          onNeighborhoodChange?.(
                            isDeselect ? null : neighborhood.id,
                            isDeselect ? "" : neighborhood.name
                          );
                          setNeighborhoodOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            neighborhoodId === neighborhood.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span>{neighborhood.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
