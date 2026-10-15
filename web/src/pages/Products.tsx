import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import type { ProductSort } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { ProductCard } from "../components/Cards.tsx";
import { EmptyState, ErrorBox, PageHeader, Pagination, Spinner } from "../components/ui.tsx";

const SORTS: { value: ProductSort; label: string }[] = [
    { value: "newest", label: "Nouveautés" },
    { value: "price_asc", label: "Prix croissant" },
    { value: "price_desc", label: "Prix décroissant" },
    { value: "rating", label: "Mieux notés" },
];

export function ProductsPage() {
    const [params, setParams] = useSearchParams();
    const filters = {
        search: params.get("search") ?? "",
        minPrice: params.get("minPrice") ?? "",
        maxPrice: params.get("maxPrice") ?? "",
        sort: (params.get("sort") as ProductSort | null) ?? "newest",
        inStock: params.get("inStock") === "true",
        page: Number(params.get("page") ?? 1),
    };
    const [form, setForm] = useState(filters);

    const { data, isLoading, error } = useQuery({
        queryKey: ["products", filters],
        queryFn: () =>
            api.products.list({
                search: filters.search || undefined,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                inStock: filters.inStock || undefined,
                sort: filters.sort,
                page: filters.page,
                limit: 16,
            }),
        placeholderData: keepPreviousData,
    });

    const apply = (next: typeof form) => {
        const search = new URLSearchParams();
        if (next.search) search.set("search", next.search);
        if (next.minPrice) search.set("minPrice", next.minPrice);
        if (next.maxPrice) search.set("maxPrice", next.maxPrice);
        if (next.sort !== "newest") search.set("sort", next.sort);
        if (next.inStock) search.set("inStock", "true");
        if (next.page > 1) search.set("page", String(next.page));
        setParams(search);
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        apply({ ...form, page: 1 });
    };

    return (
        <>
            <PageHeader title="Produits" subtitle="Tout ce que proposent les commerçants de MarketSquare." />

            <form onSubmit={onSubmit} className="card mb-8 grid gap-3 p-4 md:grid-cols-[1fr_110px_110px_170px_auto]">
                <input className="input" placeholder="Rechercher un produit…" aria-label="Recherche"
                    value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
                <input className="input" type="number" min={0} step="0.01" placeholder="Prix min" aria-label="Prix minimum"
                    value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} />
                <input className="input" type="number" min={0} step="0.01" placeholder="Prix max" aria-label="Prix maximum"
                    value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} />
                <select className="input" aria-label="Trier par" value={form.sort}
                    onChange={(e) => {
                        const next = { ...form, sort: e.target.value as ProductSort, page: 1 };
                        setForm(next);
                        apply(next);
                    }}>
                    {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
                </select>
                <button className="btn-primary" type="submit">Filtrer</button>
                <label className="flex items-center gap-2 text-sm text-stone-700 md:col-span-5">
                    <input type="checkbox" className="size-4 accent-brand-700" checked={form.inStock}
                        onChange={(e) => {
                            const next = { ...form, inStock: e.target.checked, page: 1 };
                            setForm(next);
                            apply(next);
                        }} />
                    Uniquement les produits disponibles
                </label>
            </form>

            {error && <ErrorBox>{errorMessage(error)}</ErrorBox>}
            {isLoading ? (
                <Spinner />
            ) : data?.data.length ? (
                <>
                    <p className="mb-4 text-sm text-stone-500">{data.pagination.total} produit(s)</p>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                        {data.data.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                    <Pagination pagination={data.pagination} onChange={(page) => apply({ ...filters, page })} />
                </>
            ) : (
                <EmptyState icon={<Package className="size-10" />} title="Aucun produit ne correspond">
                    Modifiez vos filtres pour élargir la recherche.
                </EmptyState>
            )}
        </>
    );
}
