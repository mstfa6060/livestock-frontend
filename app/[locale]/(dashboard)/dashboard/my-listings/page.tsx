"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
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

type ListingStatus = "all" | "active" | "draft" | "sold" | "pending";

export default function MyListingsPage() {
  const t = useTranslations("myListings");
  const tn = useTranslations("dashboardNav");
  const tp = useTranslations("products");
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<ListingStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<Product[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Fetch seller profile first
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!user?.id) return;

      try {
        // Find seller profile by userId using Sellers.All with filter
        const sellersResponse = await LivestockTradingAPI.Sellers.All.Request({
          sorting: { key: "createdAt", direction: 1 },
          filters: [
            {
              key: "userId",
              type: "guid",
              isUsed: true,
              values: [user.id],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 1, listAll: false },
        });

        if (sellersResponse.length > 0) {
          setSellerId(sellersResponse[0].id);
          console.log("✅ Seller profile found:", sellersResponse[0].id);
        } else {
          console.log("ℹ️ No seller profile found for user");
          setSellerId(null);
        }
      } catch (error) {
        console.error("❌ Error fetching seller profile:", error);
        setSellerId(null);
      }
    };

    fetchSellerProfile();
  }, [user?.id]);

  // Fetch user's listings
  useEffect(() => {
    const fetchListings = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("🔍 Fetching products for sellerId:", sellerId);
        const response = await LivestockTradingAPI.Products.All.Request({
          countryCode: "TR",
          sorting: { key: "createdAt", direction: 1 }, // Descending
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
          pageRequest: { currentPage: 1, perPageCount: 100, listAll: true },
        });

        const transformedProducts: Product[] = response.map((item) => ({
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
          imageUrl: undefined,
        }));

        setListings(transformedProducts);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
        toast.error(t("fetchError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [sellerId, t]);

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

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await LivestockTradingAPI.Products.Delete.Request({ id: productToDelete });

      // Remove from local state
      setListings((prev) => prev.filter((p) => p.id !== productToDelete));

      toast.success(t("deleteSuccess"));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error(t("deleteError"));
    }
  };

  const handleToggleStatus = async (productId: string) => {
    const product = listings.find((p) => p.id === productId);
    if (!product) return;

    const newStatus = product.status === 1 ? 0 : 1; // Toggle between active (1) and draft (0)

    try {
      await LivestockTradingAPI.Products.Update.Request({
        id: productId,
        status: newStatus,
      });

      // Update local state
      setListings((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );

      toast.success(
        newStatus === 1 ? t("activateSuccess") : t("deactivateSuccess")
      );
    } catch (error) {
      console.error("Failed to update status:", error);
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
