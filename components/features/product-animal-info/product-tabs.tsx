"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ChemicalInfo, FeedInfo, SeedInfo, MachineryInfo } from "./types";

interface ChemicalTabProps {
  chemicalInfo: ChemicalInfo[];
}

export function ChemicalTab({ chemicalInfo }: ChemicalTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-4">
      {chemicalInfo.map((chem) => (
        <div key={chem.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{chem.subType}</span>
            {chem.isOrganic && <Badge variant="default" className="text-xs">{t("organic")}</Badge>}
            <Badge variant={chem.toxicityLevel <= 1 ? "secondary" : "destructive"} className="text-xs">
              {t("toxicity")}: {chem.toxicityLevel}
            </Badge>
          </div>
          {chem.registrationNumber && (
            <p className="text-xs text-muted-foreground">{t("registrationNo")}: {chem.registrationNumber}</p>
          )}
        </div>
      ))}
    </div>
  );
}

interface FeedTabProps {
  feedInfo: FeedInfo[];
}

export function FeedTab({ feedInfo }: FeedTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-4">
      {feedInfo.map((feed) => (
        <div key={feed.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{feed.targetAnimal}</span>
            {feed.targetAge && <Badge variant="outline" className="text-xs">{feed.targetAge}</Badge>}
            {feed.isOrganic && <Badge variant="default" className="text-xs">{t("organic")}</Badge>}
            {feed.isGMOFree && <Badge variant="secondary" className="text-xs">{t("gmoFree")}</Badge>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {feed.proteinPercentage != null && (
              <div><span className="text-xs text-muted-foreground">{t("protein")}</span><p>{Number(feed.proteinPercentage).toFixed(1)}%</p></div>
            )}
            {feed.fatPercentage != null && (
              <div><span className="text-xs text-muted-foreground">{t("fat")}</span><p>{Number(feed.fatPercentage).toFixed(1)}%</p></div>
            )}
            {feed.fiberPercentage != null && (
              <div><span className="text-xs text-muted-foreground">{t("fiber")}</span><p>{Number(feed.fiberPercentage).toFixed(1)}%</p></div>
            )}
          </div>
          {feed.feedingInstructions && (
            <p className="text-xs text-muted-foreground">{feed.feedingInstructions}</p>
          )}
        </div>
      ))}
    </div>
  );
}

interface SeedTabProps {
  seedInfo: SeedInfo[];
}

export function SeedTab({ seedInfo }: SeedTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-4">
      {seedInfo.map((seed) => (
        <div key={seed.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{seed.variety}</span>
            {seed.scientificName && <span className="text-xs italic text-muted-foreground">{seed.scientificName}</span>}
            {seed.isOrganic && <Badge variant="default" className="text-xs">{t("organic")}</Badge>}
            {seed.isHybrid && <Badge variant="secondary" className="text-xs">{t("hybrid")}</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {seed.germinationRate != null && (
              <div><span className="text-xs text-muted-foreground">{t("germination")}</span><p>{Number(seed.germinationRate).toFixed(0)}%</p></div>
            )}
            {seed.daysToMaturity != null && (
              <div><span className="text-xs text-muted-foreground">{t("daysToMaturity")}</span><p>{seed.daysToMaturity} {t("daysLabel")}</p></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MachineryTabProps {
  machineryInfo: MachineryInfo[];
}

export function MachineryTab({ machineryInfo }: MachineryTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-4">
      {machineryInfo.map((mach) => (
        <div key={mach.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{mach.model}</span>
            {mach.yearOfManufacture && <Badge variant="outline" className="text-xs">{mach.yearOfManufacture}</Badge>}
            {mach.hasWarranty && <Badge variant="default" className="text-xs">{t("warranty")}</Badge>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {mach.powerHp != null && (
              <div><span className="text-xs text-muted-foreground">{t("power")}</span><p>{Number(mach.powerHp).toFixed(0)} HP</p></div>
            )}
            {mach.hoursUsed != null && (
              <div><span className="text-xs text-muted-foreground">{t("hoursUsed")}</span><p>{mach.hoursUsed} {t("hours")}</p></div>
            )}
            {mach.powerSource && (
              <div><span className="text-xs text-muted-foreground">{t("powerSource")}</span><p>{mach.powerSource}</p></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
