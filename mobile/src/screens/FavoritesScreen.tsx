import { RefreshControl, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "../components/icons";
import { api } from "../lib/api";
import { Empty, Loading } from "../components/ui";
import { ProductGrid } from "../components/ProductCard";
import { colors, ui } from "../theme";

export function FavoritesScreen() {
    const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["favorites"], queryFn: () => api.user.favorites() });

    if (isLoading) return <Loading />;

    return (
        <ScrollView style={ui.screen} contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.text} />}>
            {data?.length ? (
                <ProductGrid products={data.map((favorite) => favorite.product)} />
            ) : (
                <Empty icon={<Heart size={36} color={colors.text} />} title="Aucun favori">
                    Ajoutez des produits à vos favoris depuis leur fiche pour les retrouver ici.
                </Empty>
            )}
        </ScrollView>
    );
}
