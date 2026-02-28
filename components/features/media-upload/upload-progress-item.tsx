"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PlayCircle, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { type UploadingFile, formatFileSize } from "./types";

interface UploadProgressItemProps {
  file: UploadingFile;
  onDismiss: (id: string) => void;
}

export function UploadProgressItem({ file: uf, onDismiss }: UploadProgressItemProps) {
  const t = useTranslations("fileUpload");

  return (
    <div
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
          <button onClick={() => onDismiss(uf.id)}>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}
