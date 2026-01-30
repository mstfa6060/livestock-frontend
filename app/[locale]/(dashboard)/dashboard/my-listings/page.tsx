"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

type ListingStatus = "all" | "active" | "draft" | "sold" | "pending";

export default function MyListingsPage() {
  const t = useTranslations("myListings");
  const tn = useTranslations("dashboardNav");
  const tp = useTranslations("products");

  const [statusFilter, setStatusFilter] = useState<ListingStatus>("all");
  const [isLoading] = useState(false);

  // Mock data - in production, fetch from API
  const listings: Product[] = [];

  const filteredListings =
    statusFilter === "all"
      ? listings
      : listings.filter((l) => {
          const statusMap: Record<number, ListingStatus> = {
            0: "draft",
            1: "active",
            2: "sold",
            3: "pending",
          };
          return statusMap[l.status] === statusFilter;
        });

  const handleDelete = (productId: string) => {
    console.log("Delete product:", productId);
  };

  const handleToggleStatus = (productId: string) => {
    console.log("Toggle status:", productId);
  };

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ListingStatus)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              <SelectItem value="active">{t("filters.active")}</SelectItem>
              <SelectItem value="draft">{t("filters.draft")}</SelectItem>
              <SelectItem value="pending">{t("filters.pending")}</SelectItem>
              <SelectItem value="sold">{t("filters.sold")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button asChild>
          <Link href="/dashboard/listings/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            {tn("newListing")}
          </Link>
        </Button>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg mb-4">{t("noListings")}</p>
          <Button asChild>
            <Link href="/dashboard/listings/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("createFirst")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="relative group">
              <ProductCard product={listing} />

              {/* Status Badge Overlay */}
              <Badge
                className="absolute top-2 left-2 z-10"
                variant={
                  listing.status === 1
                    ? "default"
                    : listing.status === 0
                    ? "secondary"
                    : "outline"
                }
              >
                {tp(`status.${listing.status === 0 ? "draft" : listing.status === 1 ? "active" : listing.status === 2 ? "sold" : "pending"}`)}
              </Badge>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("actions.edit")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(listing.id)}>
                    {listing.status === 1 ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        {t("actions.deactivate")}
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        {t("actions.activate")}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(listing.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
