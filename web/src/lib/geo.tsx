import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api.ts";

export interface Position {
    lat: number;
    lon: number;
    label: string;
}

type Status = "idle" | "locating" | "ready" | "denied" | "error";

interface GeoContextValue {
    position: Position | null;
    status: Status;
    locate: () => void;
    setPosition: (position: Position) => void;
}

const STORAGE_KEY = "marketsquare:position";
export const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];

const GeoContext = createContext<GeoContextValue | null>(null);

const readStored = (): Position | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Position) : null;
    } catch {
        return null;
    }
};

export function GeoProvider({ children }: { children: ReactNode }) {
    const [position, setPositionState] = useState<Position | null>(readStored);
    const [status, setStatus] = useState<Status>(position ? "ready" : "idle");

    const setPosition = useCallback((next: Position) => {
        setPositionState(next);
        setStatus("ready");
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            return;
        }
    }, []);

    const locate = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setStatus("error");
            return;
        }
        setStatus("locating");
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const point = await api.places.reverse(coords.latitude, coords.longitude).catch(() => null);
                setPosition({
                    lat: coords.latitude,
                    lon: coords.longitude,
                    label: point?.label ?? "Ma position",
                });
            },
            (error) => setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error"),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    }, [setPosition]);

    useEffect(() => {
        if (position || !navigator.permissions) return;
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
            if (result.state === "granted") locate();
        }).catch(() => undefined);
    }, [position, locate]);

    return <GeoContext.Provider value={{ position, status, locate, setPosition }}>{children}</GeoContext.Provider>;
}

export function useGeo(): GeoContextValue {
    const context = useContext(GeoContext);
    if (!context) throw new Error("useGeo must be used inside <GeoProvider>");
    return context;
}
