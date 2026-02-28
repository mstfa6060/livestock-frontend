"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Syringe, FileText } from "lucide-react";
import type { HealthRecord, Vaccination, VetInfo } from "./types";

interface HealthRecordsTabProps {
  records: HealthRecord[];
}

export function HealthRecordsTab({ records }: HealthRecordsTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div key={record.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{record.recordType}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(record.recordDate).toLocaleDateString()}
            </span>
          </div>
          {record.diagnosis && (
            <div>
              <span className="text-xs text-muted-foreground">{t("diagnosis")}</span>
              <p className="text-sm">{record.diagnosis}</p>
            </div>
          )}
          {record.treatment && (
            <div>
              <span className="text-xs text-muted-foreground">{t("treatment")}</span>
              <p className="text-sm">{record.treatment}</p>
            </div>
          )}
          {record.medications && (
            <div>
              <span className="text-xs text-muted-foreground">{t("medications")}</span>
              <p className="text-sm">{record.medications}</p>
            </div>
          )}
          {record.veterinarianName && (
            <p className="text-xs text-muted-foreground">
              {t("veterinarian")}: {record.veterinarianName}
              {record.clinicName && ` - ${record.clinicName}`}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

interface VaccinationsTabProps {
  vaccinations: Vaccination[];
}

export function VaccinationsTab({ vaccinations }: VaccinationsTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-3">
      {vaccinations.map((vacc) => (
        <div key={vacc.id} className="flex items-start justify-between border rounded-lg p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">{vacc.vaccineName}</span>
              {vacc.vaccineType && (
                <Badge variant="outline" className="text-xs">{vacc.vaccineType}</Badge>
              )}
            </div>
            {vacc.veterinarianName && (
              <p className="text-xs text-muted-foreground">
                {t("veterinarian")}: {vacc.veterinarianName}
              </p>
            )}
            {vacc.nextDueDate && (
              <p className="text-xs text-muted-foreground">
                {t("nextDue")}: {new Date(vacc.nextDueDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(vacc.vaccinationDate).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

interface VetInfoTabProps {
  vetInfo: VetInfo[];
}

export function VetInfoTab({ vetInfo }: VetInfoTabProps) {
  const t = useTranslations("animalInfo");

  return (
    <div className="space-y-4">
      {vetInfo.map((info) => (
        <div key={info.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{info.therapeuticCategory}</span>
            {info.requiresPrescription && (
              <Badge variant="destructive" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {t("prescriptionRequired")}
              </Badge>
            )}
          </div>
          {info.targetSpecies && (
            <div>
              <span className="text-xs text-muted-foreground">{t("targetSpecies")}</span>
              <p className="text-sm">{info.targetSpecies}</p>
            </div>
          )}
          {info.activeIngredients && (
            <div>
              <span className="text-xs text-muted-foreground">{t("activeIngredients")}</span>
              <p className="text-sm">{info.activeIngredients}</p>
            </div>
          )}
          {info.registrationNumber && (
            <p className="text-xs text-muted-foreground">
              {t("registrationNo")}: {info.registrationNumber}
            </p>
          )}
          {info.storageInstructions && (
            <p className="text-xs text-muted-foreground">
              {t("storage")}: {info.storageInstructions}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
