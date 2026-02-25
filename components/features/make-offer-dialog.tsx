"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { HandCoins, X } from "lucide-react";

interface MakeOfferDialogProps {
  productId: string;
  sellerId: string;
  productTitle: string;
  basePrice: number;
  currency: string;
  maxQuantity: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MakeOfferDialog({
  productId,
  sellerId,
  productTitle,
  basePrice,
  currency,
  maxQuantity,
  isOpen,
  onClose,
  onSuccess,
}: MakeOfferDialogProps) {
  const t = useTranslations("offers");
  const { user } = useAuth();

  const [price, setPrice] = useState(basePrice.toString());
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error(t("loginRequired"));
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error(t("invalidPrice"));
      return;
    }

    if (isNaN(quantityNum) || quantityNum < 1) {
      toast.error(t("invalidQuantity"));
      return;
    }

    setIsSubmitting(true);
    try {
      await LivestockTradingAPI.Offers.Create.Request({
        productId,
        buyerUserId: user.id,
        sellerUserId: sellerId,
        offeredPrice: priceNum as any,
        currency,
        quantity: quantityNum,
        message,
        status: 0, // Pending
      });

      toast.success(t("offerSent"));
      onClose();
      onSuccess?.();
    } catch {
      toast.error(t("offerError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            {t("makeOffer")}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("cancel")}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {productTitle}
        </p>

        <div className="text-sm mb-4">
          <span className="text-muted-foreground">{t("listingPrice")}: </span>
          <span className="font-medium">
            {basePrice.toLocaleString()} {currency}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="offer-price">{t("yourOffer")} ({currency})</Label>
            <Input
              id="offer-price"
              type="number"
              step="0.01"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="offer-quantity">{t("quantity")}</Label>
            <Input
              id="offer-quantity"
              type="number"
              min="1"
              max={maxQuantity || 999}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="offer-message">{t("messageOptional")}</Label>
            <Textarea
              id="offer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("sending") : t("sendOffer")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
