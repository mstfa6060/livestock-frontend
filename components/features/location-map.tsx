"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  zoom?: number;
  className?: string;
}

export function LocationMap({
  latitude,
  longitude,
  label,
  zoom = 10,
  className,
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    }).setView([latitude, longitude], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Custom marker icon (Leaflet default icon fix for bundlers)
    const icon = L.divIcon({
      className: "custom-map-marker",
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="hsl(var(--primary))" width="32" height="32"><path d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 7.94 8.5 15.5 8.5 15.5s8.5-7.56 8.5-15.5C20.5 3.81 16.69 0 12 0zm0 12.5a4 4 0 110-8 4 4 0 010 8z"/></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    if (label) {
      marker.bindPopup(`<strong>${label}</strong>`);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, label, zoom]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-[250px] rounded-lg overflow-hidden ${className ?? ""}`}
      style={{ zIndex: 0 }}
    />
  );
}
