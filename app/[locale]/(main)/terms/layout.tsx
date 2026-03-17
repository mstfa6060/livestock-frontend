import { AppConfig } from "@/config/livestock-config";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = AppConfig.SiteUrl;

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "Terms of Service", url: `${BASE_URL}/terms` },
      ]} />
      {children}
    </>
  );
}
