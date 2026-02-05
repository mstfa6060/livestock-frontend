"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";
import { toast } from "sonner";
import axios from "axios";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

interface MediaFile {
  id: string;
  path: string;
  url: string;
  isVideo: boolean;
  name: string;
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize?: number;
  progress: number;
  status: "pending" | "compressing" | "uploading" | "done" | "error";
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

// Image compression utility
const compressImage = async (
  file: File,
  options: { maxWidth: number; maxHeight: number; quality: number }
): Promise<{ file: File; compressedSize: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > options.maxWidth) {
        height = (height * options.maxWidth) / width;
        width = options.maxWidth;
      }
      if (height > options.maxHeight) {
        width = (width * options.maxHeight) / height;
        height = options.maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          resolve({
            file: compressedFile,
            compressedSize: compressedFile.size,
          });
        },
        "image/jpeg",
        options.quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export function MediaUpload({
  entityId,
  onMediaChange,
  initialBucketId = "",
  initialFiles = [],
  maxFiles = 10,
}: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [bucketId, setBucketId] = useState<string>(initialBucketId);
  const [coverFileId, setCoverFileId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    updateUploadingFile(tempId, { status: "compressing", progress: 5 });

    try {
      // Size validation
      if (isVideo && file.size > 50 * 1024 * 1024) {
        updateUploadingFile(tempId, {
          status: "error",
          errorMessage: "Video 50MB'dan küçük olmalı",
        });
        return { mediaFile: null, newBucket: currentBucket };
      }

      if (!isVideo && file.size > 10 * 1024 * 1024) {
        updateUploadingFile(tempId, {
          status: "error",
          errorMessage: "Fotoğraf 10MB'dan küçük olmalı",
        });
        return { mediaFile: null, newBucket: currentBucket };
      }

      let fileToUpload = file;

      // Compress images
      if (!isVideo) {
        try {
          const compressed = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
          });
          fileToUpload = compressed.file;
          updateUploadingFile(tempId, {
            compressedSize: compressed.compressedSize,
            progress: 20,
            status: "uploading",
          });
        } catch (err) {
          console.warn("Compression failed, using original:", err);
          updateUploadingFile(tempId, { progress: 20, status: "uploading" });
        }
      } else {
        updateUploadingFile(tempId, { progress: 20, status: "uploading" });
      }

      // Create FormData
      const formData = new FormData();
      formData.append("formFile", fileToUpload);
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

      const token = localStorage.getItem("accessToken");

      // Debug: Log upload request details
      console.log("📤 File Upload Request:", {
        url: `${AppConfig.FileProviderUrl}/Files/Upload`,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type,
        bucketId: currentBucket,
        moduleName: "LivestockTrading",
        folderName: "products",
        companyId: AppConfig.companyId,
        hasToken: !!token,
      });

      const response = await axios.post(
        `${AppConfig.FileProviderUrl}/Files/Upload`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent =
                20 + Math.round((progressEvent.loaded / progressEvent.total) * 80);
              updateUploadingFile(tempId, { progress: percent });
            }
          },
        }
      );

      console.log("✅ File Upload Response:", response.data);

      const responseData = response.data;
      const payload = responseData.payload || responseData;
      const newBucket = payload.bucketId;

      if (payload.files && payload.files.length > 0) {
        // Find the uploaded file
        let uploadedFile = payload.files.find(
          (f: any) => f.name === file.name || f.name === fileToUpload.name
        );

        if (!uploadedFile) {
          uploadedFile = payload.files[payload.files.length - 1];
        }

        // Build URL
        const fileUrl =
          uploadedFile.variants && uploadedFile.variants.length > 0
            ? uploadedFile.variants[0].url
            : `${AppConfig.FileStorageBaseUrl}${uploadedFile.path}`;

        const newFile: MediaFile = {
          id: uploadedFile.id,
          path: uploadedFile.path,
          url: fileUrl,
          isVideo,
          name: uploadedFile.name,
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
        errorMessage: "Yükleme başarısız",
      });
      return { mediaFile: null, newBucket: currentBucket };
    } catch (error: any) {
      // Debug: Log detailed error information
      console.error("❌ File Upload Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        errorCode: error.response?.data?.code,
        errorMessage: error.response?.data?.error?.message,
        stackTrace: error.response?.data?.error?.stackTrace,
        message: error.message,
      });

      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Yükleme hatası";
      console.error("Upload error:", errorMessage, error);
      updateUploadingFile(tempId, { status: "error", errorMessage });
      return { mediaFile: null, newBucket: currentBucket };
    }
  };

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > maxFiles) {
      toast.error(`En fazla ${maxFiles} medya yükleyebilirsiniz`);
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

      toast.success(`${newFiles.length} medya yüklendi`);
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

  // Drag & Drop handlers
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

  const handleRemoveFile = async (fileId: string) => {
    try {
      if (bucketId) {
        await FileProviderAPI.Files.Delete.Request({
          bucketId: bucketId,
          fileId: fileId,
          changeId: EMPTY_GUID,
        });
      }

      const updatedFiles = files.filter((f) => f.id !== fileId);
      setFiles(updatedFiles);

      let newCoverFileId = coverFileId;
      if (coverFileId === fileId) {
        newCoverFileId = updatedFiles.find((f) => !f.isVideo)?.id || "";
        setCoverFileId(newCoverFileId);
      }

      onMediaChange(bucketId, newCoverFileId, updatedFiles);
      toast.success("Medya silindi");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Medya silinemedi");
    }
  };

  const handleSetCover = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file && !file.isVideo) {
      setCoverFileId(fileId);
      onMediaChange(bucketId, fileId, files);
      toast.success("Kapak fotoğrafı ayarlandı");
    }
  };

  const dismissUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const isUploading = uploadingFiles.some(
    (f) =>
      f.status === "pending" ||
      f.status === "compressing" ||
      f.status === "uploading"
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
              {isDragging ? "Bırakın..." : "Fotoğraf veya video yükleyin"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Sürükle-bırak veya tıklayarak seçin
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Fotoğraf: max 10MB
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Video: max 50MB
            </span>
            <span className="font-medium text-primary">
              {files.length} / {maxFiles} yüklendi
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
                  {uf.compressedSize && uf.compressedSize < uf.originalSize && (
                    <>
                      <span>→</span>
                      <span className="text-green-600">
                        {formatFileSize(uf.compressedSize)}
                      </span>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {(uf.status === "pending" ||
                  uf.status === "compressing" ||
                  uf.status === "uploading") && (
                  <div className="mt-2">
                    <Progress value={uf.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {uf.status === "pending"
                        ? "Sırada bekliyor..."
                        : uf.status === "compressing"
                          ? "Optimize ediliyor..."
                          : "Yükleniyor..."}
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
                    <span className="text-xs text-muted-foreground">⏳</span>
                  </div>
                ) : uf.status === "compressing" || uf.status === "uploading" ? (
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

      {/* Media Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((file, index) => (
            <Card
              key={`media-${file.id}-${index}`}
              className={`
                relative group overflow-hidden transition-all cursor-pointer
                ${
                  coverFileId === file.id && !file.isVideo
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }
              `}
            >
              {/* Media Preview */}
              <div className="aspect-square relative bg-muted">
                {file.isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                    <PlayCircle className="w-10 h-10 text-muted-foreground" />
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      VIDEO
                    </div>
                  </div>
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
                    <Star className="h-3 w-3" /> KAPAK
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
                      Kapak Yap
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
          ))}
        </div>
      )}

      {/* Info */}
      {files.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Otomatik optimizasyon:</strong> Fotoğraflar web
              standartlarına uygun şekilde optimize edildi
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
