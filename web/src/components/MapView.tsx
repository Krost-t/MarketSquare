import { useEffect, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { PlaceCategory } from "@marketsquare/shared";
import { CategoryIcon } from "./categories.tsx";

export interface MapPoint {
    id: string;
    lat: number;
    lon: number;
    name: string;
    category: PlaceCategory | null;
    partner?: boolean;
}

const pinIcon = (point: MapPoint, selected: boolean) => {
    const size = selected ? 40 : point.partner ? 34 : 28;
    const base = point.partner
        ? "background:#e2522a;color:#fff;border:2px solid #fff;"
        : "background:#fff;color:#15181e;border:1.5px solid #15181e;";
    const ring = selected ? "box-shadow:0 0 0 4px rgba(226,82,42,.35);" : "box-shadow:0 1px 3px rgba(21,24,30,.35);";
    const html = `<div style="width:${size}px;height:${size}px;border-radius:999px;display:flex;align-items:center;justify-content:center;${base}${ring}">${renderToStaticMarkup(
        <CategoryIcon category={point.category} size={selected ? 20 : point.partner ? 17 : 15} />,
    )}</div>`;
    return L.divIcon({ html, className: "map-pin", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
};

const userIcon = L.divIcon({
    html: '<div style="width:18px;height:18px;border-radius:999px;background:#2b6cf0;border:3px solid #fff;box-shadow:0 0 0 6px rgba(43,108,240,.2)"></div>',
    className: "map-pin",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6 });
    }, [map, center[0], center[1], zoom]);
    return null;
}

export function MapView({
    center,
    zoom = 16,
    user,
    points,
    selectedId,
    onSelect,
    className = "",
}: {
    center: [number, number];
    zoom?: number;
    user?: [number, number] | null;
    points: MapPoint[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    className?: string;
}) {
    const icons = useMemo(
        () => new Map(points.map((point) => [point.id, pinIcon(point, point.id === selectedId)])),
        [points, selectedId],
    );

    return (
        <MapContainer center={center} zoom={zoom} className={className} zoomControl={false} scrollWheelZoom>
            <TileLayer
                url={import.meta.env.VITE_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
            />
            <FlyTo center={center} zoom={zoom} />
            {user && <Marker position={user} icon={userIcon} interactive={false} />}
            {points.map((point) => (
                <Marker
                    key={point.id}
                    position={[point.lat, point.lon]}
                    icon={icons.get(point.id)!}
                    zIndexOffset={point.id === selectedId ? 1000 : point.partner ? 500 : 0}
                    eventHandlers={{ click: () => onSelect?.(point.id) }}
                >
                    <Tooltip direction="top" offset={[0, -14]}>{point.name}</Tooltip>
                </Marker>
            ))}
        </MapContainer>
    );
}
