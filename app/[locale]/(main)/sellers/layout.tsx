import { AppConfig } from "@/config/livestock-config";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = AppConfig.SiteUrl;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({ locale, pageName: "sellers", path: "/sellers" });
}

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "Sellers", url: `${BASE_URL}/sellers` },
      ]} />
      {children}
    </>
  );
}
