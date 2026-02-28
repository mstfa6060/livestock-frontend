export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

// Processing status enum (matches backend FileProcessingStatus)
export const ProcessingStatus = {
  None: 0,
  Processing: 1,
  Completed: 2,
  Failed: 3,
} as const;

export interface MediaFile {
  id: string;
  path: string;
  url: string;
  isVideo: boolean;
  name: string;
  duration?: number;
  thumbnailPath?: string;
  processingStatus?: number;
  processingError?: string;
}

export interface UploadingFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  localUrl: string;
  isVideo: boolean;
  errorMessage?: string;
}

export interface MediaUploadProps {
  entityId?: string;
  onMediaChange: (
    bucketId: string,
    coverFileId: string,
    files: MediaFile[]
  ) => void;
  initialBucketId?: string;
  initialFiles?: MediaFile[];
  maxFiles?: number;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
