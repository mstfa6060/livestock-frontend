"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  PlayCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
  Star,
  GripVertical,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

// Processing status enum (matches backend FileProcessingStatus)
const ProcessingStatus = {
  None: 0,
  Processing: 1,
  Completed: 2,
  Failed: 3,
} as const;

interface MediaFile {
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

interface UploadingFile {
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

interface MediaUploadProps {
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

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

  const isUploading = uploadingFiles.some(
    (f) => f.status === "pending" || f.status === "uploading"
  );

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30 hover:bg-muted/50"
          }
          ${files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={() => files.length < maxFiles && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={files.length >= maxFiles}
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`
            p-4 rounded-full transition-colors
            ${isDragging ? "bg-primary/20" : "bg-muted"}
          `}
          >
            <Upload
              className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>

          <div>
            <p className="font-medium">
              {isDragging ? t("dropHere") : t("dragDrop")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("dragDropHint")}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {t("imageLimit")}
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {t("videoLimit")}
            </span>
            <span className="font-medium text-primary">
              {t("uploadCount", { current: files.length, max: maxFiles })}
            </span>
          </div>
        </div>
      </div>

      {/* Uploading Files Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uf) => (
            <div
              key={uf.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                ${uf.status === "error" ? "bg-destructive/10 border-destructive/30" : "bg-card border-border"}
              `}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                {uf.isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                    <PlayCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={uf.localUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uf.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{formatFileSize(uf.originalSize)}</span>
                </div>

                {/* Progress Bar */}
                {(uf.status === "pending" || uf.status === "uploading") && (
                  <div className="mt-2">
                    <Progress value={uf.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {uf.status === "pending" ? t("queued") : t("uploading")}
                    </p>
                  </div>
                )}

                {uf.status === "error" && (
                  <p className="text-xs text-destructive mt-1">
                    {uf.errorMessage}
                  </p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {uf.status === "pending" ? (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">...</span>
                  </div>
                ) : uf.status === "uploading" ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : uf.status === "done" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <button onClick={() => dismissUploadingFile(uf.id)}>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </button>
                )}
              </div>
            </div>
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
                  <Draggable
                    key={file.id}
                    draggableId={file.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={provided.draggableProps.style}
                      >
                        <Card
                          className={`
                            relative group overflow-hidden transition-all
                            ${snapshot.isDragging ? "shadow-xl ring-2 ring-primary/50 z-50" : ""}
                            ${
                              coverFileId === file.id && !file.isVideo
                                ? "ring-2 ring-primary shadow-lg"
                                : "hover:shadow-md"
                            }
                          `}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-1 left-1 z-10 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>

                          {/* Media Preview */}
                          <div className="aspect-square relative bg-muted">
                            {file.isVideo ? (
                              <>
                                {file.processingStatus ===
                                  ProcessingStatus.Completed &&
                                file.thumbnailPath ? (
                                  <img
                                    src={`${AppConfig.FileStorageBaseUrl}${file.thumbnailPath}`}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                                    <PlayCircle className="w-10 h-10 text-muted-foreground" />
                                  </div>
                                )}

                                {/* Video badge */}
                                <div className="absolute bottom-1 left-1 flex items-center gap-1">
                                  <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    {t("videoBadge")}
                                  </span>
                                  {file.duration != null && file.duration > 0 && (
                                    <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatDuration(file.duration)}
                                    </span>
                                  )}
                                </div>

                                {/* Processing status overlay */}
                                {file.processingStatus ===
                                  ProcessingStatus.Processing && (
                                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    <span className="text-[10px] text-white font-medium">
                                      {t("videoProcessing")}
                                    </span>
                                  </div>
                                )}

                                {file.processingStatus ===
                                  ProcessingStatus.Failed && (
                                  <div className="absolute top-1 right-1">
                                    <span
                                      className="bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded"
                                      title={file.processingError}
                                    >
                                      {t("videoProcessingFailed")}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Cover Badge */}
                            {coverFileId === file.id && !file.isVideo && (
                              <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                <Star className="h-3 w-3" /> {t("coverBadge")}
                              </div>
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                              {!file.isVideo && coverFileId !== file.id && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetCover(file.id);
                                  }}
                                  className="text-xs h-7 px-2"
                                >
                                  {t("setCover")}
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(file.id);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}
                  </Draggable>
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
