import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export interface ProductMediaInfo {
  productId: string;
  mediaBucketId?: string | null;
  coverImageFileId?: string | null;
}

/**
 * Fetches cover image URLs for products using their mediaBucketId + coverImageFileId
 * (already available from Products.All response).
 * Calls FileProvider.Buckets.Detail to resolve actual file URLs.
 * Returns a map of productId -> imageUrl.
 */
export async function getProductCoverImagesDirect(
  products: ProductMediaInfo[]
): Promise<Record<string, string>> {
  // Filter products that have valid media bucket IDs
  const withMedia = products.filter(
    (p) => p.mediaBucketId && p.mediaBucketId !== EMPTY_GUID
  );

  if (withMedia.length === 0) return {};

  // Collect unique bucket IDs to minimize API calls
  const uniqueBucketIds = [...new Set(withMedia.map((m) => m.mediaBucketId!))];

  // Fetch bucket details for all unique buckets in parallel
  const bucketResults = await Promise.allSettled(
    uniqueBucketIds.map((bucketId) =>
      FileProviderAPI.Buckets.Detail.Request({
        bucketId,
        changeId: EMPTY_GUID,
      })
    )
  );

  // Build a map of bucketId -> files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketFilesMap: Record<string, any[]> = {};
  bucketResults.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.files?.length > 0) {
      bucketFilesMap[uniqueBucketIds[index]] = result.value.files;
    }
  });

  // Match each product's coverImageFileId to a file and build URL
  const imageMap: Record<string, string> = {};

  for (const pm of withMedia) {
    const files = bucketFilesMap[pm.mediaBucketId!];
    if (!files) continue;

    // Find the cover image file
    let targetFile = files.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => f.id === pm.coverImageFileId
    );

    // Fallback: first non-video file
    if (!targetFile) {
      targetFile = files.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => !f.contentType?.startsWith("video/")
      );
    }

    if (targetFile) {
      if (targetFile.variants?.length > 0) {
        imageMap[pm.productId] = `${AppConfig.FileStorageBaseUrl}${targetFile.variants[0].url}`;
      } else if (targetFile.path) {
        imageMap[pm.productId] = `${AppConfig.FileStorageBaseUrl}${targetFile.path}`;
      }
    }
  }

  return imageMap;
}

/**
 * Legacy: Fetches cover images by calling Products.MediaDetail first.
 * Use getProductCoverImagesDirect when you already have mediaBucketId from Products.All.
 */
export async function getProductCoverImages(
  productIds: string[]
): Promise<Record<string, string>> {
  if (productIds.length === 0) return {};

  // Step 1: Fetch MediaDetail for all products in parallel
  const mediaResults = await Promise.allSettled(
    productIds.map((id) =>
      LivestockTradingAPI.Products.MediaDetail.Request({ productId: id })
    )
  );

  const productMedia: ProductMediaInfo[] = [];

  mediaResults.forEach((result, index) => {
    if (
      result.status === "fulfilled" &&
      result.value.mediaBucketId &&
      result.value.mediaBucketId !== EMPTY_GUID
    ) {
      productMedia.push({
        productId: productIds[index],
        mediaBucketId: result.value.mediaBucketId,
        coverImageFileId: result.value.coverImageFileId,
      });
    }
  });

  return getProductCoverImagesDirect(productMedia);
}
