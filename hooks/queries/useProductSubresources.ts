import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export function useProductReviews(
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.reviews(productId),
    queryFn: async () => {
      const response =
        await LivestockTradingAPI.ProductReviews.All.Request({
          sorting: {
            key: "createdAt",
            direction:
              LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [
            {
              key: "productId",
              type: "guid",
              isUsed: true,
              values: [productId],
              min: {},
              max: {},
              conditionType: "equals",
            },
            {
              key: "isApproved",
              type: "boolean",
              isUsed: true,
              values: [true],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 10, listAll: false },
        });

      return response.map((r) => ({
        id: r.id,
        userId: r.userId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
      }));
    },
    enabled: (options?.enabled ?? true) && !!productId,
  });
}

export function useProductVariants(
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.variants(productId),
    queryFn: async () => {
      const response =
        await LivestockTradingAPI.ProductVariants.All.Request({
          sorting: {
            key: "sortOrder",
            direction:
              LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [
            {
              key: "productId",
              type: "guid",
              isUsed: true,
              values: [productId],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

      return response.map((v) => ({
        id: v.id,
        name: v.name,
        sKU: v.sKU,
        price: v.price as number,
        discountedPrice: v.discountedPrice as number | null,
        stockQuantity: v.stockQuantity,
        isInStock: v.isInStock,
        attributes: v.attributes,
        imageUrl: v.imageUrl,
        isActive: v.isActive,
        sortOrder: v.sortOrder,
      }));
    },
    enabled: (options?.enabled ?? true) && !!productId,
  });
}

export function useProductPrices(
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.prices(productId),
    queryFn: async () => {
      const response =
        await LivestockTradingAPI.ProductPrices.All.Request({
          sorting: {
            key: "currencyCode",
            direction:
              LivestockTradingAPI.Enums.XSortingDirection.Ascending,
          },
          filters: [
            {
              key: "productId",
              type: "guid",
              isUsed: true,
              values: [productId],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

      return response.map((p) => ({
        id: p.id,
        currencyCode: p.currencyCode,
        price: p.price as number,
        discountedPrice: p.discountedPrice as number | null,
        countryCodes: p.countryCodes,
        isActive: p.isActive,
        validFrom: p.validFrom ?? null,
        validUntil: p.validUntil ?? null,
        isAutomaticConversion: p.isAutomaticConversion,
      }));
    },
    enabled: (options?.enabled ?? true) && !!productId,
  });
}

export function useProductAnimalInfo(
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.animalInfo(productId),
    queryFn: async () => {
      const productFilter = [
        {
          key: "productId",
          type: "guid",
          isUsed: true,
          values: [productId],
          min: {},
          max: {},
          conditionType: "equals",
        },
      ];
      const defaultPaging = {
        currentPage: 1,
        perPageCount: 10,
        listAll: false,
      };
      const defaultSort = {
        key: "createdAt",
        direction:
          LivestockTradingAPI.Enums.XSortingDirection.Descending,
      };

      // Fetch animal info and other product info types in parallel
      const [animalRes, vetRes, chemRes, feedRes, seedRes, machRes] =
        await Promise.allSettled([
          LivestockTradingAPI.AnimalInfos.All.Request({
            sorting: defaultSort,
            filters: productFilter,
            pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
          }),
          LivestockTradingAPI.VeterinaryInfos.All.Request({
            sorting: defaultSort,
            filters: productFilter,
            pageRequest: defaultPaging,
          }),
          LivestockTradingAPI.ChemicalInfos.All.Request({
            sorting: defaultSort,
            filters: productFilter,
            pageRequest: { currentPage: 1, perPageCount: 5, listAll: false },
          }),
          LivestockTradingAPI.FeedInfos.All.Request({
            sorting: defaultSort,
            filters: productFilter,
            pageRequest: { currentPage: 1, perPageCount: 5, listAll: false },
          }),
          LivestockTradingAPI.SeedInfos.All.Request({
            sorting: defaultSort,
            filters: productFilter,
            pageRequest: { currentPage: 1, perPageCount: 5, listAll: false },
          }),
          LivestockTradingAPI.MachineryInfos.All.Request({
            sorting: defaultSort,
            filters: productFilter,
            pageRequest: { currentPage: 1, perPageCount: 5, listAll: false },
          }),
        ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let animalInfo: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let healthRecords: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let vaccinations: any[] = [];

      if (
        animalRes.status === "fulfilled" &&
        animalRes.value.length > 0
      ) {
        const a = animalRes.value[0];
        animalInfo = {
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

        // Fetch detail + health records + vaccinations for animal
        try {
          const animalFilter = [
            {
              key: "animalInfoId",
              type: "guid",
              isUsed: true,
              values: [a.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ];

          const [detailRes, healthRes, vaccRes] =
            await Promise.allSettled([
              LivestockTradingAPI.AnimalInfos.Detail.Request({
                id: a.id,
              }),
              LivestockTradingAPI.HealthRecords.All.Request({
                sorting: {
                  key: "recordDate",
                  direction:
                    LivestockTradingAPI.Enums.XSortingDirection
                      .Descending,
                },
                filters: animalFilter,
                pageRequest: defaultPaging,
              }),
              LivestockTradingAPI.Vaccinations.All.Request({
                sorting: {
                  key: "vaccinationDate",
                  direction:
                    LivestockTradingAPI.Enums.XSortingDirection
                      .Descending,
                },
                filters: animalFilter,
                pageRequest: {
                  currentPage: 1,
                  perPageCount: 20,
                  listAll: false,
                },
              }),
            ]);

          if (detailRes.status === "fulfilled") {
            const detail = detailRes.value;
            animalInfo = {
              ...animalInfo,
              isPregnant: detail.isPregnant,
              numberOfBirths: detail.numberOfBirths ?? null,
              sireDetails: detail.sireDetails,
              damDetails: detail.damDetails,
              microchipNumber: detail.microchipNumber,
              passportNumber: detail.passportNumber,
            };
          }

          if (healthRes.status === "fulfilled") {
            healthRecords = healthRes.value.map((h) => ({
              id: h.id,
              recordDate: h.recordDate,
              recordType: h.recordType,
              veterinarianName: h.veterinarianName,
              clinicName: h.clinicName,
              diagnosis: h.diagnosis,
              treatment: h.treatment,
              medications: h.medications,
              notes: h.notes,
            }));
          }

          if (vaccRes.status === "fulfilled") {
            vaccinations = vaccRes.value.map((v) => ({
              id: v.id,
              vaccineName: v.vaccineName,
              vaccineType: v.vaccineType,
              vaccinationDate: v.vaccinationDate,
              nextDueDate: v.nextDueDate ?? null,
              veterinarianName: v.veterinarianName,
              notes: "",
            }));
          }
        } catch {
          // Sub-fetches are non-critical
        }
      }

      return {
        animalInfo,
        healthRecords,
        vaccinations,
        vetInfo:
          vetRes.status === "fulfilled"
            ? vetRes.value.map((v) => ({
                id: v.id,
                type: v.type,
                therapeuticCategory: v.therapeuticCategory,
                targetSpecies: v.targetSpecies,
                activeIngredients: v.activeIngredients,
                requiresPrescription: v.requiresPrescription,
                registrationNumber: v.registrationNumber,
                storageInstructions: v.storageInstructions,
              }))
            : [],
        chemicalInfo:
          chemRes.status === "fulfilled" && chemRes.value.length > 0
            ? chemRes.value.map((c) => ({
                id: c.id,
                subType: c.subType,
                activeIngredients: "",
                registrationNumber: c.registrationNumber,
                toxicityLevel: c.toxicityLevel,
                isOrganic: c.isOrganic,
                applicationMethod: "",
                targetPests: "",
                targetCrops: "",
                safetyInstructions: "",
              }))
            : [],
        feedInfo:
          feedRes.status === "fulfilled" && feedRes.value.length > 0
            ? feedRes.value.map((f) => ({
                id: f.id,
                targetAnimal: f.targetAnimal,
                targetAge: f.targetAge,
                proteinPercentage: f.proteinPercentage as number | null,
                fatPercentage: f.fatPercentage as number | null,
                fiberPercentage: f.fiberPercentage as number | null,
                isOrganic: f.isOrganic,
                isGMOFree: f.isGMOFree,
                feedingInstructions: f.feedingInstructions,
                storageInstructions: f.storageInstructions,
              }))
            : [],
        seedInfo:
          seedRes.status === "fulfilled" && seedRes.value.length > 0
            ? seedRes.value.map((s) => ({
                id: s.id,
                variety: s.variety,
                scientificName: s.scientificName,
                germinationRate: s.germinationRate as number | null,
                daysToMaturity: s.daysToMaturity ?? null,
                plantingSeason: "",
                harvestSeason: "",
                isOrganic: s.isOrganic,
                isHybrid: s.isHybrid,
                climateZones: "",
                soilType: "",
              }))
            : [],
        machineryInfo:
          machRes.status === "fulfilled" && machRes.value.length > 0
            ? machRes.value.map((m) => ({
                id: m.id,
                model: m.model,
                yearOfManufacture: m.yearOfManufacture ?? null,
                powerHp: m.powerHp as number | null,
                hoursUsed: m.hoursUsed ?? null,
                hasWarranty: m.hasWarranty,
                serialNumber: "",
                powerSource: "",
              }))
            : [],
      };
    },
    enabled: (options?.enabled ?? true) && !!productId,
  });
}

export function useMediaBucket(
  bucketId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.fileBuckets.detail(bucketId ?? ""),
    queryFn: async () => {
      const response = await FileProviderAPI.Buckets.Detail.Request({
        bucketId: bucketId!,
        changeId: EMPTY_GUID,
      });

      if (!response.files || response.files.length === 0) return [];

      return response.files
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((file: any) => !file.contentType?.startsWith("video/"))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((file: any) => {
          if (file.variants && file.variants.length > 0) {
            return `${AppConfig.FileStorageBaseUrl}${file.variants[0].url}`;
          }
          return `${AppConfig.FileStorageBaseUrl}${file.path}`;
        });
    },
    enabled: (options?.enabled ?? true) && !!bucketId,
  });
}
