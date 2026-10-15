import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice, type Shop } from "@marketsquare/shared";
import { Storefront } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { MY_SHOP_QUERY_KEY, useMyShop } from "../lib/myShop";
import { useStackNavigation } from "../hooks";
import { AddressFields, emptyAddress, type AddressValue } from "../components/AddressFields";
import { Button, ErrorText, Input, Loading, Rating, SuccessText } from "../components/ui";
import { colors, fonts, ui } from "../theme";

function Stats({ shop }: { shop: Shop }) {
    const { data } = useQuery({ queryKey: ["shop-orders", "stats"], queryFn: () => api.orders.shopOrders({ limit: 100 }) });
    const orders = data?.data ?? [];
    const active = orders.filter((o) => !["CANCELLED", "RETURNED"].includes(o.status));
    const revenue = active.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const toProcess = orders.filter((o) => ["PENDING", "PAID", "PREPARING"].includes(o.status)).length;

    const tiles = [
        { label: "Commandes", value: String(data?.pagination.total ?? 0) },
        { label: "À traiter", value: String(toProcess) },
        { label: "Chiffre d’affaires", value: formatPrice(revenue) },
        { label: "Produits en ligne", value: String(shop._count?.products ?? 0) },
    ];

    return (
        <View style={{ gap: 12 }}>
            <View style={[ui.row, { flexWrap: "wrap" }]}>
                <Text style={ui.title}>{shop.name}</Text>
                <Rating value={shop.averageRating} count={shop.reviewCount} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {tiles.map((tile) => (
                    <View key={tile.label} style={[ui.card, { width: "48%", flexGrow: 1, gap: 4 }]}>
                        <Text style={ui.muted}>{tile.label}</Text>
                        <Text style={{ fontSize: 22, fontFamily: fonts.semibold, color: colors.text }}>{tile.value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function ShopForm({ shop }: { shop?: Shop }) {
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();
    const [name, setName] = useState(shop?.name ?? "");
    const [description, setDescription] = useState(shop?.description ?? "");
    const [imageUrl, setImageUrl] = useState(shop?.imageUrl ?? "");
    const [address, setAddress] = useState<AddressValue>(
        shop?.address
            ? {
                  housingType: shop.address.housingType,
                  streetAddress: shop.address.streetAddress,
                  postalCode: shop.address.postalCode,
                  addressLocality: shop.address.addressLocality,
                  addressRegion: shop.address.addressRegion,
                  addressCountry: shop.address.addressCountry,
              }
            : { ...emptyAddress, housingType: "OFFICE" },
    );

    const mutation = useMutation({
        mutationFn: () => {
            const input = { name, description: description || null, imageUrl: imageUrl || null, address };
            return shop ? api.shops.update(shop.id, input) : api.shops.create(input);
        },
        onSuccess: (saved) => {
            queryClient.setQueryData(MY_SHOP_QUERY_KEY, saved);
            queryClient.invalidateQueries({ queryKey: ["shops"] });
            void refreshUser();
        },
    });

    return (
        <View style={[ui.card, { gap: 12 }]}>
            <Input label="Nom de la boutique" value={name} onChangeText={setName} />
            <Input label="Description" multiline maxLength={2000} value={description} onChangeText={setDescription} />
            <Input label="Image (URL)" autoCapitalize="none" keyboardType="url" value={imageUrl} onChangeText={setImageUrl} />
            <Text style={[ui.subtitle, { marginTop: 4 }]}>Adresse de retrait</Text>
            <AddressFields value={address} onChange={setAddress} showHousing={false} />
            <ErrorText message={mutation.error ? errorMessage(mutation.error) : null} />
            {mutation.isSuccess && shop && <SuccessText>Boutique mise à jour.</SuccessText>}
            <Button title={shop ? "Enregistrer" : "Créer ma boutique"} disabled={mutation.isPending || name.length < 2} onPress={() => mutation.mutate()} />
        </View>
    );
}

export function MerchantShopScreen() {
    const navigation = useStackNavigation();
    const { data: shop, isLoading } = useMyShop();

    if (isLoading) return <Loading />;

    return (
        <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={[ui.content, { gap: 18 }]} keyboardShouldPersistTaps="handled">
                {shop ? (
                    <>
                        <Stats shop={shop} />
                        <View style={[ui.row, { justifyContent: "space-between" }]}>
                            <Text style={[ui.title, { fontSize: 20 }]}>Informations</Text>
                            <Button title="Voir ma vitrine" variant="ghost" compact icon={<Storefront size={16} color={colors.text} />} onPress={() => navigation.navigate("Shop", { id: shop.id, name: shop.name })} />
                        </View>
                        <ShopForm shop={shop} />
                    </>
                ) : (
                    <>
                        <Text style={ui.title}>Ouvrez votre boutique</Text>
                        <Text style={ui.muted}>Présentez votre commerce : vos clients pourront ensuite commander en ligne.</Text>
                        <ShopForm />
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
