import { useEffect, useRef } from "react";

export type DispatchPin = {
  latitude: number;
  longitude: number;
  label: string;
  kind: "incident" | "ambulance" | "hospital";
};

export function DispatchMap({
  pins,
  focus,
}: {
  pins: DispatchPin[];
  focus: { latitude: number; longitude: number };
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((module) => {
      if (cancelled || container.current === null || mapRef.current !== null) return;
      const L = module.default;
      const map = L.map(container.current, { zoomControl: false }).setView(
        [focus.latitude, focus.longitude],
        14,
      );
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((module) => {
      if (cancelled || mapRef.current === null || layerRef.current === null) return;
      const L = module.default;
      const layer = layerRef.current;
      layer.clearLayers();
      pins.forEach((pin) => {
        const icon = L.divIcon({
          className: `lifeline-map-pin lifeline-map-pin--${pin.kind}`,
          html: `<span aria-label="${pin.kind}"></span>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker([pin.latitude, pin.longitude], { icon }).bindTooltip(pin.label).addTo(layer);
      });
      mapRef.current.setView([focus.latitude, focus.longitude], 14, { animate: false });
      mapRef.current.invalidateSize();
    });
    return () => {
      cancelled = true;
    };
  }, [pins, focus]);

  return <div className="dispatch-map" ref={container} aria-label="Map of ambulances, hospitals, and incidents" role="application" />;
}