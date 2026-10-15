import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PLACE_CATEGORY_LABELS, directionsUrl, formatDistance, formatPrice, openingStatus, type PlaceCategory, type ShoppingItem } from "@marketsquare/shared";
import { Check, ForkKnife, ListChecks, NavigationArrow, Plus, Trash } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useGeo } from "../lib/geo";
import { useCartMutation } from "../lib/cart";
import { useStackNavigation } from "../hooks";
import { Button, Empty, ErrorText, LinkText, Loading, PageTitle, Thumb } from "../components/ui";
import { CategoryIcon } from "../components/ShopCard";
import { LocationPicker } from "../components/LocationPicker";
import { LoginPrompt } from "../components/LoginPrompt";
import { MiniMap, type MapPoint } from "../components/MiniMap";
import { colors, fonts, radius, ui } from "../theme";

const LIST_KEY = ["shopping-list"];
const ORDER: PlaceCategory[] = ["greengrocer", "bakery", "butcher", "seafood", "cheese", "grocery", "wine"];

function ItemRow({ item }: { item: ShoppingItem }) {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: LIST_KEY });
    const toggle = useMutation({ mutationFn: () => api.shoppingList.update(item.id, { checked: !item.checked }), onSuccess: invalidate });
    const remove = useMutation({ mutationFn: () => api.shoppingList.remove(item.id), onSuccess: invalidate });

    return (
        <View style={[ui.row, { paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderColor: colors.borderSoft }]}>
            <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.checked }}
                accessibilityLabel={item.label}
                onPress={() => toggle.mutate()}
                hitSlop={8}
                style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: item.checked ? colors.text : colors.faint,
                    backgroundColor: item.checked ? colors.text : colors.card,
                }}
            >
                {item.checked && <Check size={14} color="#fff" weight="bold" />}
            </Pressable>
            <Text style={[ui.body, { flex: 1 }, item.checked && { color: colors.faint, textDecorationLine: "line-through" }]}>
                {item.label}
            </Text>
            {item.source === "meal" && <ForkKnife size={13} color={colors.faint} />}
            {item.quantity ? <Text style={[ui.muted, { fontSize: 12, maxWidth: 110 }]} numberOfLines={1}>{item.quantity}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer ${item.label}`} onPress={() => remove.mutate()} hitSlop={8}>
                <Trash size={18} color={colors.faint} />
            </Pressable>
        </View>
    );
}

function Plan({ items }: { items: ShoppingItem[] }) {
    const { position } = useGeo();
    const { user } = useAuth();
    const navigation = useStackNavigation();
    const [added, setAdded] = useState<string | null>(null);
    const pending = items.filter((item) => !item.checked);
    const signature = pending.map((item) => item.id).join(",");

    const { data: plan, isLoading, error } = useQuery({
        queryKey: ["shopping-plan", signature, position?.lat, position?.lon],
        queryFn: () => api.shoppingList.plan(position!.lat, position!.lon),
        enabled: Boolean(position && pending.length),
        staleTime: 5 * 60 * 1000,
    });

    const addToCart = useCartMutation((productId: string) => api.cart.add(productId, 1));

    const points = useMemo<MapPoint[]>(() => {
        if (!plan) return [];
        const result = new Map<string, MapPoint>();
        plan.groups.forEach((group) => {
            const best = group.places[0];
            if (best) result.set(best.id, { id: best.id, lat: best.lat, lon: best.lon, name: best.name, category: best.category });
        });
        const partnerIds = new Set(plan.groups.flatMap((group) => group.partnerProducts.map((match) => match.shop.id)));
        plan.partners
            .filter((shop) => partnerIds.has(shop.id))
            .forEach((shop) => result.set(shop.id, { id: shop.id, lat: shop.lat, lon: shop.lon, name: shop.name, category: shop.category, partner: true }));
        return [...result.values()];
    }, [plan]);

    if (!position) {
        return (
            <View style={[ui.card, { gap: 10 }]}>
                <Text style={ui.subtitle}>Où faire vos courses ?</Text>
                <Text style={ui.muted}>Indiquez votre position pour trouver les commerces les plus proches pour chaque article.</Text>
                <LocationPicker />
            </View>
        );
    }
    if (pending.length === 0) {
        return <Empty title="Rien à acheter">Ajoutez des articles ou planifiez vos repas : nous vous dirons où les trouver.</Empty>;
    }

    return (
        <View style={{ gap: 18 }}>
            <MiniMap center={position} points={points} />
            <ErrorText message={error ? errorMessage(error) : addToCart.error ? errorMessage(addToCart.error) : null} />
            {isLoading && <Loading />}

            {plan?.groups.map((group) => {
                const [best, ...others] = group.places;
                const status = openingStatus(best?.openingHours);
                return (
                    <View key={group.category} style={{ gap: 10, paddingTop: 16, borderTopWidth: 1, borderColor: colors.border }}>
                        <View style={[ui.row, { alignItems: "flex-start" }]}>
                            <CategoryIcon category={group.category} size={20} color={colors.accentDark} />
                            <Text style={[ui.muted, { flex: 1 }]}>
                                <Text style={ui.subtitle}>{PLACE_CATEGORY_LABELS[group.category]}  </Text>
                                {group.items.map((item) => item.label).join(", ")}
                            </Text>
                        </View>

                        {best ? (
                            <View style={[ui.row, { backgroundColor: colors.borderSoft, borderRadius: radius.ui, padding: 12, gap: 12 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: fonts.medium, color: colors.text }}>{best.name}</Text>
                                    <Text style={ui.muted}>
                                        {formatDistance(best.distance)}
                                        {status?.isOpen === true && <Text style={{ color: colors.success }}> ouvert</Text>}
                                        {status?.isOpen === false && " fermé maintenant"}
                                        {best.address ? ` ${best.address}` : ""}
                                    </Text>
                                </View>
                                <Button title="Y aller" variant="ghost" compact icon={<NavigationArrow size={16} color={colors.text} />} onPress={() => void Linking.openURL(directionsUrl(best, position))} />
                            </View>
                        ) : (
                            <Text style={ui.muted}>Pas de commerce de ce type à proximité.</Text>
                        )}
                        {others.length > 0 && (
                            <Text style={ui.muted}>Aussi : {others.map((place) => `${place.name} (${formatDistance(place.distance)})`).join(", ")}</Text>
                        )}

                        {group.partnerProducts.length > 0 && (
                            <View style={{ gap: 8 }}>
                                <Text style={{ fontFamily: fonts.medium, color: colors.text }}>À commander en ligne</Text>
                                {group.partnerProducts.map((match) => (
                                    <View key={`${match.itemId}-${match.product.id}`} style={[ui.row, { borderWidth: 1, borderColor: colors.border, borderRadius: radius.ui, padding: 8, gap: 10 }]}>
                                        <Thumb uri={match.product.imageUrl} size={48} contain />
                                        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate("Product", { id: match.product.id, name: match.product.name })}>
                                            <Text style={{ fontFamily: fonts.medium, color: colors.text }} numberOfLines={1}>{match.product.name}</Text>
                                            <Text style={[ui.muted, { fontSize: 12 }]} numberOfLines={1}>{match.shop.name}, {formatDistance(match.shop.distance)}</Text>
                                        </Pressable>
                                        <Text style={[ui.price, { fontSize: 14 }]}>{formatPrice(match.product.price)}</Text>
                                        {user && (
                                            <Button
                                                variant="ghost"
                                                compact
                                                disabled={addToCart.isPending}
                                                icon={added === match.product.id ? <Check size={16} color={colors.text} weight="bold" /> : <Plus size={16} color={colors.text} />}
                                                onPress={() => addToCart.mutate(match.product.id, { onSuccess: () => setAdded(match.product.id) })}
                                            />
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

export function ShoppingListScreen() {
    const { user } = useAuth();
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const [label, setLabel] = useState("");
    const [quantity, setQuantity] = useState("");

    const { data: items, isLoading } = useQuery({ queryKey: LIST_KEY, queryFn: () => api.shoppingList.list(), enabled: Boolean(user) });

    const add = useMutation({
        mutationFn: () => api.shoppingList.add([{ label: label.trim(), quantity: quantity.trim() || null }]),
        onSuccess: (list) => {
            queryClient.setQueryData(LIST_KEY, list);
            setLabel("");
            setQuantity("");
        },
    });
    const clearChecked = useMutation({
        mutationFn: () => api.shoppingList.clearChecked(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
    });

    const grouped = useMemo(() => {
        const groups = new Map<PlaceCategory, ShoppingItem[]>();
        (items ?? []).forEach((item) => groups.set(item.category, [...(groups.get(item.category) ?? []), item]));
        return [...groups.entries()].sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b));
    }, [items]);

    if (!user) {
        return (
            <LoginPrompt
                icon={<ListChecks size={36} color={colors.text} />}
                title="Votre liste de courses"
                text="Connectez-vous pour garder votre liste et savoir où acheter chaque article autour de vous."
            />
        );
    }

    const checkedCount = items?.filter((item) => item.checked).length ?? 0;
    const submit = () => label.trim() && add.mutate();

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 16 }]} keyboardShouldPersistTaps="handled">
            <PageTitle
                title="Ma liste"
                action={<LinkText color={colors.muted} onPress={() => navigation.navigate("Tabs", { screen: "Meals" })}>Depuis mes repas</LinkText>}
            />

            <View style={ui.row}>
                <TextInput style={[ui.input, { flex: 1 }]} placeholder="Ex. tomates, pain, comté" placeholderTextColor={colors.faint} accessibilityLabel="Article"
                    value={label} onChangeText={setLabel} maxLength={120} onSubmitEditing={submit} returnKeyType="done" />
                <TextInput style={[ui.input, { width: 72 }]} placeholder="Qté" placeholderTextColor={colors.faint} accessibilityLabel="Quantité"
                    value={quantity} onChangeText={setQuantity} maxLength={60} onSubmitEditing={submit} />
                <Button icon={<Plus size={18} color="#fff" weight="bold" />} disabled={add.isPending || !label.trim()} onPress={submit} />
            </View>
            <ErrorText message={add.error ? errorMessage(add.error) : null} />

            {isLoading && <Loading />}
            {items?.length === 0 && <Text style={ui.muted}>Votre liste est vide.</Text>}
            {grouped.map(([category, groupItems]) => (
                <View key={category}>
                    <View style={[ui.row, { gap: 6 }]}>
                        <CategoryIcon category={category} size={14} color={colors.muted} />
                        <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>
                            {PLACE_CATEGORY_LABELS[category]}
                        </Text>
                    </View>
                    {groupItems.map((item) => <ItemRow key={item.id} item={item} />)}
                </View>
            ))}
            {checkedCount > 0 && (
                <LinkText color={colors.muted} onPress={() => clearChecked.mutate()}>Retirer les {checkedCount} articles cochés</LinkText>
            )}

            <Text style={[ui.title, { marginTop: 12 }]}>Où acheter</Text>
            <Plan items={items ?? []} />
        </ScrollView>
    );
}
