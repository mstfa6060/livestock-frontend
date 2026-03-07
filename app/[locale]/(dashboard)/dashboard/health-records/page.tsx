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
import { useHealthRecords } from "@/hooks/queries/useVeterinary";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  ClipboardPlus,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Save,
  Stethoscope,
  Calendar,
} from "lucide-react";

interface RecordFormData {
  animalInfoId: string;
  recordDate: string;
  recordType: string;
  veterinarianName: string;
  veterinarianLicense: string;
  clinicName: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
  followUpDate: string;
  documentUrl: string;
}

const emptyForm: RecordFormData = {
  animalInfoId: "",
  recordDate: new Date().toISOString().split("T")[0],
  recordType: "",
  veterinarianName: "",
  veterinarianLicense: "",
  clinicName: "",
  diagnosis: "",
  treatment: "",
  medications: "",
  notes: "",
  followUpDate: "",
  documentUrl: "",
};

export default function HealthRecordsPage() {
  const t = useTranslations("healthRecords");
  const tc = useTranslations("common");
  const { isSeller, isVeterinarian, isAdmin, isStaff } = useRoles();

  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useHealthRecords();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RecordFormData>(emptyForm);

  const hasAccess = isSeller || isVeterinarian || isAdmin || isStaff;

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = async (recordId: string) => {
    try {
      const detail = await LivestockTradingAPI.HealthRecords.Detail.Request({
        id: recordId,
      });
      setFormData({
        animalInfoId: detail.animalInfoId || "",
        recordDate: detail.recordDate
          ? new Date(detail.recordDate).toISOString().split("T")[0]
          : "",
        recordType: detail.recordType || "",
        veterinarianName: detail.veterinarianName || "",
        veterinarianLicense: detail.veterinarianLicense || "",
        clinicName: detail.clinicName || "",
        diagnosis: detail.diagnosis || "",
        treatment: detail.treatment || "",
        medications: detail.medications || "",
        notes: detail.notes || "",
        followUpDate: detail.followUpDate
          ? new Date(detail.followUpDate).toISOString().split("T")[0]
          : "",
        documentUrl: detail.documentUrl || "",
      });
      setEditingId(recordId);
      setShowForm(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("fetchError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        animalInfoId: formData.animalInfoId,
        recordDate: new Date(formData.recordDate),
        recordType: formData.recordType,
        veterinarianName: formData.veterinarianName,
        veterinarianLicense: formData.veterinarianLicense,
        clinicName: formData.clinicName,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        medications: formData.medications,
        notes: formData.notes,
        followUpDate: formData.followUpDate
          ? new Date(formData.followUpDate)
          : undefined,
        documentUrl: formData.documentUrl,
      };

      if (editingId) {
        await LivestockTradingAPI.HealthRecords.Update.Request({
          id: editingId,
          ...payload,
        });
        toast.success(t("updateSuccess"));
      } else {
        await LivestockTradingAPI.HealthRecords.Create.Request(payload);
        toast.success(t("createSuccess"));
      }
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.healthRecords.all,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      await LivestockTradingAPI.HealthRecords.Delete.Request({ id: recordId });
      queryClient.invalidateQueries({
        queryKey: queryKeys.healthRecords.all,
      });
      toast.success(t("deleteSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteError"));
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <ClipboardPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
              <ClipboardPlus className="h-6 w-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addRecord")}
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? t("editRecord") : t("addRecord")}
                <Button variant="ghost" size="icon" onClick={resetForm} aria-label={t("cancel")}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hr-animalInfoId">
                      {t("animalInfoId")}
                    </Label>
                    <Input
                      id="hr-animalInfoId"
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
                    <Label htmlFor="hr-recordType">{t("recordType")}</Label>
                    <Input
                      id="hr-recordType"
                      value={formData.recordType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recordType: e.target.value,
                        })
                      }
                      placeholder={t("recordTypePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr-recordDate">{t("recordDate")}</Label>
                    <Input
                      id="hr-recordDate"
                      type="date"
                      value={formData.recordDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recordDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr-followUpDate">
                      {t("followUpDate")}
                    </Label>
                    <Input
                      id="hr-followUpDate"
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          followUpDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hr-vetName">
                      {t("veterinarianName")}
                    </Label>
                    <Input
                      id="hr-vetName"
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
                    <Label htmlFor="hr-vetLicense">
                      {t("veterinarianLicense")}
                    </Label>
                    <Input
                      id="hr-vetLicense"
                      value={formData.veterinarianLicense}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          veterinarianLicense: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr-clinicName">{t("clinicName")}</Label>
                    <Input
                      id="hr-clinicName"
                      value={formData.clinicName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clinicName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hr-diagnosis">{t("diagnosis")}</Label>
                    <Textarea
                      id="hr-diagnosis"
                      value={formData.diagnosis}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          diagnosis: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr-treatment">{t("treatment")}</Label>
                    <Textarea
                      id="hr-treatment"
                      value={formData.treatment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          treatment: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hr-medications">{t("medications")}</Label>
                  <Input
                    id="hr-medications"
                    value={formData.medications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medications: e.target.value,
                      })
                    }
                    placeholder={t("medicationsPlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="hr-notes">{t("notes")}</Label>
                  <Textarea
                    id="hr-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="hr-documentUrl">{t("documentUrl")}</Label>
                  <Input
                    id="hr-documentUrl"
                    value={formData.documentUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documentUrl: e.target.value,
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
        ) : records.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <ClipboardPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noRecords")}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1fr_120px_1fr_1fr_120px_60px] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div>{t("recordType")}</div>
              <div>{t("recordDate")}</div>
              <div>{t("diagnosis")}</div>
              <div>{t("veterinarianName")}</div>
              <div>{t("followUpDate")}</div>
              <div></div>
            </div>

            {records.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_1fr_120px_60px] gap-2 md:gap-4 px-4 py-3 border-t items-center hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground hidden md:block" />
                  <div>
                    <p className="font-medium text-sm">{record.recordType}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.clinicName}
                    </p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="md:hidden text-muted-foreground mr-1">
                    {t("recordDate")}:
                  </span>
                  {formatDate(record.recordDate)}
                </div>

                <div className="text-sm truncate">
                  <span className="md:hidden text-muted-foreground mr-1">
                    {t("diagnosis")}:
                  </span>
                  {record.diagnosis || "-"}
                </div>

                <div className="text-sm">
                  <span className="md:hidden text-muted-foreground mr-1">
                    {t("veterinarianName")}:
                  </span>
                  {record.veterinarianName}
                </div>

                <div className="text-sm">
                  {record.followUpDate ? (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.followUpDate)}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </div>

                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(record.id)}
                    aria-label={t("editRecord")}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(record.id)}
                    aria-label={t("deleteRecord")}
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
