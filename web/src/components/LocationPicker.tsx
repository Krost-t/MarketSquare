import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { CrosshairSimple, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import type { GeoPoint } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { useGeo } from "../lib/geo.tsx";

export function LocationPicker({ onDone, compact = false }: { onDone?: () => void; compact?: boolean }) {
    const { locate, status, setPosition } = useGeo();
    const [query, setQuery] = useState("");

    const search = useMutation({ mutationFn: (q: string) => api.places.geocode(q) });

    const choose = (point: GeoPoint) => {
        setPosition({ lat: point.lat, lon: point.lon, label: point.label });
        setQuery("");
        search.reset();
        onDone?.();
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (query.trim().length >= 3) search.mutate(query.trim());
    };

    return (
        <div className={compact ? "space-y-3" : "space-y-4"}>
            <button type="button" className="btn-primary w-full" onClick={() => { locate(); onDone?.(); }} disabled={status === "locating"}>
                <CrosshairSimple size={18} weight="bold" aria-hidden />
                {status === "locating" ? "Localisation…" : "Utiliser ma position"}
            </button>
            {status === "denied" && (
                <p className="text-sm text-tomato-700 dark:text-tomato-400">La localisation est bloquée par le navigateur. Saisissez une adresse.</p>
            )}
            <form onSubmit={onSubmit} className="flex gap-2">
                <label className="sr-only" htmlFor="location-query">Adresse ou ville</label>
                <input
                    id="location-query"
                    className="input"
                    placeholder="Adresse, ville ou code postal"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="street-address"
                />
                <button className="btn-ghost" type="submit" aria-label="Rechercher l'adresse" disabled={search.isPending}>
                    <MagnifyingGlass size={18} aria-hidden />
                </button>
            </form>
            {search.error && <p className="text-sm text-tomato-700">{errorMessage(search.error)}</p>}
            {search.data && (
                <ul className="divide-y divide-ink-100 overflow-hidden rounded-[var(--radius-ui)] border border-ink-200 dark:divide-ink-800 dark:border-ink-700">
                    {search.data.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-500">Aucune adresse trouvée.</li>}
                    {search.data.map((point) => (
                        <li key={`${point.lat}-${point.lon}`}>
                            <button
                                type="button"
                                onClick={() => choose(point)}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-ink-50 dark:hover:bg-ink-800"
                            >
                                <MapPin size={16} className="shrink-0 text-ink-400" aria-hidden />
                                {point.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
