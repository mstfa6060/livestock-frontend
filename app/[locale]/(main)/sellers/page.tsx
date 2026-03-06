"use client";

import { useState, useDeferredValue } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BadgeCheck, Star, ShoppingBag } from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { useSellerList } from "@/hooks/queries/useSellers";

interface Seller {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isActive: boolean;
  status: number;
  averageRating?: number;
  totalReviews: number;
  totalSales: number;
  createdAt: Date;
}

type SortOption = "newest" | "mostSales" | "topRated" | "mostProducts";

const ITEMS_PER_PAGE = 12;

const SORT_KEY_MAP: Record<SortOption, string> = {
  newest: "createdAt",
  mostSales: "totalSales",
  topRated: "averageRating",
  mostProducts: "totalSales",
};

function SellerCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellersPage() {
  const t = useTranslations("sellers");
  const tc = useTranslations("common");

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: rawSellers = [], isLoading } = useSellerList({
    sortBy: SORT_KEY_MAP[sortBy],
    sortDirection: LivestockTradingAPI.Enums.XSortingDirection.Descending,
    currentPage,
    perPageCount: ITEMS_PER_PAGE,
  });

  // Only show active sellers
  const sellers = (rawSellers as Seller[]).filter((s) => s.isActive);
  const hasMore = rawSellers.length >= ITEMS_PER_PAGE;

  // Filter sellers by search query (client-side)
  const filteredSellers = deferredSearch
    ? sellers.filter((s) =>
        s.businessName.toLowerCase().includes(deferredSearch.toLowerCase())
      )
    : sellers;

  // Get initials from business name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get member year
  const getMemberYear = (date: Date) => {
    return new Date(date).getFullYear();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              aria-label={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v as SortOption);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortOptions.newest")}</SelectItem>
              <SelectItem value="mostSales">
                {t("sortOptions.mostSales")}
              </SelectItem>
              <SelectItem value="topRated">
                {t("sortOptions.topRated")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {!isLoading && filteredSellers.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {t("showing", { count: filteredSellers.length })}
          </p>
        )}

        {/* Sellers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SellerCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSellers.map((seller) => (
              <Link key={seller.id} href={`/sellers/${seller.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {getInitials(seller.businessName)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {seller.businessName}
                          </h3>
                          {seller.isVerified && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {seller.businessType}
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                          {seller.averageRating !== undefined &&
                            seller.averageRating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{Number(seller.averageRating).toFixed(1)}</span>
                                <span className="text-muted-foreground">
                                  ({seller.totalReviews})
                                </span>
                              </div>
                            )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ShoppingBag className="h-4 w-4" />
                            <span>
                              {seller.totalSales} {t("sales")}
                            </span>
                          </div>
                        </div>

                        {/* Member since */}
                        <p className="text-xs text-muted-foreground mt-2">
                          {t("memberSince", {
                            year: getMemberYear(seller.createdAt),
                          })}
                        </p>
                      </div>
                    </div>

                    {/* View button */}
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      {t("viewProducts")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(currentPage > 1 || hasMore) && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {tc("back")}
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              {currentPage}
            </span>
            <Button
              variant="outline"
              disabled={!hasMore}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {tc("next")}
            </Button>
          </div>
        )}
      </main>

      <SimpleFooter />
    </div>
  );
}
