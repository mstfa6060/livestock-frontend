"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PawPrint,
  Heart,
  Syringe,
  Stethoscope,
} from "lucide-react";
import { useProductAnimalInfo } from "@/hooks/queries/useProductSubresources";
import { AnimalTab } from "./animal-tab";
import { HealthRecordsTab, VaccinationsTab, VetInfoTab } from "./record-tabs";
import { ChemicalTab, FeedTab, SeedTab, MachineryTab } from "./product-tabs";

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

          {animalInfo && (
            <TabsContent value="animal" className="mt-4">
              <AnimalTab animalInfo={animalInfo} />
            </TabsContent>
          )}

          {healthRecords.length > 0 && (
            <TabsContent value="health" className="mt-4">
              <HealthRecordsTab records={healthRecords} />
            </TabsContent>
          )}

          {vaccinations.length > 0 && (
            <TabsContent value="vaccinations" className="mt-4">
              <VaccinationsTab vaccinations={vaccinations} />
            </TabsContent>
          )}

          {vetInfo.length > 0 && (
            <TabsContent value="veterinary" className="mt-4">
              <VetInfoTab vetInfo={vetInfo} />
            </TabsContent>
          )}

          {chemicalInfo.length > 0 && (
            <TabsContent value="chemical" className="mt-4">
              <ChemicalTab chemicalInfo={chemicalInfo} />
            </TabsContent>
          )}

          {feedInfo.length > 0 && (
            <TabsContent value="feed" className="mt-4">
              <FeedTab feedInfo={feedInfo} />
            </TabsContent>
          )}

          {seedInfo.length > 0 && (
            <TabsContent value="seed" className="mt-4">
              <SeedTab seedInfo={seedInfo} />
            </TabsContent>
          )}

          {machineryInfo.length > 0 && (
            <TabsContent value="machinery" className="mt-4">
              <MachineryTab machineryInfo={machineryInfo} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
