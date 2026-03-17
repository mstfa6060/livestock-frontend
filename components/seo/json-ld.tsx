import { AppConfig } from "@/config/livestock-config";
/**
 * JSON-LD Structured Data Components for SEO
 * @see https://schema.org
 */

const BASE_URL = AppConfig.SiteUrl;

// Organization schema - used on homepage/root layout
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Livestock Trading",
    url: BASE_URL,
    logo: `${BASE_URL}/icons/icon-512x512.svg`,
    image: `${BASE_URL}/icons/icon-512x512.svg`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: [
        "Turkish",
        "English",
        "German",
        "French",
        "Spanish",
        "Arabic",
        "Russian",
        "Chinese",
        "Japanese",
        "Korean",
        "Hindi",
        "Portuguese",
      ],
    },
    description:
      "The most trusted live animal trading platform. Buy and sell livestock safely and transparently.",
    foundingDate: "2024",
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      minValue: 2,
      maxValue: 10,
    },
    knowsAbout: [
      "Livestock Trading",
      "Cattle Sales",
      "Sheep Sales",
      "Goat Sales",
      "Animal Marketplace",
      "Agricultural Commerce",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// WebSite schema with search action
export function WebSiteJsonLd({ locale }: { locale?: string }) {
  const url = locale && locale !== "en" ? `${BASE_URL}/${locale}` : BASE_URL;

  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Livestock Trading",
    url: BASE_URL,
    inLanguage: locale || "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ItemList schema for homepage featured products / collections
interface CollectionItem {
  name: string;
  url: string;
  image?: string;
  position: number;
}

export function ItemListJsonLd({
  name,
  items,
}: {
  name: string;
  items: CollectionItem[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Product schema
interface ProductJsonLdProps {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "SoldOut";
  url: string;
  seller?: {
    name: string;
    url?: string;
  };
  category?: string;
  rating?: number;
  reviewCount?: number;
}

export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency,
  availability,
  url,
  seller,
  category,
  rating,
  reviewCount,
}: ProductJsonLdProps) {
  const availabilityMap = {
    InStock: "https://schema.org/InStock",
    OutOfStock: "https://schema.org/OutOfStock",
    SoldOut: "https://schema.org/SoldOut",
  };

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description.slice(0, 5000),
    ...(image && { image }),
    ...(category && { category }),
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: availabilityMap[availability],
      url,
      ...(seller && {
        seller: {
          "@type": "Organization",
          name: seller.name,
          ...(seller.url && { url: seller.url }),
        },
      }),
    },
  };

  if (rating && reviewCount && reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// BreadcrumbList schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// FAQ schema
interface FaqItem {
  question: string;
  answer: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
