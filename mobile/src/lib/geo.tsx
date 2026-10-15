import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as Location from "expo-location";
import { api } from "./api";

export interface Position {
    lat: number;
    lon: number;
    label: string;
}

type Status = "idle" | "locating" | "ready" | "denied" | "error";

interface GeoContextValue {
    position: Position | null;
    status: Status;
    locate: () => Promise<void>;
    setPosition: (position: Position) => void;
}

const GeoContext = createContext<GeoContextValue | null>(null);

export function GeoProvider({ children }: { children: ReactNode }) {
    const [position, setPositionState] = useState<Position | null>(null);
    const [status, setStatus] = useState<Status>("idle");

    const setPosition = useCallback((next: Position) => {
        setPositionState(next);
        setStatus("ready");
    }, []);

    const locate = useCallback(async () => {
        setStatus("locating");
        try {
            const { granted } = await Location.requestForegroundPermissionsAsync();
            if (!granted) {
                setStatus("denied");
                return;
            }
            const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const point = await api.places.reverse(coords.latitude, coords.longitude).catch(() => null);
            setPosition({ lat: coords.latitude, lon: coords.longitude, label: point?.label ?? "Ma position" });
        } catch {
            setStatus("error");
        }
    }, [setPosition]);

    useEffect(() => {
        Location.getForegroundPermissionsAsync()
            .then(({ granted }) => {
                if (granted) void locate();
            })
            .catch(() => undefined);
    }, [locate]);

    return <GeoContext.Provider value={{ position, status, locate, setPosition }}>{children}</GeoContext.Provider>;
}

export function useGeo(): GeoContextValue {
    const context = useContext(GeoContext);
    if (!context) throw new Error("useGeo must be used inside <GeoProvider>");
    return context;
}
