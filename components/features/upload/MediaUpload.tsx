'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  PlayCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { FileProviderAPI } from '@/api/base_modules/FileProvider';
import { ApiService } from '@/services/ApiService';
import { AppConfig } from '@/config/livestock-config';
import { cn } from '@/lib/utils';
import {
  compressImage,
  formatFileSize,
  formatCompressionRatio,
} from '@/lib/utils/imageCompression';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export interface MediaFile {
  id: string;
  path: string;
  localUrl: string;
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
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
  localUrl: string;
  isVideo: boolean;
  errorMessage?: string;
}

export interface MediaUploadProps {
  tenantId: string;
  onMediaChange: (bucketId: string, coverFileId: string, files: MediaFile[]) => void;
  initialFiles?: MediaFile[];
  maxFiles?: number;
  folderName?: string;
}

export function MediaUpload({
  tenantId,
  onMediaChange,
  initialFiles = [],
  maxFiles = 10,
  folderName = 'animal-media',
}: MediaUploadProps) {
  const t = useTranslations('fileUpload');
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [bucketId, setBucketId] = useState<string>('');
  const [coverFileId, setCoverFileId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // initialFiles değiştiğinde files state'ini senkronize et
  React.useEffect(() => {
    if (initialFiles.length > 0 && files.length === 0) {
      setFiles(initialFiles);
    }
  }, [initialFiles, files.length]);

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
    updateUploadingFile(tempId, { status: 'compressing', progress: 5 });

    try {
      // Boyut kontrolü
      if (isVideo && file.size > 50 * 1024 * 1024) {
        updateUploadingFile(tempId, {
          status: 'error',
          errorMessage: t('videoTooLarge'),
        });
        return { mediaFile: null, newBucket: currentBucket };
      }

      if (!isVideo && file.size > 10 * 1024 * 1024) {
        updateUploadingFile(tempId, {
          status: 'error',
          errorMessage: t('imageTooLarge'),
        });
        return { mediaFile: null, newBucket: currentBucket };
      }

      let fileToUpload = file;

      // Resim sıkıştırma
      if (!isVideo) {
        try {
          const compressed = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
            maxSizeMB: 1,
          });
          fileToUpload = compressed.file;
          updateUploadingFile(tempId, {
            compressedSize: compressed.compressedSize,
            progress: 20,
            status: 'uploading',
          });
        } catch (err) {
          console.warn('Compression failed, using original:', err);
          updateUploadingFile(tempId, { progress: 20, status: 'uploading' });
        }
      } else {
        updateUploadingFile(tempId, { progress: 20, status: 'uploading' });
      }

      // FormData oluştur
      const formData = new FormData();
      formData.append('formFile', fileToUpload);
      formData.append('moduleName', 'livestocktrading');
      formData.append('bucketId', currentBucket);
      formData.append(
        'bucketType',
        String(FileProviderAPI.Enums.BucketTypes.MultipleFileBucket)
      );
      formData.append('folderName', folderName);
      formData.append('versionName', 'v1');
      formData.append('tenantId', tenantId);

      // ApiService.callMultipart kullanarak yükle
      const response = await ApiService.callMultipart<
        FileProviderAPI.Files.Upload.IResponseModel
      >(`${AppConfig.FileProviderUrl}/Files/Upload`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent =
              20 + Math.round((progressEvent.loaded / progressEvent.total) * 80);
            updateUploadingFile(tempId, { progress: percent });
          }
        },
      });

      const newBucket = response.bucketId;

      if (response.files && response.files.length > 0) {
        // Yüklenen dosyayı bul
        let uploadedFile = response.files.find(
          (f) => f.name === file.name || f.name === fileToUpload.name
        );

        if (!uploadedFile) {
          uploadedFile = response.files[response.files.length - 1];
        }

        // Sunucu URL'ini oluştur
        const serverUrl = `${AppConfig.FileStorageBaseUrl}${uploadedFile.path}`;
        const newFile: MediaFile = {
          id: uploadedFile.id,
          path: uploadedFile.path,
          localUrl: serverUrl,
          isVideo,
          name: uploadedFile.name,
        };

        // Blob URL'i temizle
        URL.revokeObjectURL(localUrl);

        updateUploadingFile(tempId, { status: 'done', progress: 100 });

        // 2 saniye sonra yükleme listesinden kaldır
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
        }, 2000);

        return { mediaFile: newFile, newBucket };
      }

      updateUploadingFile(tempId, {
        status: 'error',
        errorMessage: t('uploadFailed'),
      });
      return { mediaFile: null, newBucket: currentBucket };
    } catch (error: unknown) {
      console.error('Upload error:', error);
      updateUploadingFile(tempId, {
        status: 'error',
        errorMessage: t('uploadError'),
      });
      return { mediaFile: null, newBucket: currentBucket };
    }
  };

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > maxFiles) {
      toast.error(t('maxFilesError', { max: maxFiles }));
      return;
    }

    // Tüm dosyaları önceden kuyruğa ekle
    const queuedFiles: {
      file: File;
      tempId: string;
      localUrl: string;
      isVideo: boolean;
    }[] = [];
    const newUploadingFiles: UploadingFile[] = [];

    for (const file of fileArray) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const isVideo = file.type.startsWith('video/');
      const localUrl = URL.createObjectURL(file);

      queuedFiles.push({ file, tempId, localUrl, isVideo });

      newUploadingFiles.push({
        id: tempId,
        file,
        name: file.name,
        originalSize: file.size,
        progress: 0,
        status: 'pending',
        localUrl,
        isVideo,
      });
    }

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    let currentBucket = bucketId || '';
    const newFiles: MediaFile[] = [];

    // Dosyaları sıralı yükle
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

        // İlk resmi kapak yap
        const existingCover = prevFiles.find((f) => !f.isVideo)?.id;
        const newCover =
          existingCover || newFiles.find((f) => !f.isVideo)?.id || '';

        if (!existingCover && newCover) {
          setCoverFileId(newCover);
        }

        const finalCoverFileId = existingCover || newCover;
        onMediaChange(currentBucket, finalCoverFileId, updatedFiles);

        return updatedFiles;
      });

      toast.success(t('uploadSuccess', { count: newFiles.length }));
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    await handleFiles(selectedFiles);
    event.target.value = '';
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
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );
        if (validFiles.length > 0) {
          await handleFiles(validFiles);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        newCoverFileId = updatedFiles.find((f) => !f.isVideo)?.id || '';
        setCoverFileId(newCoverFileId);
      }

      onMediaChange(bucketId, newCoverFileId, updatedFiles);

      toast.success(t('deleted'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleSetCover = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file && !file.isVideo) {
      setCoverFileId(fileId);
      onMediaChange(bucketId, fileId, files);
      toast.success(t('coverUpdated'));
    }
  };

  const dismissUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
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
            className={cn(
              'p-4 rounded-full transition-colors',
              isDragging ? 'bg-primary/20' : 'bg-gray-200'
            )}
          >
            <Upload
              className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-gray-500')}
            />
          </div>

          <div>
            <p className="font-medium text-gray-700">
              {isDragging ? t('dropHere') : t('dragDrop')}
            </p>
            <p className="text-sm text-gray-500 mt-1">{t('dragDropHint')}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {t('imageLimit')}
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {t('videoLimit')}
            </span>
            <span className="font-medium text-primary">
              {t('uploadCount', { current: files.length, max: maxFiles })}
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
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                uf.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200'
              )}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                {uf.isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- Blob URLs don't work with Next.js Image */
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
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{formatFileSize(uf.originalSize)}</span>
                  {uf.compressedSize && uf.compressedSize < uf.originalSize && (
                    <>
                      <span>→</span>
                      <span className="text-green-600">
                        {formatFileSize(uf.compressedSize)} (
                        {formatCompressionRatio(uf.compressedSize / uf.originalSize)}
                        )
                      </span>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {(uf.status === 'pending' ||
                  uf.status === 'compressing' ||
                  uf.status === 'uploading') && (
                  <div className="mt-2">
                    <Progress value={uf.progress} className="h-1.5" />
                    <p className="text-xs text-gray-500 mt-1">
                      {uf.status === 'pending'
                        ? t('queued')
                        : uf.status === 'compressing'
                          ? t('optimizing')
                          : t('uploading')}
                    </p>
                  </div>
                )}

                {uf.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{uf.errorMessage}</p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {uf.status === 'pending' ? (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-400">⏳</span>
                  </div>
                ) : uf.status === 'compressing' || uf.status === 'uploading' ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : uf.status === 'done' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <button onClick={() => dismissUploadingFile(uf.id)}>
                    <AlertCircle className="h-5 w-5 text-red-500" />
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
              className={cn(
                'relative group overflow-hidden transition-all cursor-pointer',
                coverFileId === file.id && !file.isVideo
                  ? 'ring-2 ring-green-500 shadow-lg'
                  : 'hover:shadow-md'
              )}
            >
              {/* Media Preview */}
              <div className="aspect-square relative bg-gray-100">
                {file.isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <PlayCircle className="w-10 h-10 text-white" />
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {t('videoBadge')}
                    </div>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- Blob URLs don't work with Next.js Image */
                  <img
                    src={file.localUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Cover Badge */}
                {coverFileId === file.id && !file.isVideo && (
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                    ⭐ {t('coverBadge')}
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
                      {t('setCover')}
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

      {/* Auto Optimization Info */}
      {files.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Otomatik optimizasyon:</strong> {t('optimizationInfo')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
