import type { Metadata } from "next";
import { AppConfig } from "@/config/livestock-config";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = AppConfig.SiteUrl;

async function fetchTransporter(id: string) {
  try {
    const res = await fetch(`${AppConfig.LivestockTradingUrl}/Transporters/Detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
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
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const transporter = await fetchTransporter(id);

  if (!transporter) {
    return { title: "Transporter Not Found" };
  }

  const name = transporter.companyName || transporter.businessName || "Transporter";
  const title = `${name} - Livestock Trading`;
  const description =
    transporter.description?.slice(0, 160) || `${name} transporter profile on Livestock Trading.`;
  const image = transporter.logoUrl || undefined;
  const url =
    locale === "en"
      ? `${BASE_URL}/transporters/${id}`
      : `${BASE_URL}/${locale}/transporters/${id}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      ...(image && { images: [{ url: image, alt: name }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
    // Smart App Banner - uncomment when mobile app is published to stores:
    // other: {
    //   "apple-itunes-app": "app-id=APP_STORE_ID, app-argument=" + url,
    //   "google-play-app": "app-id=com.livestocktrading.app",
    // },
  };
}

export default async function TransporterDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transporter = await fetchTransporter(id);

  const jsonLd = transporter
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: transporter.companyName || transporter.businessName || "Transporter",
        url: `${BASE_URL}/transporters/${id}`,
        ...(transporter.logoUrl && { logo: transporter.logoUrl }),
        ...(transporter.description && { description: transporter.description }),
        ...(transporter.email && {
          contactPoint: { "@type": "ContactPoint", email: transporter.email, contactType: "customer service" },
        }),
      }
    : null;

  const transporterName = transporter?.companyName || transporter?.businessName || "Transporter";

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "Transporters", url: `${BASE_URL}/transporters` },
        { name: transporterName, url: `${BASE_URL}/transporters/${id}` },
      ]} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
