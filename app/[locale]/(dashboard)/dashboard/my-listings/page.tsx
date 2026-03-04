"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSellerByUserId } from "@/hooks/queries";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { AppConfig } from "@/config/livestock-config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, MoreVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

const PAGE_SIZE = 20;

// ProductStatus enum: 0=Draft, 1=PendingApproval, 2=Active, 3=Inactive, 4=OutOfStock, 5=Expired, 6=Sold, 7=Rejected
type ListingStatus = "all" | "draft" | "pending" | "active" | "inactive" | "sold" | "rejected";

export default function MyListingsPage() {
  const t = useTranslations("myListings");
  const tn = useTranslations("dashboardNav");
  const tp = useTranslations("products");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ListingStatus>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Fetch seller profile
  const { data: sellerData } = useSellerByUserId(user?.id ?? "", {
    enabled: !!user?.id,
  });
  const sellerId = sellerData?.id ?? null;

  // Fetch listings for this seller
  const { data: listingsRaw = [], isLoading } = useQuery({
    queryKey: queryKeys.products.list({ sellerId, page: "all" }),
    queryFn: async () => {
      if (!sellerId) return [];

      const response = await LivestockTradingAPI.Products.All.Request({
        countryCode: "",
        sorting: { key: "createdAt", direction: 1 },
        filters: [
          {
            key: "sellerId",
            type: "guid",
            isUsed: true,
            values: [sellerId],
            min: {},
            max: {},
            conditionType: "equals",
          },
        ],
        pageRequest: { currentPage: 1, perPageCount: PAGE_SIZE, listAll: false },
      });

      return response.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        shortDescription: item.shortDescription,
        categoryId: item.categoryId,
        brandId: item.brandId || undefined,
        basePrice: item.basePrice as number,
        currency: item.currency,
        discountedPrice: item.discountedPrice as number | undefined,
        stockQuantity: item.stockQuantity,
        isInStock: item.isInStock,
        sellerId: item.sellerId,
        locationId: item.locationId,
        locationCountryCode: item.locationCountryCode,
        locationCity: item.locationCity,
        status: item.status,
        condition: item.condition,
        viewCount: item.viewCount,
        averageRating: item.averageRating as number | undefined,
        reviewCount: item.reviewCount,
        createdAt: item.createdAt,
        imageUrl: item.coverImageUrl ? `${AppConfig.FileStorageBaseUrl}${item.coverImageUrl}` : undefined,
      })) as Product[];
    },
    enabled: !!sellerId,
  });

  const listings = listingsRaw;

  const filteredListings =
    statusFilter === "all"
      ? listings
      : listings.filter((l) => {
          const statusMap: Record<number, ListingStatus> = {
            0: "draft",
            1: "pending",
            2: "active",
            3: "inactive",
            4: "inactive",
            5: "inactive",
            6: "sold",
            7: "rejected",
          };
          return statusMap[l.status] === statusFilter;
        });

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await LivestockTradingAPI.Products.Delete.Request({ id: productToDelete });

      queryClient.invalidateQueries({ queryKey: queryKeys.products.list({ sellerId, page: "all" }) });

      toast.success(t("deleteSuccess"));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleToggleStatus = async (productId: string) => {
    const product = listings.find((p) => p.id === productId);
    if (!product) return;

    // Draft(0) → PendingApproval(1), Active(2)/PendingApproval(1) → Draft(0)
    const newStatus = product.status === 0 ? 1 : 0;

    try {
      // Fetch full product details for update (API requires all fields)
      const fullProduct = await LivestockTradingAPI.Products.Detail.Request({ id: productId });

      await LivestockTradingAPI.Products.Update.Request({
        id: productId,
        title: fullProduct.title,
        slug: fullProduct.slug,
        description: fullProduct.description,
        shortDescription: fullProduct.shortDescription,
        categoryId: fullProduct.categoryId,
        basePrice: fullProduct.basePrice,
        currency: fullProduct.currency,
        priceUnit: fullProduct.priceUnit,
        stockQuantity: fullProduct.stockQuantity,
        stockUnit: fullProduct.stockUnit,
        isInStock: fullProduct.isInStock,
        sellerId: fullProduct.sellerId,
        locationId: fullProduct.locationId,
        status: newStatus,
        condition: fullProduct.condition,
        isShippingAvailable: fullProduct.isShippingAvailable,
        shippingCost: fullProduct.shippingCost,
        isInternationalShipping: fullProduct.isInternationalShipping,
        weight: fullProduct.weight,
        weightUnit: fullProduct.weightUnit,
        attributes: fullProduct.attributes,
        metaTitle: fullProduct.metaTitle,
        metaDescription: fullProduct.metaDescription,
        metaKeywords: fullProduct.metaKeywords,
        // Note: Detail endpoint doesn't return these yet, pass empty to preserve existing
        mediaBucketId: (fullProduct as unknown as Record<string, unknown>).mediaBucketId as string || "",
        coverImageFileId: (fullProduct as unknown as Record<string, unknown>).coverImageFileId as string || "",
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.products.list({ sellerId, page: "all" }) });

      toast.success(
        newStatus === 1 ? t("publishSuccess") : t("unpublishSuccess")
      );
    } catch {
      toast.error(t("statusError"));
    }
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
              <SelectItem value="draft">{t("filters.draft")}</SelectItem>
              <SelectItem value="pending">{t("filters.pending")}</SelectItem>
              <SelectItem value="active">{t("filters.active")}</SelectItem>
              <SelectItem value="rejected">{t("filters.rejected")}</SelectItem>
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
                  listing.status === 2
                    ? "default"
                    : listing.status === 0
                    ? "secondary"
                    : listing.status === 7
                    ? "destructive"
                    : "outline"
                }
              >
                {tp(`status.${
                  listing.status === 0 ? "draft" :
                  listing.status === 1 ? "pending" :
                  listing.status === 2 ? "active" :
                  listing.status === 3 ? "inactive" :
                  listing.status === 6 ? "sold" :
                  listing.status === 7 ? "rejected" : "draft"
                }`)}
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
                    <span className="sr-only">{t("actions.menu")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("actions.edit")}
                    </Link>
                  </DropdownMenuItem>
                  {listing.status === 0 && (
                    <DropdownMenuItem onClick={() => handleToggleStatus(listing.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t("actions.publish")}
                    </DropdownMenuItem>
                  )}
                  {(listing.status === 1 || listing.status === 2) && (
                    <DropdownMenuItem onClick={() => handleToggleStatus(listing.id)}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      {t("actions.unpublish")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(listing.id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
