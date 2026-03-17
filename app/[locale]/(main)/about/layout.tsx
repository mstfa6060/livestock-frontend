import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://livestock-trading.com";

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
