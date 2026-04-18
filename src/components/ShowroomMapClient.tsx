"use client";

import dynamic from "next/dynamic";

const ShowroomMap = dynamic(() => import("@/components/ShowroomMap"), {
  ssr: false,
});

type ShowroomMapClientProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
};

export default function ShowroomMapClient({
  latitude,
  longitude,
  zoom,
  className,
}: ShowroomMapClientProps) {
  return (
    <ShowroomMap
      latitude={latitude}
      longitude={longitude}
      zoom={zoom}
      className={className}
    />
  );
}
