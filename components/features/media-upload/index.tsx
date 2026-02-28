"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";
import { toast } from "sonner";
import { api } from "@/config/livestock-config";
import {
  useDeleteFileMutation,
  useReorderFilesMutation,
  useSetCoverMutation,
} from "@/hooks/queries/useMediaUpload";
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  type MediaFile,
  type UploadingFile,
  type MediaUploadProps,
  ProcessingStatus,
} from "./types";
import { DropZone } from "./drop-zone";
import { UploadProgressItem } from "./upload-progress-item";
import { MediaCard } from "./media-card";

export type { MediaFile, MediaUploadProps } from "./types";

export function MediaUpload({
  entityId,
  onMediaChange,
  initialBucketId = "",
  initialFiles = [],
  maxFiles = 10,
}: MediaUploadProps) {
  const t = useTranslations("fileUpload");
  const deleteFileMutation = useDeleteFileMutation();
  const reorderFilesMutation = useReorderFilesMutation();
  const setCoverMutation = useSetCoverMutation();
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [bucketId, setBucketId] = useState<string>(initialBucketId);
  const [coverFileId, setCoverFileId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFailCountRef = useRef(0);

  // Sync initial files
  useEffect(() => {
    if (initialFiles.length > 0 && files.length === 0) {
      setFiles(initialFiles);
      const firstImage = initialFiles.find((f) => !f.isVideo);
      if (firstImage) {
        setCoverFileId(firstImage.id);
      }
    }
  }, [initialFiles]);

  // Sync initial bucket
  useEffect(() => {
    if (initialBucketId && !bucketId) {
      setBucketId(initialBucketId);
    }
  }, [initialBucketId]);

  // Poll processing status for videos that are still processing
  useEffect(() => {
    const processingFiles = files.filter(
      (f) => f.isVideo && f.processingStatus === ProcessingStatus.Processing
    );

    if (processingFiles.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await api.post(
          `${AppConfig.FileProviderUrl}/Files/ProcessingStatus`,
          {
            fileEntryIds: processingFiles.map((f) => f.id),
          }
        );

        const responseData = response.data;
        const statuses = responseData.payload || responseData;
        pollFailCountRef.current = 0;

        if (Array.isArray(statuses) && statuses.length > 0) {
          setFiles((prev) => {
            let changed = false;
            const updated = prev.map((f) => {
              const status = statuses.find(
                (s: Record<string, unknown>) => s.fileEntryId === f.id
              );
              if (status && status.processingStatus !== f.processingStatus) {
                changed = true;
                return {
                  ...f,
                  processingStatus: status.processingStatus,
                  duration: status.duration ?? f.duration,
                  thumbnailPath: status.thumbnailPath ?? f.thumbnailPath,
                  processingError: status.processingError ?? f.processingError,
                  url: status.thumbnailPath
                    ? `${AppConfig.FileStorageBaseUrl}${status.thumbnailPath}`
                    : f.url,
                };
              }
              return f;
            });

            if (changed) {
              onMediaChange(bucketId, coverFileId, updated);
            }
            return changed ? updated : prev;
          });
        }
      } catch {
        pollFailCountRef.current += 1;
        if (pollFailCountRef.current >= 3) {
          toast.error(t("videoProcessingPollError"));
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    };

    pollingRef.current = setInterval(pollStatus, 4000);
    // Also poll immediately
    pollStatus();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [
    files.filter(
      (f) => f.isVideo && f.processingStatus === ProcessingStatus.Processing
    ).length,
  ]);

  const updateUploadingFile = (id: string, updates: Partial<UploadingFile>) => {
    setUploadingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const processFile = async (
    file: File,
    currentBucket: string,
    tempId: string,
    localUrl: string,
    isVideo: boolean
  ): Promise<{ mediaFile: MediaFile | null; newBucket: string }> => {
    updateUploadingFile(tempId, { status: "uploading", progress: 5 });

    try {
      // Frontend size validation (backend also validates)
      if (isVideo && file.size > 100 * 1024 * 1024) {
        updateUploadingFile(tempId, {
          status: "error",
          errorMessage: t("videoTooLarge"),
        });
        return { mediaFile: null, newBucket: currentBucket };
      }

      if (!isVideo && file.size > 10 * 1024 * 1024) {
        updateUploadingFile(tempId, {
          status: "error",
          errorMessage: t("imageTooLarge"),
        });
        return { mediaFile: null, newBucket: currentBucket };
      }

      // Dosyayi dogrudan yukle - backend ImageSharp ile isler
      const formData = new FormData();
      formData.append("formFile", file);
      formData.append("moduleName", "LivestockTrading");
      formData.append("bucketId", currentBucket);
      formData.append(
        "bucketType",
        String(FileProviderAPI.Enums.BucketTypes.MultipleFileBucket)
      );
      formData.append("folderName", "products");
      formData.append("versionName", "v1");
      formData.append("companyId", AppConfig.companyId);
      if (entityId) {
        formData.append("entityId", entityId);
      }

      const response = await api.post(
        `${AppConfig.FileProviderUrl}/Files/Upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent =
                5 +
                Math.round((progressEvent.loaded / progressEvent.total) * 95);
              updateUploadingFile(tempId, { progress: percent });
            }
          },
        }
      );

      const responseData = response.data;
      const payload = responseData.payload || responseData;
      const newBucket = payload.bucketId;

      if (payload.files && payload.files.length > 0) {
        // Find the uploaded file
        let uploadedFile = payload.files.find(
          (f: Record<string, unknown>) => f.name === file.name
        );

        if (!uploadedFile) {
          uploadedFile = payload.files[payload.files.length - 1];
        }

        // Build URL
        const fileUrl =
          uploadedFile.variants && uploadedFile.variants.length > 0
            ? `${AppConfig.FileStorageBaseUrl}${uploadedFile.variants[0].url}`
            : `${AppConfig.FileStorageBaseUrl}${uploadedFile.path}`;

        const newFile: MediaFile = {
          id: uploadedFile.id,
          path: uploadedFile.path,
          url: fileUrl,
          isVideo,
          name: uploadedFile.name,
          duration: uploadedFile.duration,
          thumbnailPath: uploadedFile.thumbnailPath,
          processingStatus: uploadedFile.processingStatus ?? ProcessingStatus.None,
        };

        // Clean up blob URL
        URL.revokeObjectURL(localUrl);

        updateUploadingFile(tempId, { status: "done", progress: 100 });

        // Remove from uploading list after 2 seconds
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
        }, 2000);

        return { mediaFile: newFile, newBucket };
      }

      updateUploadingFile(tempId, {
        status: "error",
        errorMessage: t("uploadFailed"),
      });
      return { mediaFile: null, newBucket: currentBucket };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        t("uploadError");
      updateUploadingFile(tempId, { status: "error", errorMessage });
      return { mediaFile: null, newBucket: currentBucket };
    }
  };

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > maxFiles) {
      toast.error(t("maxFilesError", { max: maxFiles }));
      return;
    }

    // Queue all files
    const queuedFiles: {
      file: File;
      tempId: string;
      localUrl: string;
      isVideo: boolean;
    }[] = [];
    const newUploadingFiles: UploadingFile[] = [];

    for (const file of fileArray) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const isVideo = file.type.startsWith("video/");
      const localUrl = URL.createObjectURL(file);

      queuedFiles.push({ file, tempId, localUrl, isVideo });

      newUploadingFiles.push({
        id: tempId,
        file,
        name: file.name,
        originalSize: file.size,
        progress: 0,
        status: "pending",
        localUrl,
        isVideo,
      });
    }

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    let currentBucket = bucketId || "";
    const newFiles: MediaFile[] = [];

    // Process files sequentially
    for (const qf of queuedFiles) {
      const result = await processFile(
        qf.file,
        currentBucket,
        qf.tempId,
        qf.localUrl,
        qf.isVideo
      );
      if (result.mediaFile) {
        newFiles.push(result.mediaFile);
      }
      if (result.newBucket) {
        currentBucket = result.newBucket;
      }
    }

    if (newFiles.length > 0) {
      setBucketId(currentBucket);

      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...newFiles];

        // Set first image as cover
        const existingCover = prevFiles.find((f) => !f.isVideo)?.id;
        const newCover =
          existingCover || newFiles.find((f) => !f.isVideo)?.id || "";

        if (!existingCover && newCover) {
          setCoverFileId(newCover);
        }

        const finalCoverFileId = existingCover || newCover;
        onMediaChange(currentBucket, finalCoverFileId, updatedFiles);

        return updatedFiles;
      });

      toast.success(t("uploadSuccess", { count: newFiles.length }));
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    await handleFiles(selectedFiles);
    event.target.value = "";
  };

  // Drag & Drop handlers (file drop from OS)
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        const validFiles = Array.from(droppedFiles).filter(
          (file) =>
            file.type.startsWith("image/") || file.type.startsWith("video/")
        );
        if (validFiles.length > 0) {
          await handleFiles(validFiles);
        }
      }
    },
    [files.length, maxFiles, bucketId]
  );

  // DnD reorder handler
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      const reordered = Array.from(files);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      setFiles(reordered);
      onMediaChange(bucketId, coverFileId, reordered);

      // Persist to backend
      if (bucketId) {
        try {
          await reorderFilesMutation.mutateAsync({
            bucketId,
            fileOrders: reordered.map((f, idx) => ({
              fileId: f.id,
              index: idx,
            })),
          });
        } catch {
          // Revert on failure
          setFiles(files);
          onMediaChange(bucketId, coverFileId, files);
          toast.error(t("reorderError"));
        }
      }
    },
    [files, bucketId, coverFileId, onMediaChange]
  );

  const handleRemoveFile = async (fileId: string) => {
    try {
      if (bucketId) {
        await deleteFileMutation.mutateAsync({ bucketId, fileId });
      }

      const updatedFiles = files.filter((f) => f.id !== fileId);
      setFiles(updatedFiles);

      let newCoverFileId = coverFileId;
      if (coverFileId === fileId) {
        newCoverFileId = updatedFiles.find((f) => !f.isVideo)?.id || "";
        setCoverFileId(newCoverFileId);
      }

      onMediaChange(bucketId, newCoverFileId, updatedFiles);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleSetCover = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || file.isVideo) return;

    setCoverFileId(fileId);
    onMediaChange(bucketId, fileId, files);

    if (bucketId) {
      try {
        await setCoverMutation.mutateAsync({ bucketId, fileId });
        toast.success(t("coverUpdated"));
      } catch {
        toast.error(t("coverUpdateError"));
      }
    } else {
      toast.success(t("coverUpdated"));
    }
  };

  const dismissUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <DropZone
        isDragging={isDragging}
        filesCount={files.length}
        maxFiles={maxFiles}
        fileInputRef={fileInputRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onFileSelect={handleFileSelect}
      />

      {/* Uploading Files Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uf) => (
            <UploadProgressItem
              key={uf.id}
              file={uf}
              onDismiss={dismissUploadingFile}
            />
          ))}
        </div>
      )}

      {/* Media Grid with DnD Reorder */}
      {files.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="media-grid" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              >
                {files.map((file, index) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    index={index}
                    coverFileId={coverFileId}
                    onSetCover={handleSetCover}
                    onRemove={handleRemoveFile}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Info */}
      {files.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{t("optimizationInfo")}</span>
          </p>
        </div>
      )}
    </div>
  );
}
