"use client";

import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import { divIcon } from "leaflet";

type ShowroomMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
};

const showroomMarkerIcon = divIcon({
  className: "showroom-map-marker",
  html: '<span class="showroom-map-marker-dot" />',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function ShowroomMap({
  latitude,
  longitude,
  zoom = 15,
  className,
}: ShowroomMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className={`showroom-map ${className ?? "h-72 w-full sm:h-88 lg:h-96"}`}>
      <MapContainer
        center={position}
        zoom={zoom}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={["a", "b", "c"]}
          maxZoom={19}
        />
        <Marker position={position} icon={showroomMarkerIcon} />
        <ZoomControl position="topright" />
      </MapContainer>
    </div>
  );
}
