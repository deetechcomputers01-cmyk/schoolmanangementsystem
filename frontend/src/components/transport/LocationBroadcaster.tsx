"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Square } from "lucide-react";

interface Props {
  vehicleId: string;
  vehicleLabel: string;
}

export function LocationBroadcaster({ vehicleId, vehicleLabel }: Props) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPostRef = useRef(0);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function start() {
    if (!("geolocation" in navigator)) {
      setError("This device/browser does not support location sharing.");
      return;
    }
    setError("");
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastPostRef.current < 10000) return; // throttle to at most once every 10s
        lastPostRef.current = now;
        try {
          const res = await fetch(`/api/transport/vehicles/${vehicleId}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              heading: pos.coords.heading ?? undefined,
              speed: pos.coords.speed !== null ? pos.coords.speed * 3.6 : undefined, // m/s -> km/h
            }),
          });
          if (res.ok) setLastSentAt(new Date());
        } catch { /* keep trying on next position update */ }
      },
      (err) => setError(err.message || "Unable to get your location."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = id;
    setSharing(true);
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  return (
    <div className="rounded-xl border bg-white p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-gray-900 text-sm">Live Location — {vehicleLabel}</p>
        <p className="text-xs text-gray-500 mt-1">
          {sharing ? (lastSentAt ? `Sharing · last sent ${lastSentAt.toLocaleTimeString()}` : "Sharing · waiting for GPS fix…") : "Not sharing your location"}
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      {sharing ? (
        <button onClick={stop} className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white text-sm font-semibold px-4 py-2">
          <Square size={14} /> Stop Sharing
        </button>
      ) : (
        <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white text-sm font-semibold px-4 py-2">
          <Navigation size={14} /> Start Sharing
        </button>
      )}
    </div>
  );
}
