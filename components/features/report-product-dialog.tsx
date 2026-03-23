"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const REASONS = [
  { value: "0", key: "fake" },
  { value: "1", key: "wrongPrice" },
  { value: "2", key: "illegalContent" },
  { value: "3", key: "spam" },
  { value: "4", key: "fraud" },
  { value: "5", key: "other" },
] as const;

interface ReportProductDialogProps {
  productId: string;
  productTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportProductDialog({
  productId,
  productTitle,
  open,
  onOpenChange,
}: ReportProductDialogProps) {
  const t = useTranslations("report");
  const { isAuthenticated } = useAuth();

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !description.trim()) return;
    setIsSubmitting(true);

    try {
      await LivestockTradingAPI.ProductReports.Create.Request({
        productId,
        reason: parseInt(reason),
        description: description.trim(),
      });
      toast.success(t("success"));
      setReason("");
      setDescription("");
      onOpenChange(false);
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { product: productTitle })}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(`reasons.${r.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">{t("description")}</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || !description.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
