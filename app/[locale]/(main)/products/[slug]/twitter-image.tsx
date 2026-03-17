import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Product - Livestock Trading";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
const API_BASE = isDevelopment
  ? "https://dev-api.livestock-trading.com"
  : "https://api.livestock-trading.com";

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/livestocktrading/Products/All`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, countryCode: "", pageRequest: { pageNumber: 0, perPageCount: 1 } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data?.data?.items ?? data?.items ?? [];
    if (items.length === 0) return null;
    const detailRes = await fetch(`${API_BASE}/livestocktrading/Products/Detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: items[0].id }),
    });
    if (!detailRes.ok) return null;
    const detailData = await detailRes.json();
    return detailData?.data ?? detailData;
  } catch {
    return null;
  }
}

async function fetchCoverImageUrl(mediaBucketId?: string): Promise<string | undefined> {
  if (!mediaBucketId) return undefined;
  try {
    const res = await fetch(`${API_BASE}/fileprovider/Buckets/Detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: mediaBucketId, changeId: "00000000-0000-0000-0000-000000000000" }),
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    const files = data?.data?.files ?? data?.files ?? [];
    const file = files[0];
    if (!file) return undefined;
    const path = file.variants?.[0]?.url || file.path;
    return path ? `${API_BASE}/file-storage/${path}` : undefined;
  } catch {
    return undefined;
  }
}

function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toLocaleString("tr-TR")}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
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

  const coverUrl = await fetchCoverImageUrl(product.mediaBucketId);
  const price = product.basePrice ? formatPrice(product.basePrice, product.currency || "TRY") : null;
  const title = product.title?.length > 55 ? product.title.slice(0, 52) + "..." : product.title;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: Product Image */}
        <div
          style={{
            display: "flex",
            width: 480,
            height: "100%",
            background: "#f1f5f9",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={product.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ fontSize: 120, opacity: 0.3, display: "flex" }}>🐄</div>
          )}
        </div>

        {/* Right: Product Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "40px 40px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {product.categoryName && (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "5px 14px",
                  borderRadius: 20,
                  marginBottom: 16,
                }}
              >
                {product.categoryName}
              </div>
            )}

            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>

            {price && (
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#16a34a",
                  marginTop: 20,
                  display: "flex",
                }}
              >
                {price}
              </div>
            )}

            {product.sellerName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                  fontSize: 16,
                  color: "#475569",
                }}
              >
                <span>👤</span>
                <span>{product.sellerName}</span>
              </div>
            )}
          </div>

          {/* Bottom: brand bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #e2e8f0",
              paddingTop: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                🐄
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Livestock Trading
              </span>
            </div>
            <span style={{ fontSize: 14, color: "#94a3b8" }}>livestock-trading.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
