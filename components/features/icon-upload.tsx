"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileProviderAPI } from "@/api/base_modules/FileProvider";
import { AppConfig } from "@/config/livestock-config";
import { api } from "@/config/livestock-config";
import { toast } from "sonner";

interface IconUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function IconUpload({ value, onChange }: IconUploadProps) {
  const t = useTranslations("fileUpload");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("formFile", file);
      formData.append("moduleName", "LivestockTrading");
      formData.append("bucketId", "");
      formData.append(
        "bucketType",
        String(FileProviderAPI.Enums.BucketTypes.SingleFileBucket)
      );
      formData.append("folderName", "categories");
      formData.append("versionName", "v1");
      formData.append("companyId", AppConfig.companyId);

      const response = await api.post(
        `${AppConfig.FileProviderUrl}/Files/Upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const payload = response.data.payload || response.data;
      if (payload.files && payload.files.length > 0) {
        const uploaded = payload.files[0];
        const fileUrl =
          uploaded.variants && uploaded.variants.length > 0
            ? uploaded.variants[0].url
            : `${AppConfig.FileStorageBaseUrl}${uploaded.path}`;
        onChange(fileUrl);
      }
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div
        className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30 cursor-pointer hover:border-muted-foreground/50 transition-colors"
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        ) : value ? (
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {value ? t("changeImage") : t("selectImage")}
            </>
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            {t("removeImage")}
          </Button>
        )}
      </div>
    </div>
  );
}
