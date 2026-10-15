import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { useGeo } from "../lib/geo.tsx";
import { LocationPicker } from "../components/LocationPicker.tsx";
import { api, errorMessage } from "../lib/api.ts";
import { ShopCard } from "../components/Cards.tsx";
import { EmptyState, ErrorBox, PageHeader, Pagination, Skeleton, Spinner } from "../components/ui.tsx";

const NEARBY_RADIUS = 2000;

function NearbyShops() {
    const { position } = useGeo();
    const { data, isLoading, error } = useQuery({
        queryKey: ["nearby-partners", position?.lat, position?.lon, NEARBY_RADIUS],
        queryFn: () => api.places.nearby(position!.lat, position!.lon, { radius: NEARBY_RADIUS, partnersOnly: true }),
        enabled: Boolean(position),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <section className="mb-12">
            <h2 className="text-xl font-semibold">Boutiques aux alentours</h2>
            <p className="mt-1 mb-5 text-sm text-ink-500 dark:text-ink-400">
                {position ? `À moins de 2 km de ${position.label}.` : "Indiquez votre position pour voir les boutiques les plus proches."}
            </p>
            {!position ? (
                <div className="card max-w-md p-4"><LocationPicker compact /></div>
            ) : error ? (
                <ErrorBox>{errorMessage(error)}</ErrorBox>
            ) : isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-[var(--radius-panel)]" />)}
                </div>
            ) : data?.partners.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.partners.map((shop) => <ShopCard key={shop.id} shop={shop} distance={shop.distance} />)}
                </div>
            ) : (
                <p className="text-sm text-ink-500">Aucune boutique MarketSquare dans ce rayon pour l’instant.</p>
            )}
        </section>
    );
}

export function ShopsPage() {
    const [params, setParams] = useSearchParams();
    const search = params.get("search") ?? "";
    const postalCode = params.get("postalCode") ?? "";
    const page = Number(params.get("page") ?? 1);

    const [form, setForm] = useState({ search, postalCode });

    const { data, isLoading, error } = useQuery({
        queryKey: ["shops", { search, postalCode, page }],
        queryFn: () => api.shops.list({ search, postalCode, page, limit: 12 }),
        placeholderData: keepPreviousData,
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const next = new URLSearchParams();
        if (form.search) next.set("search", form.search);
        if (form.postalCode) next.set("postalCode", form.postalCode);
        setParams(next);
    };

    const goToPage = (p: number) => {
        const next = new URLSearchParams(params);
        next.set("page", String(p));
        setParams(next);
    };

    return (
        <>
            <PageHeader title="Boutiques" subtitle="Les commerces de proximité présents sur MarketSquare." />

            <NearbyShops />

            <h2 className="mb-4 text-xl font-semibold">Toutes les boutiques</h2>
            <form onSubmit={onSubmit} className="card mb-8 grid gap-3 p-4 sm:grid-cols-[1fr_200px_auto]">
                <input
                    className="input"
                    placeholder="Nom de la boutique…"
                    aria-label="Rechercher une boutique"
                    value={form.search}
                    onChange={(e) => setForm({ ...form, search: e.target.value })}
                />
                <input
                    className="input"
                    placeholder="Code postal"
                    aria-label="Code postal"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
                <button className="btn-primary" type="submit">Rechercher</button>
            </form>

            {error && <ErrorBox>{errorMessage(error)}</ErrorBox>}
            {isLoading ? (
                <Spinner />
            ) : data?.data.length ? (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {data.data.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
                    </div>
                    <Pagination pagination={data.pagination} onChange={goToPage} />
                </>
            ) : (
                <EmptyState icon={<Store className="size-10" />} title="Aucune boutique trouvée">
                    Essayez un autre code postal ou élargissez votre recherche.
                </EmptyState>
            )}
        </>
    );
}
