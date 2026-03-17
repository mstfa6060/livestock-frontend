import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://livestock-trading.com";

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "Privacy Policy", url: `${BASE_URL}/privacy` },
      ]} />
      {children}
    </>
  );
}
