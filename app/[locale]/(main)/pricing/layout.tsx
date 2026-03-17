import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://livestock-trading.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({ locale, pageName: "pricing", path: "/pricing" });
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "Pricing", url: `${BASE_URL}/pricing` },
      ]} />
      {children}
    </>
  );
}
