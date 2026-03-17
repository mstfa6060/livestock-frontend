import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://livestock-trading.com";

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Home", url: BASE_URL },
        { name: "Contact", url: `${BASE_URL}/contact` },
      ]} />
      {children}
    </>
  );
}
