import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const runtime = "edge";
export const alt = "Livestock Trading";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const title = t("pages.home.title");
  const description = t("description");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #166534 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            padding: "60px 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
              }}
            >
              🐄
            </div>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Livestock Trading
            </span>
          </div>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 900,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 24, opacity: 0.85, marginTop: 24, maxWidth: 700, lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 80px",
            background: "rgba(0,0,0,0.15)",
            fontSize: 18,
          }}
        >
          <span style={{ opacity: 0.8 }}>livestock-trading.com</span>
          <div style={{ display: "flex", gap: "24px", opacity: 0.7 }}>
            <span>🛡️ Güvenli</span>
            <span>🌍 50+ Dil</span>
            <span>✅ Doğrulanmış Satıcılar</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
