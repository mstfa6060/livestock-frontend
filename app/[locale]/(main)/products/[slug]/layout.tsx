import type { Metadata } from "next";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { defaultLocale, locales } from "@/i18n/config";

const BASE_URL = "https://livestock-trading.com";
const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
const API_BASE = isDevelopment
  ? "https://dev-api.livestock-trading.com"
  : "https://api.livestock-trading.com";
const FILE_STORAGE_BASE = `${API_BASE}/file-storage/`;

async function fetchProductBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/livestocktrading/Products/DetailBySlug`, {
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

async function fetchCoverImageUrl(mediaBucketId?: string, coverImageFileId?: string): Promise<string | undefined> {
  if (!mediaBucketId) return undefined;
  try {
    const res = await fetch(`${API_BASE}/fileprovider/Buckets/Detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: mediaBucketId, changeId: "00000000-0000-0000-0000-000000000000" }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    const files = data?.data?.files ?? data?.files ?? [];
    const coverFile = coverImageFileId
      ? files.find((f: Record<string, unknown>) => f.id === coverImageFileId)
      : files[0];
    if (!coverFile) return undefined;
    const path = coverFile.variants?.[0]?.url || coverFile.path;
    return path ? `${FILE_STORAGE_BASE}${path}` : undefined;
  } catch {
    return undefined;
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
  const image = await fetchCoverImageUrl(product.mediaBucketId, product.coverImageFileId);
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const url = `${BASE_URL}${prefix}/products/${slug}`;

  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    const locPrefix = loc === defaultLocale ? "" : `/${loc}`;
    alternateLanguages[loc] = `${BASE_URL}${locPrefix}/products/${slug}`;
  }

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(image && { images: [{ url: image, alt: title }] }),
    },
    other: {
      "product:price:amount": String(product.basePrice ?? ""),
      "product:price:currency": product.currency || "TRY",
      ...(product.isInStock != null && {
        "product:availability": product.isInStock ? "in stock" : "out of stock",
      }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
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

  const coverImage = await fetchCoverImageUrl(product.mediaBucketId, product.coverImageFileId);

  const availability = !product.isInStock
    ? "OutOfStock"
    : product.status !== 2
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
        image={coverImage}
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
