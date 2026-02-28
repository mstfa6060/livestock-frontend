"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Calendar, Weight, Tag } from "lucide-react";
import type { AnimalInfo } from "./types";

interface AnimalTabProps {
  animalInfo: AnimalInfo;
}

export function AnimalTab({ animalInfo }: AnimalTabProps) {
  const t = useTranslations("animalInfo");

  const genderLabel = (g: number) => {
    switch (g) {
      case 0: return t("gender.male");
      case 1: return t("gender.female");
      default: return t("gender.unknown");
    }
  };

  const healthStatusLabel = (s: number) => {
    switch (s) {
      case 0: return t("health.healthy");
      case 1: return t("health.underTreatment");
      case 2: return t("health.recovering");
      case 3: return t("health.quarantined");
      default: return t("health.unknown");
    }
  };

  const healthStatusVariant = (s: number): "default" | "secondary" | "destructive" | "outline" => {
    switch (s) {
      case 0: return "default";
      case 1: return "destructive";
      case 2: return "secondary";
      case 3: return "outline";
      default: return "secondary";
    }
  };

  const purposeLabel = (p: number) => {
    switch (p) {
      case 0: return t("purpose.breeding");
      case 1: return t("purpose.dairy");
      case 2: return t("purpose.meat");
      case 3: return t("purpose.egg");
      case 4: return t("purpose.wool");
      case 5: return t("purpose.working");
      case 6: return t("purpose.pet");
      default: return t("purpose.other");
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-muted-foreground">{t("breed")}</span>
          <p className="font-medium">{animalInfo.breedName}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">{t("genderLabel")}</span>
          <p className="font-medium">{genderLabel(animalInfo.gender)}</p>
        </div>
        {animalInfo.ageMonths != null && (
          <div>
            <span className="text-xs text-muted-foreground">{t("age")}</span>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {animalInfo.ageMonths} {t("months")}
            </p>
          </div>
        )}
        {animalInfo.weightKg != null && (
          <div>
            <span className="text-xs text-muted-foreground">{t("weight")}</span>
            <p className="font-medium flex items-center gap-1">
              <Weight className="h-3.5 w-3.5" />
              {Number(animalInfo.weightKg).toFixed(1)} kg
            </p>
          </div>
        )}
        {animalInfo.color && (
          <div>
            <span className="text-xs text-muted-foreground">{t("color")}</span>
            <p className="font-medium">{animalInfo.color}</p>
          </div>
        )}
        {animalInfo.tagNumber && (
          <div>
            <span className="text-xs text-muted-foreground">{t("tagNumber")}</span>
            <p className="font-medium flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {animalInfo.tagNumber}
            </p>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground">{t("healthStatus")}</span>
          <Badge variant={healthStatusVariant(animalInfo.healthStatus)}>
            {healthStatusLabel(animalInfo.healthStatus)}
          </Badge>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">{t("purposeLabel")}</span>
          <p className="font-medium">{purposeLabel(animalInfo.purpose)}</p>
        </div>
        {animalInfo.isPregnant && (
          <div>
            <span className="text-xs text-muted-foreground">{t("pregnancy")}</span>
            <Badge variant="secondary">{t("pregnant")}</Badge>
          </div>
        )}
        {animalInfo.microchipNumber && (
          <div>
            <span className="text-xs text-muted-foreground">{t("microchip")}</span>
            <p className="text-sm">{animalInfo.microchipNumber}</p>
          </div>
        )}
        {animalInfo.passportNumber && (
          <div>
            <span className="text-xs text-muted-foreground">{t("passport")}</span>
            <p className="text-sm">{animalInfo.passportNumber}</p>
          </div>
        )}
      </div>
      {(animalInfo.sireDetails || animalInfo.damDetails) && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          {animalInfo.sireDetails && (
            <div>
              <span className="text-xs text-muted-foreground">{t("sireDetails")}</span>
              <p className="text-sm">{animalInfo.sireDetails}</p>
            </div>
          )}
          {animalInfo.damDetails && (
            <div>
              <span className="text-xs text-muted-foreground">{t("damDetails")}</span>
              <p className="text-sm">{animalInfo.damDetails}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
