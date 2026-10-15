import { useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import { useGeo } from "../lib/geo";
import { useStackNavigation } from "../hooks";
import { Package } from "../components/icons";
import { Button, Empty, ErrorText, Loading } from "../components/ui";
import { ShopCard } from "../components/ShopCard";
import { LocationPicker } from "../components/LocationPicker";
import { colors, ui } from "../theme";

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
        <View style={{ gap: 12 }}>
            <View style={{ gap: 2 }}>
                <Text style={ui.title}>Boutiques aux alentours</Text>
                <Text style={ui.muted}>
                    {position ? `À moins de 2 km de ${position.label}.` : "Indiquez votre position pour voir les boutiques les plus proches."}
                </Text>
            </View>
            {!position ? (
                <View style={ui.card}><LocationPicker /></View>
            ) : error ? (
                <ErrorText message={errorMessage(error)} />
            ) : isLoading ? (
                <Loading />
            ) : data?.partners.length ? (
                data.partners.map((shop) => <ShopCard key={shop.id} shop={shop} distance={shop.distance} />)
            ) : (
                <Text style={ui.muted}>Aucune boutique MarketSquare dans ce rayon pour l’instant.</Text>
            )}
        </View>
    );
}

export function ShopsScreen() {
    const navigation = useStackNavigation();
    const [postalCode, setPostalCode] = useState("");
    const [filter, setFilter] = useState("");

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["shops", filter],
        queryFn: () => api.shops.list({ postalCode: filter || undefined, limit: 50 }),
    });

    return (
        <View style={ui.screen}>
            <FlatList
                data={data?.data ?? []}
                keyExtractor={(shop) => shop.id}
                contentContainerStyle={ui.content}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
                ListHeaderComponent={
                    <View style={{ gap: 12 }}>
                        <NearbyShops />
                        <View style={[ui.row, { justifyContent: "space-between", marginTop: 12 }]}>
                            <Text style={ui.title}>Toutes les boutiques</Text>
                            <Button title="Produits" variant="ghost" compact icon={<Package size={16} color={colors.text} />} onPress={() => navigation.navigate("Products")} />
                        </View>
                        <View style={ui.row}>
                            <TextInput
                                style={[ui.input, { flex: 1 }]}
                                placeholder="Code postal"
                                placeholderTextColor={colors.muted}
                                keyboardType="number-pad"
                                accessibilityLabel="Code postal"
                                value={postalCode}
                                onChangeText={setPostalCode}
                                onSubmitEditing={() => setFilter(postalCode)}
                                returnKeyType="search"
                            />
                            <Button title="Chercher" onPress={() => setFilter(postalCode)} />
                        </View>
                        <ErrorText message={error ? errorMessage(error) : null} />
                        {isLoading && <Loading />}
                    </View>
                }
                ListEmptyComponent={isLoading ? null : <Empty title="Aucune boutique trouvée" />}
                renderItem={({ item: shop }) => <ShopCard shop={shop} />}
            />
        </View>
    );
}
