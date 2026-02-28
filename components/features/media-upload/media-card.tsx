"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  X,
  PlayCircle,
  Loader2,
  Star,
  GripVertical,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Draggable } from "@hello-pangea/dnd";
import { AppConfig } from "@/config/livestock-config";
import { type MediaFile, ProcessingStatus, formatDuration } from "./types";

interface MediaCardProps {
  file: MediaFile;
  index: number;
  coverFileId: string;
  onSetCover: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

export function MediaCard({
  file,
  index,
  coverFileId,
  onSetCover,
  onRemove,
}: MediaCardProps) {
  const t = useTranslations("fileUpload");

  return (
    <Draggable draggableId={file.id} index={index}>
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
                      onSetCover(file.id);
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
                    onRemove(file.id);
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
  );
}
