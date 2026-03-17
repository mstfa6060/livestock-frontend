import { AppConfig } from "@/config/livestock-config";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = AppConfig.SiteUrl;

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "About", url: `${BASE_URL}/about` },
      ]} />
      {children}
    </>
  );
}
