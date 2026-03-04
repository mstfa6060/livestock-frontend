"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useRoles } from "@/hooks/useRoles";
import { useVaccinations } from "@/hooks/queries/useVeterinary";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Syringe,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface VaccinationFormData {
  animalInfoId: string;
  vaccineName: string;
  vaccineType: string;
  batchNumber: string;
  vaccinationDate: string;
  nextDueDate: string;
  veterinarianName: string;
  veterinarianLicense: string;
  notes: string;
  certificateUrl: string;
}

const emptyForm: VaccinationFormData = {
  animalInfoId: "",
  vaccineName: "",
  vaccineType: "",
  batchNumber: "",
  vaccinationDate: new Date().toISOString().split("T")[0],
  nextDueDate: "",
  veterinarianName: "",
  veterinarianLicense: "",
  notes: "",
  certificateUrl: "",
};

export default function VaccinationsPage() {
  const t = useTranslations("vaccinations");
  const tc = useTranslations("common");
  const { isSeller, isVeterinarian, isAdmin, isStaff } = useRoles();

  const queryClient = useQueryClient();
  const { data: vaccinations = [], isLoading } = useVaccinations();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<VaccinationFormData>(emptyForm);

  const hasAccess = isSeller || isVeterinarian || isAdmin || isStaff;

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (vaccinationId: string) => {
    try {
      const detail = await LivestockTradingAPI.Vaccinations.Detail.Request({
        id: vaccinationId,
      });
      setFormData({
        animalInfoId: detail.animalInfoId || "",
        vaccineName: detail.vaccineName || "",
        vaccineType: detail.vaccineType || "",
        batchNumber: detail.batchNumber || "",
        vaccinationDate: detail.vaccinationDate
          ? new Date(detail.vaccinationDate).toISOString().split("T")[0]
          : "",
        nextDueDate: detail.nextDueDate
          ? new Date(detail.nextDueDate).toISOString().split("T")[0]
          : "",
        veterinarianName: detail.veterinarianName || "",
        veterinarianLicense: detail.veterinarianLicense || "",
        notes: detail.notes || "",
        certificateUrl: detail.certificateUrl || "",
      });
      setEditingId(vaccinationId);
      setShowForm(true);
    } catch {
      toast.error(t("fetchError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        animalInfoId: formData.animalInfoId,
        vaccineName: formData.vaccineName,
        vaccineType: formData.vaccineType,
        batchNumber: formData.batchNumber,
        vaccinationDate: new Date(formData.vaccinationDate),
        nextDueDate: formData.nextDueDate
          ? new Date(formData.nextDueDate)
          : undefined,
        veterinarianName: formData.veterinarianName,
        veterinarianLicense: formData.veterinarianLicense,
        notes: formData.notes,
        certificateUrl: formData.certificateUrl,
      };

      if (editingId) {
        await LivestockTradingAPI.Vaccinations.Update.Request({
          id: editingId,
          ...payload,
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.Vaccinations.Create.Request(payload);
        toast.success(t("createSuccess"));
      }
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.vaccinations.all,
      });
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vaccinationId: string) => {
    try {
      await LivestockTradingAPI.Vaccinations.Delete.Request({
        id: vaccinationId,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vaccinations.all,
      });
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const isUpcoming = (nextDueDate?: Date | string) => {
    if (!nextDueDate) return false;
    const due = new Date(nextDueDate);
    const now = new Date();
    const daysUntil = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil >= 0 && daysUntil <= 30;
  };

  const isOverdue = (nextDueDate?: Date | string) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Syringe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{tc("unauthorized")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Syringe className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addVaccination")}
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editVaccination") : t("addVaccination")}
                <Button variant="ghost" size="icon" onClick={resetForm} aria-label={t("cancel")}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vac-animalInfoId">
                      {t("animalInfoId")}
                    </Label>
                    <Input
                      id="vac-animalInfoId"
                      value={formData.animalInfoId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          animalInfoId: e.target.value,
                        })
                      }
                      placeholder={t("animalInfoIdPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vac-name">{t("vaccineName")}</Label>
                    <Input
                      id="vac-name"
                      value={formData.vaccineName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vaccineName: e.target.value,
                        })
                      }
                      placeholder={t("vaccineNamePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vac-type">{t("vaccineType")}</Label>
                    <Input
                      id="vac-type"
                      value={formData.vaccineType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vaccineType: e.target.value,
                        })
                      }
                      placeholder={t("vaccineTypePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vac-batch">{t("batchNumber")}</Label>
                    <Input
                      id="vac-batch"
                      value={formData.batchNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          batchNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="vac-date">{t("vaccinationDate")}</Label>
                    <Input
                      id="vac-date"
                      type="date"
                      value={formData.vaccinationDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vaccinationDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vac-nextDue">{t("nextDueDate")}</Label>
                    <Input
                      id="vac-nextDue"
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nextDueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vac-vetName">
                      {t("veterinarianName")}
                    </Label>
                    <Input
                      id="vac-vetName"
                      value={formData.veterinarianName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          veterinarianName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vac-vetLicense">
                      {t("veterinarianLicense")}
                    </Label>
                    <Input
                      id="vac-vetLicense"
                      value={formData.veterinarianLicense}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          veterinarianLicense: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vac-notes">{t("notes")}</Label>
                  <Textarea
                    id="vac-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="vac-certUrl">{t("certificateUrl")}</Label>
                  <Input
                    id="vac-certUrl"
                    value={formData.certificateUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificateUrl: e.target.value,
                      })
                    }
                    placeholder="https://"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {tc("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? t("saving") : tc("save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : vaccinations.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <Syringe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noVaccinations")}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1fr_120px_120px_1fr_120px_60px] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div>{t("vaccineName")}</div>
              <div>{t("vaccineType")}</div>
              <div>{t("vaccinationDate")}</div>
              <div>{t("veterinarianName")}</div>
              <div>{t("nextDueDate")}</div>
              <div></div>
            </div>

            {vaccinations.map((vac) => (
              <div
                key={vac.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_1fr_120px_60px] gap-2 md:gap-4 px-4 py-3 border-t items-center hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{vac.vaccineName}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="md:hidden font-medium text-foreground mr-1">
                    {t("vaccineType")}:
                  </span>
                  {vac.vaccineType || "-"}
                </div>

                <div className="text-sm">
                  <span className="md:hidden text-muted-foreground mr-1">
                    {t("vaccinationDate")}:
                  </span>
                  {formatDate(vac.vaccinationDate)}
                </div>

                <div className="text-sm">{vac.veterinarianName}</div>

                <div className="text-sm">
                  {vac.nextDueDate ? (
                    <Badge
                      variant={
                        isOverdue(vac.nextDueDate)
                          ? "destructive"
                          : isUpcoming(vac.nextDueDate)
                            ? "default"
                            : "outline"
                      }
                      className="text-xs gap-1"
                    >
                      {isOverdue(vac.nextDueDate) && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {!isOverdue(vac.nextDueDate) && (
                        <Calendar className="h-3 w-3" />
                      )}
                      {formatDate(vac.nextDueDate)}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </div>

                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(vac.id)}
                    aria-label={t("editVaccination")}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(vac.id)}
                    aria-label={t("deleteVaccination")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
