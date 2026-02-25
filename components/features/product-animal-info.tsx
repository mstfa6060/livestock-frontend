"use client";

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
  Tag,
  FileText,
} from "lucide-react";
import { useProductAnimalInfo } from "@/hooks/queries/useProductSubresources";

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

interface ChemicalInfo {
  id: string;
  subType: string;
  activeIngredients: string;
  registrationNumber: string;
  toxicityLevel: number;
  isOrganic: boolean;
  applicationMethod: string;
  targetPests: string;
  targetCrops: string;
  safetyInstructions: string;
}

interface FeedInfo {
  id: string;
  targetAnimal: string;
  targetAge: string;
  proteinPercentage: number | null;
  fatPercentage: number | null;
  fiberPercentage: number | null;
  isOrganic: boolean;
  isGMOFree: boolean;
  feedingInstructions: string;
  storageInstructions: string;
}

interface SeedInfo {
  id: string;
  variety: string;
  scientificName: string;
  germinationRate: number | null;
  daysToMaturity: number | null;
  plantingSeason: string;
  harvestSeason: string;
  isOrganic: boolean;
  isHybrid: boolean;
  climateZones: string;
  soilType: string;
}

interface MachineryInfo {
  id: string;
  model: string;
  yearOfManufacture: number | null;
  powerHp: number | null;
  hoursUsed: number | null;
  hasWarranty: boolean;
  serialNumber: string;
  powerSource: string;
}

interface ProductAnimalInfoProps {
  productId: string;
}

export function ProductAnimalInfo({ productId }: ProductAnimalInfoProps) {
  const t = useTranslations("animalInfo");

  const { data, isLoading } = useProductAnimalInfo(productId);

  const animalInfo = data?.animalInfo ?? null;
  const healthRecords = data?.healthRecords ?? [];
  const vaccinations = data?.vaccinations ?? [];
  const vetInfo = data?.vetInfo ?? [];
  const chemicalInfo = data?.chemicalInfo ?? [];
  const feedInfo = data?.feedInfo ?? [];
  const seedInfo = data?.seedInfo ?? [];
  const machineryInfo = data?.machineryInfo ?? [];

  // Don't render anything if there's no data at all
  if (!isLoading && !animalInfo && healthRecords.length === 0 && vaccinations.length === 0 && vetInfo.length === 0
      && chemicalInfo.length === 0 && feedInfo.length === 0 && seedInfo.length === 0 && machineryInfo.length === 0) {
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
  if (chemicalInfo.length > 0) availableTabs.push("chemical");
  if (feedInfo.length > 0) availableTabs.push("feed");
  if (seedInfo.length > 0) availableTabs.push("seed");
  if (machineryInfo.length > 0) availableTabs.push("machinery");

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
            {chemicalInfo.length > 0 && (
              <TabsTrigger value="chemical" className="gap-1">
                {t("chemicalTab")}
              </TabsTrigger>
            )}
            {feedInfo.length > 0 && (
              <TabsTrigger value="feed" className="gap-1">
                {t("feedTab")}
              </TabsTrigger>
            )}
            {seedInfo.length > 0 && (
              <TabsTrigger value="seed" className="gap-1">
                {t("seedTab")}
              </TabsTrigger>
            )}
            {machineryInfo.length > 0 && (
              <TabsTrigger value="machinery" className="gap-1">
                {t("machineryTab")}
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
          {/* Chemical Info Tab */}
          {chemicalInfo.length > 0 && (
            <TabsContent value="chemical" className="mt-4">
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
            </TabsContent>
          )}

          {/* Feed Info Tab */}
          {feedInfo.length > 0 && (
            <TabsContent value="feed" className="mt-4">
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
            </TabsContent>
          )}

          {/* Seed Info Tab */}
          {seedInfo.length > 0 && (
            <TabsContent value="seed" className="mt-4">
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
            </TabsContent>
          )}

          {/* Machinery Info Tab */}
          {machineryInfo.length > 0 && (
            <TabsContent value="machinery" className="mt-4">
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
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
