import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

/**
 * Fetches cover image URLs for a list of products by calling
 * Products.MediaDetail + FileProvider.Buckets.Detail in parallel.
 * Returns a map of productId -> imageUrl.
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

  // Collect products with valid media buckets
  const productMedia: {
    productId: string;
    mediaBucketId: string;
    coverImageFileId: string;
  }[] = [];

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

  if (productMedia.length === 0) return {};

  // Step 2: Collect unique bucket IDs to minimize API calls
  const uniqueBucketIds = [...new Set(productMedia.map((m) => m.mediaBucketId))];

  // Step 3: Fetch bucket details for all unique buckets in parallel
  const bucketResults = await Promise.allSettled(
    uniqueBucketIds.map((bucketId) =>
      FileProviderAPI.Buckets.Detail.Request({
        bucketId,
        changeId: EMPTY_GUID,
      })
    )
  );

  // Build a map of bucketId -> files
  const bucketFilesMap: Record<string, any[]> = {};
  bucketResults.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.files?.length > 0) {
      bucketFilesMap[uniqueBucketIds[index]] = result.value.files;
    }
  });

  // Step 4: Match each product's coverImageFileId to a file and build URL
  const imageMap: Record<string, string> = {};

  for (const pm of productMedia) {
    const files = bucketFilesMap[pm.mediaBucketId];
    if (!files) continue;

    // Find the cover image file
    let targetFile = files.find(
      (f: any) => f.id === pm.coverImageFileId
    );

    // Fallback: first non-video file
    if (!targetFile) {
      targetFile = files.find(
        (f: any) => !f.contentType?.startsWith("video/")
      );
    }

    if (targetFile) {
      // Prefer variant URL if available, otherwise construct from path
      if (targetFile.variants?.length > 0) {
        imageMap[pm.productId] = `${AppConfig.FileStorageBaseUrl}${targetFile.variants[0].url}`;
      } else if (targetFile.path) {
        imageMap[pm.productId] = `${AppConfig.FileStorageBaseUrl}${targetFile.path}`;
      }
    }
  }

  return imageMap;
}
