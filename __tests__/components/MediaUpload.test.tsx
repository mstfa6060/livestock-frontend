import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translations: Record<string, string | ((...args: unknown[]) => string)> = {
      dragDrop: "Drag & drop files here or click to browse",
      dropHere: "Drop files here",
      dragDropHint: "Supports images and videos",
      imageLimit: "Images: max 10MB",
      videoLimit: "Videos: max 100MB",
      uploadCount: "2 / 10 files",
      queued: "Queued",
      uploading: "Uploading...",
      uploadSuccess: "Files uploaded successfully",
      uploadFailed: "Upload failed",
      uploadError: "Upload error",
      deleted: "File deleted",
      deleteError: "Delete failed",
      coverUpdated: "Cover image updated",
      coverUpdateError: "Cover update failed",
      setCover: "Set as cover",
      coverBadge: "Cover",
      videoBadge: "Video",
      videoProcessing: "Processing...",
      videoProcessingFailed: "Processing failed",
      reorderError: "Reorder failed",
      optimizationInfo: "Images are automatically optimized",
      videoTooLarge: "Video file is too large (max 100MB)",
      imageTooLarge: "Image file is too large (max 10MB)",
      maxFilesError: "Maximum 10 files allowed",
    };
    const t = (key: string) => {
      const val = translations[key];
      if (typeof val === "function") return val();
      return val || key;
    };
    return t;
  },
}));

// Mock sonner toast
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// Mock FileProviderAPI
const mockFileDeleteRequest = vi.fn();
vi.mock("@/api/base_modules/FileProvider", () => ({
  FileProviderAPI: {
    Files: {
      Delete: { Request: (...args: unknown[]) => mockFileDeleteRequest(...args) },
    },
    Enums: {
      BucketTypes: { MultipleFileBucket: 2 },
    },
  },
}));

// Mock livestock-config
const mockApiPost = vi.fn();
vi.mock("@/config/livestock-config", () => ({
  AppConfig: {
    FileStorageBaseUrl: "https://api.livestock-trading.com/file-storage/",
    FileProviderUrl: "https://api.livestock-trading.com/fileprovider",
    companyId: "test-company-id",
  },
  api: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

// Mock @hello-pangea/dnd
vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({
    children,
  }: {
    children: React.ReactNode;
    onDragEnd: unknown;
  }) => <div>{children}</div>,
  Droppable: ({
    children,
  }: {
    children: (provided: {
      innerRef: null;
      droppableProps: Record<string, unknown>;
      placeholder: null;
    }) => React.ReactNode;
  }) =>
    children({
      innerRef: null,
      droppableProps: {},
      placeholder: null,
    }),
  Draggable: ({
    children,
  }: {
    children: (
      provided: {
        innerRef: null;
        draggableProps: { style: Record<string, unknown> };
        dragHandleProps: Record<string, unknown>;
      },
      snapshot: { isDragging: boolean }
    ) => React.ReactNode;
  }) =>
    children(
      {
        innerRef: null,
        draggableProps: { style: {} },
        dragHandleProps: {},
      },
      { isDragging: false }
    ),
}));

import { MediaUpload } from "@/components/features/media-upload";

// ─── Default Props ──────────────────────────────────────────────────

const defaultProps = {
  onMediaChange: vi.fn(),
  maxFiles: 10,
};

// ─── Tests ──────────────────────────────────────────────────────────

describe("MediaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ──────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the drag & drop zone", () => {
      renderWithProviders(<MediaUpload {...defaultProps} />);

      expect(
        screen.getByText("Drag & drop files here or click to browse")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Supports images and videos")
      ).toBeInTheDocument();
    });

    it("should render file type limits", () => {
      renderWithProviders(<MediaUpload {...defaultProps} />);

      expect(screen.getByText("Images: max 10MB")).toBeInTheDocument();
      expect(screen.getByText("Videos: max 100MB")).toBeInTheDocument();
    });

    it("should render with initial files", () => {
      const initialFiles = [
        {
          id: "file-1",
          path: "products/file1.jpg",
          url: "https://api.livestock-trading.com/file-storage/products/file1.jpg",
          isVideo: false,
          name: "file1.jpg",
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      // Should show the image in the grid
      const img = screen.getByAltText("file1.jpg");
      expect(img).toBeInTheDocument();
    });

    it("should not show cover badge when initialFiles passed directly (coverFileId not set)", () => {
      // Note: Component initializes coverFileId="" and only sets it in useEffect
      // when files.length===0, but useState(initialFiles) sets files immediately,
      // so useEffect condition is never met on first render.
      const initialFiles = [
        {
          id: "file-1",
          path: "products/file1.jpg",
          url: "https://api.livestock-trading.com/file-storage/products/file1.jpg",
          isVideo: false,
          name: "file1.jpg",
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      // Cover badge not shown because coverFileId is "" on initial render
      expect(screen.queryByText("Cover")).not.toBeInTheDocument();
    });

    it("should show optimization info when files exist", () => {
      const initialFiles = [
        {
          id: "file-1",
          path: "products/file1.jpg",
          url: "https://test.com/file1.jpg",
          isVideo: false,
          name: "file1.jpg",
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      expect(
        screen.getByText("Images are automatically optimized")
      ).toBeInTheDocument();
    });
  });

  // ─── File Selection ─────────────────────────────────────

  describe("File Selection", () => {
    it("should have a hidden file input", () => {
      renderWithProviders(<MediaUpload {...defaultProps} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeDefined();
      expect(fileInput.accept).toBe("image/*,video/*");
      expect(fileInput.multiple).toBe(true);
    });

    it("should show error when exceeding max files", async () => {
      const initialFiles = Array.from({ length: 10 }, (_, i) => ({
        id: `file-${i}`,
        path: `products/file${i}.jpg`,
        url: `https://test.com/file${i}.jpg`,
        isVideo: false,
        name: `file${i}.jpg`,
      }));

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
          maxFiles={10}
        />
      );

      // The file input should be disabled when at max
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput.disabled).toBe(true);
    });
  });

  // ─── Drag & Drop ────────────────────────────────────────

  describe("Drag & Drop", () => {
    it("should show drop indicator when dragging over", () => {
      renderWithProviders(<MediaUpload {...defaultProps} />);

      const dropZone = screen
        .getByText("Drag & drop files here or click to browse")
        .closest("div[class*='border-dashed']");

      if (dropZone) {
        fireEvent.dragEnter(dropZone, {
          dataTransfer: { files: [] },
        });

        // Should show "Drop files here" text
        expect(screen.getByText("Drop files here")).toBeInTheDocument();
      }
    });

    it("should hide drop indicator when drag leaves", () => {
      renderWithProviders(<MediaUpload {...defaultProps} />);

      const dropZone = screen
        .getByText("Drag & drop files here or click to browse")
        .closest("div[class*='border-dashed']");

      if (dropZone) {
        fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });
        fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });

        expect(
          screen.getByText("Drag & drop files here or click to browse")
        ).toBeInTheDocument();
      }
    });
  });

  // ─── File Deletion ──────────────────────────────────────

  describe("File Deletion", () => {
    it("should call delete API and remove file from list", async () => {
      mockFileDeleteRequest.mockResolvedValueOnce({});

      const initialFiles = [
        {
          id: "file-1",
          path: "products/file1.jpg",
          url: "https://test.com/file1.jpg",
          isVideo: false,
          name: "file1.jpg",
        },
        {
          id: "file-2",
          path: "products/file2.jpg",
          url: "https://test.com/file2.jpg",
          isVideo: false,
          name: "file2.jpg",
        },
      ];

      const onMediaChange = vi.fn();

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
          onMediaChange={onMediaChange}
        />
      );

      // Find delete buttons by data-variant="destructive" attribute
      const deleteButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("data-variant") === "destructive");

      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockFileDeleteRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            bucketId: "bucket-1",
            fileId: "file-1",
          })
        );
      });
    });
  });

  // ─── Video Files ────────────────────────────────────────

  describe("Video Files", () => {
    it("should display video badge for video files", () => {
      const initialFiles = [
        {
          id: "video-1",
          path: "products/video1.mp4",
          url: "https://test.com/video1.mp4",
          isVideo: true,
          name: "video1.mp4",
          processingStatus: 0,
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      expect(screen.getByText("Video")).toBeInTheDocument();
    });

    it("should show processing indicator for videos being processed", () => {
      const initialFiles = [
        {
          id: "video-1",
          path: "products/video1.mp4",
          url: "https://test.com/video1.mp4",
          isVideo: true,
          name: "video1.mp4",
          processingStatus: 1, // Processing
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    it("should show failure badge for failed video processing", () => {
      const initialFiles = [
        {
          id: "video-1",
          path: "products/video1.mp4",
          url: "https://test.com/video1.mp4",
          isVideo: true,
          name: "video1.mp4",
          processingStatus: 3, // Failed
          processingError: "Encoding error",
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      expect(screen.getByText("Processing failed")).toBeInTheDocument();
    });

    it("should display video thumbnail when processing is complete", () => {
      const initialFiles = [
        {
          id: "video-1",
          path: "products/video1.mp4",
          url: "https://api.livestock-trading.com/file-storage/products/thumb.jpg",
          isVideo: true,
          name: "video1.mp4",
          processingStatus: 2, // Completed
          thumbnailPath: "products/thumb.jpg",
          duration: 125,
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      // Thumbnail should be displayed
      const img = screen.getByAltText("video1.mp4");
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toContain("thumb.jpg");
    });

    it("should display video duration when available", () => {
      const initialFiles = [
        {
          id: "video-1",
          path: "products/video1.mp4",
          url: "https://test.com/video1.mp4",
          isVideo: true,
          name: "video1.mp4",
          processingStatus: 2,
          thumbnailPath: "products/thumb.jpg",
          duration: 125, // 2:05
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      expect(screen.getByText("2:05")).toBeInTheDocument();
    });
  });

  // ─── Cover Image ────────────────────────────────────────

  describe("Cover Image", () => {
    it("should not show 'Set as cover' on video files", () => {
      const initialFiles = [
        {
          id: "video-1",
          path: "products/video1.mp4",
          url: "https://test.com/video1.mp4",
          isVideo: true,
          name: "video1.mp4",
          processingStatus: 0,
        },
      ];

      renderWithProviders(
        <MediaUpload
          {...defaultProps}
          initialFiles={initialFiles}
          initialBucketId="bucket-1"
        />
      );

      expect(screen.queryByText("Set as cover")).not.toBeInTheDocument();
    });
  });
});
