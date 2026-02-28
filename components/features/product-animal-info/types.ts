export interface AnimalInfo {
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

export interface HealthRecord {
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

export interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineType: string;
  vaccinationDate: Date;
  nextDueDate: Date | null;
  veterinarianName: string;
  notes: string;
}

export interface VetInfo {
  id: string;
  type: number;
  therapeuticCategory: string;
  targetSpecies: string;
  activeIngredients: string;
  requiresPrescription: boolean;
  registrationNumber: string;
  storageInstructions: string;
}

export interface ChemicalInfo {
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

export interface FeedInfo {
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

export interface SeedInfo {
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

export interface MachineryInfo {
  id: string;
  model: string;
  yearOfManufacture: number | null;
  powerHp: number | null;
  hoursUsed: number | null;
  hasWarranty: boolean;
  serialNumber: string;
  powerSource: string;
}
