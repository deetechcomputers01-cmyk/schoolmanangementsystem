"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

export interface VehicleLocation {
  id: string;
  regNo: string;
  make: string;
  driverName: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  locationUpdatedAt: string | null;
}

interface Props {
  vehicles: VehicleLocation[];
  pollUrl?: string;
  pollIntervalMs?: number;
}

const GHANA_CENTER: [number, number] = [5.6037, -0.187];

function isStale(updatedAt: string | null) {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > 2 * 60 * 1000;
}

export function VehicleMap({ vehicles: initial, pollUrl, pollIntervalMs = 10000 }: Props) {
  const [vehicles, setVehicles] = useState(initial);

  useEffect(() => {
    if (!pollUrl) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(pollUrl);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.map((v: any) => ({
            id: v.id, regNo: v.regNo, make: v.make,
            driverName: v.driver ? `${v.driver.firstName} ${v.driver.lastName}` : null,
            latitude: v.latitude, longitude: v.longitude, speed: v.speed, locationUpdatedAt: v.locationUpdatedAt,
          })));
        }
      } catch { /* silent — keep last known positions */ }
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollUrl, pollIntervalMs]);

  const located = vehicles.filter((v) => v.latitude !== null && v.longitude !== null);
  const center: [number, number] = located.length > 0 ? [located[0].latitude!, located[0].longitude!] : GHANA_CENTER;

  return (
    <MapContainer center={center} zoom={12} style={{ height: 360, width: "100%", borderRadius: 8 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((v) => (
        <Marker key={v.id} position={[v.latitude!, v.longitude!]}>
          <Popup>
            <strong>{v.regNo}</strong> · {v.make}<br />
            {v.driverName ?? "No driver assigned"}<br />
            {v.speed !== null && <>{Math.round(v.speed)} km/h<br /></>}
            <span style={{ color: isStale(v.locationUpdatedAt) ? "#ba1a1a" : "#1b5e1b" }}>
              {v.locationUpdatedAt ? `Updated ${new Date(v.locationUpdatedAt).toLocaleTimeString()}` : "No location yet"}
              {isStale(v.locationUpdatedAt) && v.locationUpdatedAt ? " (stale)" : ""}
            </span>
          </Popup>
        </Marker>
      ))}
      {located.length === 0 && null}
    </MapContainer>
  );
}
