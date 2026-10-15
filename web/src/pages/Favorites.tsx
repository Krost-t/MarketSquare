import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { api } from "../lib/api.ts";
import { ProductCard } from "../components/Cards.tsx";
import { EmptyState, PageHeader, Spinner } from "../components/ui.tsx";

export function FavoritesPage() {
    const { data, isLoading } = useQuery({ queryKey: ["favorites"], queryFn: () => api.user.favorites() });

    return (
        <>
            <PageHeader title="Mes favoris" />
            {isLoading ? (
                <Spinner />
            ) : data?.length ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                    {data.map((favorite) => <ProductCard key={favorite.id} product={favorite.product} />)}
                </div>
            ) : (
                <EmptyState icon={<Heart className="size-10" />} title="Aucun favori">
                    Ajoutez des produits à vos favoris depuis leur fiche pour les retrouver ici.
                </EmptyState>
            )}
        </>
    );
}
