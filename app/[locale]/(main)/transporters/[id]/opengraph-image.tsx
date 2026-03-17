import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Transporter - Livestock Trading";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
const API_BASE = isDevelopment
  ? "https://dev-api.livestock-trading.com"
  : "https://api.livestock-trading.com";

async function fetchTransporter(id: string) {
  try {
    const res = await fetch(`${API_BASE}/livestocktrading/Transporters/Detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? data;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const transporter = await fetchTransporter(id);

  if (!transporter) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #166534 100%)",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐄</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>Livestock Trading</div>
        </div>
      ),
      { ...size }
    );
  }

  const name = transporter.companyName || transporter.businessName || "Transporter";
  const description = transporter.description
    ? transporter.description.length > 120 ? transporter.description.slice(0, 117) + "..." : transporter.description
    : null;
  const logoUrl = transporter.logoUrl || null;
  const rating = transporter.averageRating ? Number(transporter.averageRating).toFixed(1) : null;
  const reviewCount = transporter.totalReviews || 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(160deg, #eff6ff 0%, #ffffff 40%, #f8fafc 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left accent bar - blue for transporters */}
        <div style={{ width: 8, height: "100%", background: "#2563eb", display: "flex" }} />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 60px",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Profile */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 28 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  color: "white",
                  fontWeight: 700,
                  overflow: "hidden",
                }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 44 }}>🚛</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  {name.length > 30 ? name.slice(0, 27) + "..." : name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 18, color: "#2563eb", fontWeight: 600 }}>
                  <span>🚛</span>
                  <span>Nakliyeci</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div style={{ fontSize: 20, color: "#475569", lineHeight: 1.5, display: "flex" }}>
                {description}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 40, marginTop: 32 }}>
              {rating && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 28, color: "#eab308" }}>★</span>
                    <span style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{rating}</span>
                  </div>
                  <span style={{ fontSize: 15, color: "#94a3b8", marginTop: 4 }}>{reviewCount} değerlendirme</span>
                </div>
              )}
              {transporter.vehicleCount > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>{transporter.vehicleCount}</span>
                  <span style={{ fontSize: 15, color: "#94a3b8", marginTop: 4 }}>araç</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: brand bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #e2e8f0",
              paddingTop: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                🐄
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Livestock Trading</span>
            </div>
            <span style={{ fontSize: 15, color: "#94a3b8" }}>livestock-trading.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
