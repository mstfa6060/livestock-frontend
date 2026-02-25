"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Truck, Loader2 } from "lucide-react";

const TransportType = {
  Standard: 0,
  Refrigerated: 1,
  LiveAnimal: 2,
  Hazardous: 3,
  Oversized: 4,
} as const;

interface RequestTransportDialogProps {
  deal: {
    id: string;
    productId: string;
    sellerId: string;
    buyerId: string;
    agreedPrice: number;
    currency: string;
  };
  children: React.ReactNode;
}

export function RequestTransportDialog({ deal, children }: RequestTransportDialogProps) {
  const t = useTranslations("requestTransport");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [transportType, setTransportType] = useState(String(TransportType.Standard));
  const [preferredPickupDate, setPreferredPickupDate] = useState("");
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Create pickup location
      const pickupLoc = await LivestockTradingAPI.Locations.Create.Request({
        name: t("pickupLocation"),
        addressLine1: pickupAddress,
        addressLine2: "",
        city: pickupCity,
        state: "",
        postalCode: "",
        countryCode: "TR",
        phone: "",
        email: "",
        type: 0,
        isActive: true,
        userId: user.id,
      });

      // Create delivery location
      const deliveryLoc = await LivestockTradingAPI.Locations.Create.Request({
        name: t("deliveryLocation"),
        addressLine1: deliveryAddress,
        addressLine2: "",
        city: deliveryCity,
        state: "",
        postalCode: "",
        countryCode: "TR",
        phone: "",
        email: "",
        type: 1,
        isActive: true,
        userId: user.id,
      });

      // Create transport request
      await LivestockTradingAPI.TransportRequests.Create.Request({
        productId: deal.productId,
        sellerId: deal.sellerId,
        buyerId: deal.buyerId,
        agreedPrice: deal.agreedPrice as any,
        currency: deal.currency,
        pickupLocationId: pickupLoc.id,
        deliveryLocationId: deliveryLoc.id,
        weightKg: weightKg ? (parseFloat(weightKg) as any) : undefined,
        specialInstructions,
        preferredPickupDate: preferredPickupDate ? new Date(preferredPickupDate) : undefined,
        preferredDeliveryDate: preferredDeliveryDate ? new Date(preferredDeliveryDate) : undefined,
        isUrgent,
        transportType: parseInt(transportType),
        status: 0, // Pending
        notes: "",
      });

      toast.success(t("success"));
      setOpen(false);
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pickup Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t("pickupLocation")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pickup-city">{t("city")}</Label>
                <Input
                  id="pickup-city"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup-address">{t("address")}</Label>
                <Input
                  id="pickup-address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t("deliveryLocation")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="delivery-city">{t("city")}</Label>
                <Input
                  id="delivery-city"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="delivery-address">{t("address")}</Label>
                <Input
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Transport Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("transportType")}</Label>
              <Select value={transportType} onValueChange={setTransportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("types.standard")}</SelectItem>
                  <SelectItem value="1">{t("types.refrigerated")}</SelectItem>
                  <SelectItem value="2">{t("types.liveAnimal")}</SelectItem>
                  <SelectItem value="3">{t("types.hazardous")}</SelectItem>
                  <SelectItem value="4">{t("types.oversized")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight">{t("weight")}</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder={t("weightPlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pickup-date">{t("preferredPickupDate")}</Label>
              <Input
                id="pickup-date"
                type="date"
                value={preferredPickupDate}
                onChange={(e) => setPreferredPickupDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="delivery-date">{t("preferredDeliveryDate")}</Label>
              <Input
                id="delivery-date"
                type="date"
                value={preferredDeliveryDate}
                onChange={(e) => setPreferredDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="urgent" className="cursor-pointer">
              {t("urgent")}
            </Label>
          </div>

          <div>
            <Label htmlFor="instructions">{t("specialInstructions")}</Label>
            <Textarea
              id="instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              placeholder={t("instructionsPlaceholder")}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  {t("submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
