import type { Metadata } from "next";
import { AppConfig } from "@/config/livestock-config";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://livestock-trading.com";

async function fetchProductBySlug(slug: string) {
  try {
    const res = await fetch(`${AppConfig.LivestockTradingUrl}/Products/DetailBySlug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.metaTitle || product.title;
  const description =
    product.metaDescription || product.shortDescription || product.description?.slice(0, 160);
  const keywords = product.metaKeywords || undefined;
  const image = product.coverImageUrl || undefined;
  const url =
    locale === "en"
      ? `${BASE_URL}/products/${slug}`
      : `${BASE_URL}/${locale}/products/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(image && { images: [{ url: image, alt: title }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
    // Smart App Banner - uncomment when mobile app is published to stores:
    // other: {
    //   "apple-itunes-app": "app-id=APP_STORE_ID, app-argument=" + url,
    //   "google-play-app": "app-id=com.livestocktrading.app",
    // },
  };
}

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) return children;

  const url =
    locale === "en"
      ? `${BASE_URL}/products/${slug}`
      : `${BASE_URL}/${locale}/products/${slug}`;

  const availability = !product.isInStock
    ? "OutOfStock"
    : product.status === 2
      ? "SoldOut"
      : "InStock";

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: BASE_URL },
          { name: "Products", url: `${BASE_URL}/products` },
          { name: product.title, url },
        ]}
      />
      <ProductJsonLd
        name={product.title}
        description={product.shortDescription || product.description?.slice(0, 300) || ""}
        image={product.coverImageUrl}
        price={product.basePrice}
        currency={product.currency || "TRY"}
        availability={availability as "InStock" | "OutOfStock" | "SoldOut"}
        url={url}
        seller={product.sellerName ? { name: product.sellerName } : undefined}
        category={product.categoryName}
        rating={product.averageRating}
        reviewCount={product.reviewCount}
      />
      {children}
    </>
  );
}
