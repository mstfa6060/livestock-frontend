"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Upload, Image as ImageIcon, Video } from "lucide-react";

interface DropZoneProps {
  isDragging: boolean;
  filesCount: number;
  maxFiles: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DropZone({
  isDragging,
  filesCount,
  maxFiles,
  fileInputRef,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
}: DropZoneProps) {
  const t = useTranslations("fileUpload");

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
        ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30 hover:bg-muted/50"
        }
        ${filesCount >= maxFiles ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      onClick={() => filesCount < maxFiles && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFileSelect}
        className="hidden"
        disabled={filesCount >= maxFiles}
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
            {t("uploadCount", { current: filesCount, max: maxFiles })}
          </span>
        </div>
      </div>
    </div>
  );
}
