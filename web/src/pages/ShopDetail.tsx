import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package } from "lucide-react";
import { api, errorMessage } from "../lib/api.ts";
import { ProductCard } from "../components/Cards.tsx";
import { Reviews } from "../components/Reviews.tsx";
import { EmptyState, ErrorBox, Pagination, Spinner, Stars, Thumb } from "../components/ui.tsx";

export function ShopDetailPage() {
    const { id = "" } = useParams();
    const [page, setPage] = useState(1);

    const shop = useQuery({ queryKey: ["shop", id], queryFn: () => api.shops.get(id) });
    const products = useQuery({
        queryKey: ["shop-products", id, page],
        queryFn: () => api.shops.products(id, { page, limit: 12 }),
    });

    if (shop.isLoading) return <Spinner />;
    if (shop.error || !shop.data) return <ErrorBox>{errorMessage(shop.error) || "Boutique introuvable"}</ErrorBox>;

    const { data } = shop;

    return (
        <div className="space-y-12">
            <section className="card overflow-hidden">
                <Thumb src={data.imageUrl} alt={data.name} className="h-56 w-full sm:h-72" />
                <div className="flex flex-wrap items-start justify-between gap-6 p-6 sm:p-8">
                    <div className="max-w-2xl">
                        <h1 className="font-display text-3xl font-semibold">{data.name}</h1>
                        {data.description && <p className="mt-3 text-stone-600">{data.description}</p>}
                        {data.address && (
                            <p className="mt-4 inline-flex items-center gap-2 text-sm text-stone-600">
                                <MapPin className="size-4 text-brand-700" aria-hidden />
                                {data.address.streetAddress}, {data.address.postalCode} {data.address.addressLocality}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <Stars value={data.averageRating} count={data.reviewCount} size="md" />
                        {data.merchant && <p className="mt-2 text-sm text-stone-500">Tenue par {data.merchant.firstname}</p>}
                    </div>
                </div>
            </section>

            <section>
                <h2 className="mb-6 font-display text-2xl font-semibold">Produits</h2>
                {products.isLoading ? (
                    <Spinner />
                ) : products.data?.data.length ? (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                            {products.data.data.map((product) => <ProductCard key={product.id} product={product} />)}
                        </div>
                        <Pagination pagination={products.data.pagination} onChange={setPage} />
                    </>
                ) : (
                    <EmptyState icon={<Package className="size-10" />} title="Aucun produit en vente pour le moment" />
                )}
            </section>

            <Reviews target={{ shopId: id }} ownerId={data.merchantId} />
        </div>
    );
}
