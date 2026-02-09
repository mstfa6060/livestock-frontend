"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MainHeader } from "@/components/layout/main-header";
import { SimpleFooter } from "@/components/layout/footer";
import { ProductCard, ProductCardSkeleton, Product } from "@/components/features/product-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BadgeCheck,
  Star,
  ShoppingBag,
  Package,
  Mail,
  Phone,
  Globe,
  ArrowLeft,
  MessageSquare,
  Calendar,
  Clock,
  CreditCard,
  Truck,
  RotateCcw,
} from "lucide-react";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";

interface SellerDetail {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  taxNumber: string;
  registrationNumber: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  email: string;
  phone: string;
  website: string;
  isVerified: boolean;
  verifiedAt?: Date;
  isActive: boolean;
  status: number;
  averageRating?: number;
  totalReviews: number;
  totalSales: number;
  totalRevenue: number;
  businessHours: string;
  acceptedPaymentMethods: string;
  returnPolicy: string;
  shippingPolicy: string;
  socialMediaLinks: string;
  createdAt: Date;
  updatedAt?: Date;
}

export default function SellerDetailPage() {
  const t = useTranslations("sellers.detail");
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Fetch seller details
  useEffect(() => {
    const fetchSeller = async () => {
      if (!sellerId) return;

      setIsLoading(true);
      try {
        const response = await LivestockTradingAPI.Sellers.Detail.Request({
          id: sellerId,
        });
        setSeller(response as unknown as SellerDetail);
      } catch {
        setSeller(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  // Fetch seller's products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!sellerId) return;

      setIsLoadingProducts(true);
      try {
        const response = await LivestockTradingAPI.Products.All.Request({
          countryCode: "TR",
          sorting: {
            key: "createdAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
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
          pageRequest: {
            currentPage: 1,
            perPageCount: 12,
            listAll: false,
          },
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

        setProducts(transformedProducts);
      } catch {
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [sellerId]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MainHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MainHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-4">
              {t("notFound")}
            </p>
            <Button asChild>
              <Link href="/sellers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToList")}
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/sellers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToList")}
          </Link>
        </Button>

        {/* Banner */}
        {seller.bannerUrl ? (
          <div className="relative h-48 rounded-lg overflow-hidden mb-6">
            <Image
              src={seller.bannerUrl}
              alt={seller.businessName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-48 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 mb-6" />
        )}

        {/* Seller Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-24 w-24 border-4 border-background -mt-12 relative z-10">
              {seller.logoUrl ? (
                <AvatarImage src={seller.logoUrl} alt={seller.businessName} />
              ) : null}
              <AvatarFallback className="text-2xl">
                {getInitials(seller.businessName)}
              </AvatarFallback>
            </Avatar>

            <div className="pt-2 md:pt-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{seller.businessName}</h1>
                {seller.isVerified && (
                  <BadgeCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              <p className="text-muted-foreground">{seller.businessType}</p>
              <p className="text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t("memberSince", { year: getMemberYear(seller.createdAt) })}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:ml-auto">
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto text-yellow-400 mb-1" />
                <p className="text-2xl font-bold">
                  {seller.averageRating
                    ? Number(seller.averageRating).toFixed(1)
                    : "-"}
                </p>
                <p className="text-xs text-muted-foreground">{t("stats.rating")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-6 w-6 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">{seller.totalReviews}</p>
                <p className="text-xs text-muted-foreground">
                  {t("stats.totalReviews")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-6 w-6 mx-auto text-green-500 mb-1" />
                <p className="text-2xl font-bold">{seller.totalSales}</p>
                <p className="text-xs text-muted-foreground">
                  {t("stats.totalSales")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">
                  {t("stats.totalProducts")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">{t("allProducts")}</TabsTrigger>
            <TabsTrigger value="about">{t("about")}</TabsTrigger>
            <TabsTrigger value="policies">{t("policies")}</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Bu saticinin henuz ilani yok
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Description */}
              {seller.description && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("description")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {seller.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Business Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("businessInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("businessName")}
                    </p>
                    <p className="font-medium">{seller.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("businessType")}
                    </p>
                    <p className="font-medium">{seller.businessType}</p>
                  </div>
                  {seller.businessHours && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {t("businessHours")}
                      </p>
                      <p className="font-medium">{seller.businessHours}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Iletisim</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {seller.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${seller.email}`}
                        className="text-primary hover:underline"
                      >
                        {seller.email}
                      </a>
                    </div>
                  )}
                  {seller.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${seller.phone}`}
                        className="text-primary hover:underline"
                      >
                        {seller.phone}
                      </a>
                    </div>
                  )}
                  {seller.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={seller.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {seller.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Return Policy */}
              {seller.returnPolicy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      {t("returnPolicy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {seller.returnPolicy}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Policy */}
              {seller.shippingPolicy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {t("shippingPolicy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {seller.shippingPolicy}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Payment Methods */}
              {seller.acceptedPaymentMethods && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {t("paymentMethods")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {seller.acceptedPaymentMethods}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* No policies */}
              {!seller.returnPolicy &&
                !seller.shippingPolicy &&
                !seller.acceptedPaymentMethods && (
                  <div className="md:col-span-2 text-center py-16">
                    <p className="text-muted-foreground">
                      Satici henuz politikalarini belirlemedi
                    </p>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SimpleFooter />
    </div>
  );
}
