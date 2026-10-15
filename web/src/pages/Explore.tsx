import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowSquareOut, ForkKnife, Globe, MagnifyingGlass, NavigationArrow, Phone, PersonSimpleWalk, Storefront, X } from "@phosphor-icons/react";
import {
    FOOD_CATEGORIES,
    PLACE_CATEGORY_LABELS,
    directionsUrl,
    formatDistance,
    formatOpeningHours,
    openingStatus,
    walkingMinutes,
    categoryCounts,
    fitsMeal,
    mealNeeds,
    nearbyEntries,
    type NearbyEntry,
    type PlaceCategory,
} from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { DEFAULT_CENTER, useGeo } from "../lib/geo.tsx";
import { MapView, type MapPoint } from "../components/MapView.tsx";
import { CategoryIcon } from "../components/categories.tsx";
import { LocationPicker } from "../components/LocationPicker.tsx";
import { ErrorBox, Skeleton, Stars } from "../components/ui.tsx";

type Entry = NearbyEntry;

const RADII = [500, 1000, 2000];

function MealPicker({ onPick }: { onPick: (id: string) => void }) {
    const [query, setQuery] = useState("");
    const [term, setTerm] = useState("");
    const { data, isFetching, error } = useQuery({
        queryKey: ["meals-search", term],
        queryFn: () => api.meals.search(term),
        enabled: term.length > 1,
        staleTime: 60 * 60 * 1000,
    });

    return (
        <div className="mt-3">
            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    setTerm(query.trim());
                }}
            >
                <input
                    className="input"
                    placeholder="Un repas à préparer : lasagne, curry…"
                    aria-label="Rechercher un repas"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button className="btn-ghost border border-ink-200 px-3 dark:border-ink-700" type="submit" aria-label="Chercher le repas">
                    <MagnifyingGlass size={16} aria-hidden />
                </button>
            </form>
            <div aria-live="polite">
                {term && isFetching && <p className="mt-2 text-sm text-ink-500">Recherche…</p>}
                {term && error && <div className="mt-2"><ErrorBox>{errorMessage(error)}</ErrorBox></div>}
                {term && !isFetching && data && (
                    data.length ? (
                        <ul className="mt-2 max-h-56 overflow-y-auto rounded-[var(--radius-ui)] border border-ink-200 dark:border-ink-700">
                            {data.slice(0, 8).map((meal) => (
                                <li key={meal.id}>
                                    <button
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-ink-900"
                                        onClick={() => {
                                            onPick(meal.id);
                                            setTerm("");
                                            setQuery("");
                                        }}
                                    >
                                        <img src={`${meal.thumbnail}/small`} alt="" className="size-8 rounded object-cover" />
                                        {meal.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-ink-500">Aucun repas trouvé.</p>
                    )
                )}
            </div>
        </div>
    );
}

function OpenBadge({ hours }: { hours: string | null | undefined }) {
    const status = openingStatus(hours);
    if (!status || status.isOpen === null) return null;
    return (
        <span className={status.isOpen ? "font-medium text-emerald-700 dark:text-emerald-400" : "text-ink-400"}>
            {status.isOpen ? "Ouvert" : "Fermé"}
        </span>
    );
}

function EntryRow({ entry, onSelect }: { entry: Entry; onSelect: () => void }) {
    const hours = entry.kind === "place" ? entry.place.openingHours : null;
    return (
        <li>
            <button
                onClick={onSelect}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-50 focus-visible:bg-ink-50 focus-visible:outline-none dark:hover:bg-ink-900 dark:focus-visible:bg-ink-900"
            >
                <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${
                        entry.kind === "partner" ? "bg-tomato-500 text-white" : "border border-ink-200 bg-white text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                    }`}
                >
                    <CategoryIcon category={entry.category} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink-900 dark:text-white">{entry.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-500 dark:text-ink-400">
                        <span>{entry.category ? PLACE_CATEGORY_LABELS[entry.category] : "Commerce"}</span>
                        <span className="num">{formatDistance(entry.distance)}</span>
                        <OpenBadge hours={hours} />
                        {entry.kind === "partner" && <span className="font-medium text-tomato-600 dark:text-tomato-400">Commande en ligne</span>}
                    </span>
                </span>
            </button>
        </li>
    );
}

function EntryDetail({ entry, origin, onBack }: { entry: Entry; origin: { lat: number; lon: number }; onBack: () => void }) {
    const place = entry.kind === "place" ? entry.place : null;
    const shop = entry.kind === "partner" ? entry.shop : null;
    const hours = place?.openingHours ?? null;
    const status = openingStatus(hours);
    const address = place?.address ?? (shop ? `${shop.address.streetAddress}, ${shop.address.postalCode} ${shop.address.addressLocality}` : null);

    return (
        <div className="p-4">
            <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white">
                <ArrowLeft size={16} aria-hidden /> Tous les commerces
            </button>

            <div className="flex items-start gap-3">
                <span className={`grid size-12 shrink-0 place-items-center rounded-full ${shop ? "bg-tomato-500 text-white" : "bg-ink-900 text-white dark:bg-white dark:text-ink-900"}`}>
                    <CategoryIcon category={entry.category} size={22} />
                </span>
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold leading-tight">{entry.name}</h2>
                    <p className="text-sm text-ink-500 dark:text-ink-400">{entry.category ? PLACE_CATEGORY_LABELS[entry.category] : "Commerce"}</p>
                </div>
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
                <PersonSimpleWalk size={18} aria-hidden />
                <span className="num">{formatDistance(entry.distance)}</span>
                <span>à pied, environ <span className="num">{walkingMinutes(entry.distance)}</span> min</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                {shop && (
                    <Link to={`/shops/${shop.id}`} className="btn-accent">
                        <Storefront size={17} aria-hidden /> Commander en ligne
                    </Link>
                )}
                <a className="btn-primary" href={directionsUrl(entry, origin)} target="_blank" rel="noreferrer">
                    <NavigationArrow size={17} aria-hidden /> Itinéraire
                </a>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
                {address && (
                    <div>
                        <dt className="text-ink-500 dark:text-ink-400">Adresse</dt>
                        <dd className="mt-0.5 text-ink-900 dark:text-white">{address}</dd>
                    </div>
                )}
                {hours && (
                    <div>
                        <dt className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                            Horaires
                            {status?.isOpen !== null && status && (
                                <span className={status.isOpen ? "text-emerald-700 dark:text-emerald-400" : ""}>
                                    {status.isOpen ? "ouvert maintenant" : "fermé maintenant"}
                                </span>
                            )}
                        </dt>
                        <dd className="mt-0.5 space-y-0.5 text-ink-900 dark:text-white">
                            {formatOpeningHours(hours).map((line) => <p key={line} className="num text-[13px]">{line}</p>)}
                        </dd>
                    </div>
                )}
                {place?.phone && (
                    <div>
                        <dt className="text-ink-500 dark:text-ink-400">Téléphone</dt>
                        <dd className="mt-0.5 flex items-center gap-2">
                            <Phone size={15} aria-hidden />
                            <a href={`tel:${place.phone}`} className="num hover:underline">{place.phone}</a>
                        </dd>
                    </div>
                )}
                {place?.website && /^https?:\/\//i.test(place.website) && (
                    <div>
                        <dt className="text-ink-500 dark:text-ink-400">Site web</dt>
                        <dd className="mt-0.5 flex items-center gap-2">
                            <Globe size={15} aria-hidden />
                            <a href={place.website} target="_blank" rel="noreferrer" className="truncate hover:underline">
                                {place.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                            </a>
                            <ArrowSquareOut size={13} aria-hidden />
                        </dd>
                    </div>
                )}
                {shop && (
                    <div>
                        <dt className="text-ink-500 dark:text-ink-400">Sur MarketSquare</dt>
                        <dd className="mt-1 flex items-center gap-3">
                            {shop.reviewCount > 0 && <Stars value={shop.averageRating} count={shop.reviewCount} />}
                            <span><span className="num">{shop._count?.products ?? 0}</span> produits, retrait ou livraison</span>
                        </dd>
                        {shop.description && <p className="mt-2 text-ink-700 dark:text-ink-300">{shop.description}</p>}
                    </div>
                )}
            </dl>

            {place && (
                <p className="mt-8 text-xs text-ink-400">
                    Données OpenStreetMap. <a className="underline" href={`https://www.openstreetmap.org/${place.id.replace("osm-", "").replace("-", "/")}`} target="_blank" rel="noreferrer">Voir ou corriger la fiche</a>
                </p>
            )}
        </div>
    );
}

export function ExplorePage() {
    const { position } = useGeo();
    const [category, setCategory] = useState<PlaceCategory | null>(null);
    const [partnersOnly, setPartnersOnly] = useState(false);
    const [radius, setRadius] = useState(1000);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [params, setParams] = useSearchParams();
    const mealId = params.get("repas");

    const { data: meal, isLoading: mealLoading, isError: mealError } = useQuery({
        queryKey: ["meal", mealId],
        queryFn: () => api.meals.get(mealId!),
        enabled: Boolean(mealId),
        staleTime: 60 * 60 * 1000,
    });

    const needs = useMemo(() => (meal ? mealNeeds(meal) : null), [meal]);

    const pickMeal = (id: string | null) => {
        const next = new URLSearchParams(params);
        if (id) next.set("repas", id);
        else next.delete("repas");
        setParams(next);
        setCategory(null);
        setSelectedId(null);
    };

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: ["nearby", position?.lat, position?.lon, radius],
        queryFn: () => api.places.nearby(position!.lat, position!.lon, { radius }),
        enabled: Boolean(position),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
    });

    const entries = useMemo(() => (data ? nearbyEntries(data, { category, partnersOnly, needs }) : []), [data, category, partnersOnly, needs]);
    const counts = useMemo(() => (data ? categoryCounts(data) : new Map<PlaceCategory, number>()), [data]);

    const selected = entries.find((entry) => entry.id === selectedId) ?? null;
    const points: MapPoint[] = entries.map((entry) => ({
        id: entry.id,
        lat: entry.lat,
        lon: entry.lon,
        name: entry.name,
        category: entry.category,
        partner: entry.kind === "partner",
    }));

    const center: [number, number] = selected
        ? [selected.lat, selected.lon]
        : position
          ? [position.lat, position.lon]
          : DEFAULT_CENTER;

    return (
        <div className="flex h-full flex-col-reverse lg:flex-row">
            <aside className="flex min-h-0 flex-1 flex-col border-ink-200 bg-white lg:w-[400px] lg:flex-none lg:border-r dark:border-ink-800 dark:bg-ink-950">
                {!position ? (
                    <div className="p-5">
                        <h1 className="text-xl font-semibold">Les commerces autour de vous</h1>
                        <p className="mt-1 mb-5 text-sm text-ink-500 dark:text-ink-400">
                            Boulangeries, primeurs, fromagers, marchés : vrais commerces, vraies adresses, horaires à jour.
                        </p>
                        <LocationPicker />
                    </div>
                ) : selected ? (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <EntryDetail entry={selected} origin={position} onBack={() => setSelectedId(null)} />
                    </div>
                ) : (
                    <>
                        <div className="border-b border-ink-200 px-4 pt-4 pb-3 dark:border-ink-800">
                            <div className="flex items-baseline justify-between gap-2">
                                <h1 className="text-lg font-semibold">Autour de vous</h1>
                                <label className="flex items-center gap-1.5 text-sm text-ink-500">
                                    <span className="sr-only">Rayon</span>
                                    <select className="rounded-md bg-transparent py-0.5 text-sm font-medium text-ink-800 dark:text-ink-100" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                                        {RADII.map((r) => <option key={r} value={r}>{formatDistance(r)}</option>)}
                                    </select>
                                </label>
                            </div>
                            {meal ? (
                                <div className="mt-3 rounded-[var(--radius-ui)] bg-tomato-50 p-3 text-sm dark:bg-ink-900">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-2 font-medium text-ink-900 dark:text-white">
                                            <ForkKnife size={16} aria-hidden /> Pour {meal.name}
                                        </span>
                                        <button onClick={() => pickMeal(null)} className="text-ink-500 hover:text-ink-900 dark:hover:text-white" aria-label="Retirer le repas">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <ul className="mt-2 space-y-1 text-[13px] text-ink-600 dark:text-ink-300">
                                        {[...(needs ?? [])].map(([c, names]) => (
                                            <li key={c}>
                                                <span className="font-medium text-ink-800 dark:text-ink-100">{PLACE_CATEGORY_LABELS[c]}</span> : {names.join(", ")}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : mealId && mealLoading ? (
                                <Skeleton className="mt-3 h-20 rounded-[var(--radius-ui)]" />
                            ) : mealId && mealError ? (
                                <div className="mt-3 flex items-center justify-between gap-2 text-sm text-ink-500">
                                    Ce repas est introuvable.
                                    <button onClick={() => pickMeal(null)} className="font-medium text-ink-900 hover:underline dark:text-white">Retirer</button>
                                </div>
                            ) : (
                                <MealPicker onPick={pickMeal} />
                            )}
                            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                                <button className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>Tout</button>
                                {FOOD_CATEGORIES.filter((c) => counts.get(c) && fitsMeal(c, needs)).map((c) => (
                                    <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)}>
                                        <CategoryIcon category={c} size={15} />
                                        {PLACE_CATEGORY_LABELS[c]}
                                    </button>
                                ))}
                            </div>
                            <label className="mt-3 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                                <input type="checkbox" className="size-4 accent-tomato-500" checked={partnersOnly} onChange={(e) => setPartnersOnly(e.target.checked)} />
                                Seulement les commerces qui livrent ou font le retrait
                            </label>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={isFetching}>
                            {error && <div className="p-4"><ErrorBox>{errorMessage(error)}</ErrorBox></div>}
                            {isLoading ? (
                                <div className="space-y-4 p-4">
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="size-10 rounded-full" />
                                            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
                                        </div>
                                    ))}
                                </div>
                            ) : entries.length === 0 ? (
                                <p className="p-5 text-sm text-ink-500">Aucun commerce dans ce rayon. Élargissez la zone.</p>
                            ) : (
                                <ul className="divide-y divide-ink-100 dark:divide-ink-900">
                                    {entries.map((entry) => <EntryRow key={entry.id} entry={entry} onSelect={() => setSelectedId(entry.id)} />)}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </aside>

            <div className="relative h-[42dvh] shrink-0 lg:h-auto lg:flex-1">
                <MapView
                    center={center}
                    zoom={selected ? 17 : radius > 1000 ? 14 : 15}
                    user={position ? [position.lat, position.lon] : null}
                    points={points}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    className="h-full w-full"
                />
                {position && data && (
                    <p className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full bg-white/90 px-3 py-1 text-xs text-ink-600 shadow-sm dark:bg-ink-900/90 dark:text-ink-300">
                        <span className="num">{entries.length}</span> commerces, dont <span className="num">{entries.filter((entry) => entry.kind === "partner").length}</span> sur MarketSquare
                    </p>
                )}
            </div>
        </div>
    );
}
