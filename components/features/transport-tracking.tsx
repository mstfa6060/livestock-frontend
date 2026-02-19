"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LivestockTradingAPI } from "@/api/business_modules/livestocktrading";
import { MapPin, Clock, FileText } from "lucide-react";

interface TrackingEvent {
  id: string;
  locationDescription: string;
  status: number;
  statusDescription: string;
  recordedAt: Date;
  notes: string;
}

interface TransportTrackingProps {
  transportRequestId: string;
}

export function TransportTracking({ transportRequestId }: TransportTrackingProps) {
  const t = useTranslations("transportTracking");
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      setIsLoading(true);
      try {
        const response = await LivestockTradingAPI.TransportTrackings.All.Request({
          sorting: {
            key: "recordedAt",
            direction: LivestockTradingAPI.Enums.XSortingDirection.Descending,
          },
          filters: [
            {
              key: "transportRequestId",
              type: "guid",
              isUsed: true,
              values: [transportRequestId],
              min: {},
              max: {},
              conditionType: "equals",
            },
          ],
          pageRequest: { currentPage: 1, perPageCount: 50, listAll: false },
        });

        setEvents(
          response.map((e) => ({
            id: e.id,
            locationDescription: e.locationDescription,
            status: e.status,
            statusDescription: e.statusDescription,
            recordedAt: e.recordedAt,
            notes: e.notes,
          }))
        );
      } catch {
        // Tracking may not be available
      } finally {
        setIsLoading(false);
      }
    };

    if (transportRequestId) fetchTracking();
  }, [transportRequestId]);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-3 border-t pt-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-3 border-t pt-3">
        <p className="text-sm text-muted-foreground">{t("noTracking")}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5" />
        {t("title")}
      </h4>
      <div className="relative pl-4 border-l-2 border-muted space-y-4">
        {events.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute -left-[calc(0.5rem+1px)] top-1 w-2 h-2 rounded-full bg-primary" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {event.statusDescription || t("update")}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(event.recordedAt).toLocaleString()}
                </span>
              </div>
              {event.locationDescription && (
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  {event.locationDescription}
                </p>
              )}
              {event.notes && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3 shrink-0" />
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
