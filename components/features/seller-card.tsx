"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { memo } from "react";
import {
  User,
  Phone,
  MapPin,
  Star,
  Calendar,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

export interface Seller {
  id: string;
  name: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  isVerified?: boolean;
  memberSince?: Date;
  location?: string;
  phoneNumber?: string;
  email?: string;
}

interface SellerCardProps {
  seller: Seller;
  showContact?: boolean;
  onContact?: () => void;
}

export const SellerCard = memo(function SellerCard({ seller, showContact = true, onContact }: SellerCardProps) {
  const t = useTranslations("seller");

  const memberSinceYear = seller.memberSince
    ? new Date(seller.memberSince).getFullYear()
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t("title")}</CardTitle>
          {seller.isVerified && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {t("verified")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={seller.avatarUrl} alt={seller.name} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              href={`/sellers/${seller.id}`}
              className="font-semibold hover:text-primary transition-colors block truncate"
            >
              {seller.name}
            </Link>
            {/* Rating */}
            {seller.rating != null && seller.reviewCount != null && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{seller.rating.toFixed(1)}</span>
                <span>({seller.reviewCount} {t("reviews")})</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {seller.productCount != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">{seller.productCount}</span>
              {t("products")}
            </div>
          )}
          {memberSinceYear && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {t("memberSince", { year: memberSinceYear })}
            </div>
          )}
        </div>

        {/* Location */}
        {seller.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {seller.location}
          </div>
        )}

        {/* Contact Buttons */}
        {showContact && (
          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full" onClick={onContact}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {t("contact")}
            </Button>

            {seller.phoneNumber && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${seller.phoneNumber}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  {t("call")}
                </a>
              </Button>
            )}
          </div>
        )}

        {/* View Profile Link */}
        <div className="text-center pt-2">
          <Link
            href={`/sellers/${seller.id}`}
            className="text-sm text-primary hover:underline"
          >
            {t("viewProfile")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});
