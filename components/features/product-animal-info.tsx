"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PawPrint,
  Heart,
  Syringe,
  Stethoscope,
  Calendar,
  Weight,
  Ruler,
  Tag,
  FileText,
} from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface AnimalInfo {
  id: string;
  breedName: string;
  gender: number;
  ageMonths: number | null;
  weightKg: number | null;
  color: string;
  tagNumber: string;
  healthStatus: number;
  purpose: number;
  isPregnant: boolean;
  numberOfBirths: number | null;
  sireDetails: string;
  damDetails: string;
  microchipNumber: string;
  passportNumber: string;
}

interface HealthRecord {
  id: string;
  recordDate: Date;
  recordType: string;
  veterinarianName: string;
  clinicName: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
}

interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineType: string;
  vaccinationDate: Date;
  nextDueDate: Date | null;
  veterinarianName: string;
  notes: string;
}

interface VetInfo {
  id: string;
  type: number;
  therapeuticCategory: string;
  targetSpecies: string;
  activeIngredients: string;
  requiresPrescription: boolean;
  registrationNumber: string;
  storageInstructions: string;
}

interface ProductAnimalInfoProps {
  productId: string;
}

export function ProductAnimalInfo({ productId }: ProductAnimalInfoProps) {
  const t = useTranslations("animalInfo");

  const [isLoading, setIsLoading] = useState(true);
  const [animalInfo, setAnimalInfo] = useState<AnimalInfo | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [vetInfo, setVetInfo] = useState<VetInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch animal info for this product
        const animalResponse = await LivestockTradingAPI.AnimalInfos.All.Request({
          sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
          filters: [
            { key: "productId", type: "guid", isUsed: true, values: [productId], min: {}, max: {}, conditionType: "equals" },
          ],
          pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
        });

        if (animalResponse.length > 0) {
          const a = animalResponse[0];
          const info: AnimalInfo = {
            id: a.id,
            breedName: a.breedName,
            gender: a.gender,
            ageMonths: a.ageMonths ?? null,
            weightKg: a.weightKg as number | null,
            color: a.color,
            tagNumber: a.tagNumber,
            healthStatus: a.healthStatus,
            purpose: a.purpose,
            isPregnant: false,
            numberOfBirths: null,
            sireDetails: "",
            damDetails: "",
            microchipNumber: "",
            passportNumber: "",
          };

          setAnimalInfo(info);

          // Fetch detail for extra fields
          try {
            const detail = await LivestockTradingAPI.AnimalInfos.Detail.Request({ id: a.id });
            setAnimalInfo({
              ...info,
              isPregnant: detail.isPregnant,
              numberOfBirths: detail.numberOfBirths ?? null,
              sireDetails: detail.sireDetails,
              damDetails: detail.damDetails,
              microchipNumber: detail.microchipNumber,
              passportNumber: detail.passportNumber,
            });

            // Fetch health records for this animal
            const healthResponse = await LivestockTradingAPI.HealthRecords.All.Request({
              sorting: { key: "recordDate", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
              filters: [
                { key: "animalInfoId", type: "guid", isUsed: true, values: [a.id], min: {}, max: {}, conditionType: "equals" },
              ],
              pageRequest: { currentPage: 1, perPageCount: 10, listAll: false },
            });
            setHealthRecords(
              healthResponse.map((h) => ({
                id: h.id,
                recordDate: h.recordDate,
                recordType: h.recordType,
                veterinarianName: h.veterinarianName,
                clinicName: h.clinicName,
                diagnosis: h.diagnosis,
                treatment: h.treatment,
                medications: h.medications,
                notes: h.notes,
              }))
            );

            // Fetch vaccinations
            const vaccResponse = await LivestockTradingAPI.Vaccinations.All.Request({
              sorting: { key: "vaccinationDate", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
              filters: [
                { key: "animalInfoId", type: "guid", isUsed: true, values: [a.id], min: {}, max: {}, conditionType: "equals" },
              ],
              pageRequest: { currentPage: 1, perPageCount: 20, listAll: false },
            });
            setVaccinations(
              vaccResponse.map((v) => ({
                id: v.id,
                vaccineName: v.vaccineName,
                vaccineType: v.vaccineType,
                vaccinationDate: v.vaccinationDate,
                nextDueDate: v.nextDueDate ?? null,
                veterinarianName: v.veterinarianName,
                notes: "",
              }))
            );
          } catch {
            // Sub-fetches are non-critical
          }
        }

        // Fetch vet info for this product
        const vetResponse = await LivestockTradingAPI.VeterinaryInfos.All.Request({
          sorting: { key: "createdAt", direction: LivestockTradingAPI.Enums.XSortingDirection.Descending },
          filters: [
            { key: "productId", type: "guid", isUsed: true, values: [productId], min: {}, max: {}, conditionType: "equals" },
          ],
          pageRequest: { currentPage: 1, perPageCount: 10, listAll: false },
        });
        setVetInfo(
          vetResponse.map((v) => ({
            id: v.id,
            type: v.type,
            therapeuticCategory: v.therapeuticCategory,
            targetSpecies: v.targetSpecies,
            activeIngredients: v.activeIngredients,
            requiresPrescription: v.requiresPrescription,
            registrationNumber: v.registrationNumber,
            storageInstructions: v.storageInstructions,
          }))
        );
      } catch {
        // Animal info is optional - product may not be an animal
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId]);

  // Don't render anything if there's no animal data
  if (!isLoading && !animalInfo && healthRecords.length === 0 && vaccinations.length === 0 && vetInfo.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

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

  const availableTabs = [];
  if (animalInfo) availableTabs.push("animal");
  if (healthRecords.length > 0) availableTabs.push("health");
  if (vaccinations.length > 0) availableTabs.push("vaccinations");
  if (vetInfo.length > 0) availableTabs.push("veterinary");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PawPrint className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableTabs[0] || "animal"}>
          <TabsList className="flex-wrap">
            {animalInfo && (
              <TabsTrigger value="animal" className="gap-1">
                <PawPrint className="h-3.5 w-3.5" />
                {t("animalTab")}
              </TabsTrigger>
            )}
            {healthRecords.length > 0 && (
              <TabsTrigger value="health" className="gap-1">
                <Heart className="h-3.5 w-3.5" />
                {t("healthTab")}
              </TabsTrigger>
            )}
            {vaccinations.length > 0 && (
              <TabsTrigger value="vaccinations" className="gap-1">
                <Syringe className="h-3.5 w-3.5" />
                {t("vaccinationsTab")}
              </TabsTrigger>
            )}
            {vetInfo.length > 0 && (
              <TabsTrigger value="veterinary" className="gap-1">
                <Stethoscope className="h-3.5 w-3.5" />
                {t("veterinaryTab")}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Animal Info Tab */}
          {animalInfo && (
            <TabsContent value="animal" className="mt-4">
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
            </TabsContent>
          )}

          {/* Health Records Tab */}
          {healthRecords.length > 0 && (
            <TabsContent value="health" className="mt-4">
              <div className="space-y-4">
                {healthRecords.map((record) => (
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
            </TabsContent>
          )}

          {/* Vaccinations Tab */}
          {vaccinations.length > 0 && (
            <TabsContent value="vaccinations" className="mt-4">
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
            </TabsContent>
          )}

          {/* Veterinary Info Tab */}
          {vetInfo.length > 0 && (
            <TabsContent value="veterinary" className="mt-4">
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
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
