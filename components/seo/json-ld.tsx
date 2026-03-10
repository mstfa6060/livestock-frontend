/**
 * JSON-LD Structured Data Components for SEO
 * @see https://schema.org
 */

// Organization schema - used on homepage/root layout
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Livestock Trading",
    url: "https://livestock-trading.com",
    logo: "https://livestock-trading.com/icons/icon-512.svg",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Turkish", "English", "German", "French", "Spanish", "Arabic"],
    },
    description:
      "The most trusted live animal trading platform. Buy and sell livestock safely and transparently.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// WebSite schema with search action
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Livestock Trading",
    url: "https://livestock-trading.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://livestock-trading.com/search?q={search_term_string}",
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
