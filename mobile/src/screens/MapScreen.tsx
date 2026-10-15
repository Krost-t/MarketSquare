import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ForkKnife, Globe, MapPin, Phone, X } from "../components/icons";
import { FlatList, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    FOOD_CATEGORIES,
    PLACE_CATEGORY_LABELS,
    categoryCounts,
    directionsUrl,
    fitsMeal,
    formatDistance,
    formatOpeningHours,
    mealNeeds,
    nearbyEntries,
    openingStatus,
    walkingMinutes,
    type NearbyEntry,
    type PlaceCategory,
} from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api";
import { useGeo, type Position } from "../lib/geo";
import { useStackNavigation } from "../hooks";
import { Button, ErrorText, Loading } from "../components/ui";
import { LocationPicker } from "../components/LocationPicker";
import { CategoryIcon, categoryLabel } from "../components/ShopCard";
import { colors, ui, fonts } from "../theme";

const RADII = [500, 1000, 2000];
const MAX_MARKERS = 150;

function Chip({ label, active, onPress, category }: { label: string; active: boolean; onPress: () => void; category?: PlaceCategory }) {
    return (
        <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
            {category && <CategoryIcon category={category} size={15} color={active ? "#fff" : colors.text} />}
            <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
        </Pressable>
    );
}

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
        <View style={{ gap: 8 }}>
            <TextInput
                style={ui.input}
                placeholder="Un repas à préparer : lasagne, curry…"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Rechercher un repas"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => setTerm(query.trim())}
                returnKeyType="search"
            />
            {term.length > 1 && isFetching && <Text style={ui.muted}>Recherche…</Text>}
            <ErrorText message={error ? errorMessage(error) : null} />
            {term.length > 1 && !isFetching && data?.length === 0 && <Text style={ui.muted}>Aucun repas trouvé.</Text>}
            {term.length > 1 && !isFetching && data?.slice(0, 6).map((meal) => (
                <Pressable
                    key={meal.id}
                    accessibilityRole="button"
                    style={[ui.row, { paddingVertical: 4 }]}
                    onPress={() => {
                        onPick(meal.id);
                        setTerm("");
                        setQuery("");
                    }}
                >
                    <Image source={{ uri: `${meal.thumbnail}/small` }} style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <Text style={[ui.body, { flex: 1 }]}>{meal.name}</Text>
                </Pressable>
            ))}
        </View>
    );
}

function EntryDetail({ entry, origin, onBack }: { entry: NearbyEntry; origin: Position; onBack: () => void }) {
    const navigation = useStackNavigation();
    const place = entry.kind === "place" ? entry.place : null;
    const shop = entry.kind === "partner" ? entry.shop : null;
    const status = openingStatus(place?.openingHours);
    const address = place?.address ?? (shop ? `${shop.address.streetAddress}, ${shop.address.postalCode} ${shop.address.addressLocality}` : null);

    return (
        <ScrollView contentContainerStyle={ui.content}>
            <Pressable accessibilityRole="button" onPress={onBack}>
                <View style={ui.row}>
                    <ArrowLeft size={16} color={colors.muted} />
                    <Text style={ui.muted}>Tous les commerces</Text>
                </View>
            </Pressable>
            <View style={[ui.row, { gap: 12 }]}>
                <View style={[styles.badge, { width: 48, height: 48, borderRadius: 24, borderWidth: 0, backgroundColor: shop ? colors.accent : colors.text }]}>
                    <CategoryIcon category={entry.category} size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={ui.title}>{entry.name}</Text>
                    <Text style={ui.muted}>{categoryLabel(entry.category)}</Text>
                </View>
            </View>
            <Text style={ui.body}>{formatDistance(entry.distance)} à pied, environ {walkingMinutes(entry.distance)} min</Text>
            {status && status.isOpen !== null && (
                <Text style={{ color: status.isOpen ? colors.success : colors.muted, fontFamily: fonts.semibold }}>{status.isOpen ? "Ouvert maintenant" : "Fermé maintenant"}</Text>
            )}
            {shop && <Button title="Commander en ligne" variant="accent" onPress={() => navigation.navigate("Shop", { id: shop.id, name: shop.name })} />}
            <Button title="Itinéraire" onPress={() => void Linking.openURL(directionsUrl(entry, origin))} />
            {address && <Text style={ui.body}>{address}</Text>}
            {place?.openingHours && formatOpeningHours(place.openingHours).map((line) => <Text key={line} style={ui.muted}>{line}</Text>)}
            {place?.phone && (
                <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`tel:${place.phone}`)}>
                    <View style={ui.row}>
                        <Phone size={16} color={colors.text} />
                        <Text style={ui.body}>{place.phone}</Text>
                    </View>
                </Pressable>
            )}
            {place?.website && /^https?:\/\//i.test(place.website) && (
                <Pressable accessibilityRole="link" style={ui.row} onPress={() => void Linking.openURL(place.website!)}>
                    <Globe size={16} color={colors.text} />
                    <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{place.website.replace(/^https?:\/\/(www\.)?/, "")}</Text>
                </Pressable>
            )}
            {shop?.description ? <Text style={ui.muted}>{shop.description}</Text> : null}
        </ScrollView>
    );
}

export function MapScreen() {
    const { position } = useGeo();
    const mapRef = useRef<MapView>(null);
    const [radius, setRadius] = useState(1000);
    const [category, setCategory] = useState<PlaceCategory | null>(null);
    const [mealId, setMealId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [changingPosition, setChangingPosition] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["nearby", position?.lat, position?.lon, radius],
        queryFn: () => api.places.nearby(position!.lat, position!.lon, { radius }),
        enabled: Boolean(position),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
    });

    const meal = useQuery({
        queryKey: ["meal", mealId],
        queryFn: () => api.meals.get(mealId!),
        enabled: Boolean(mealId),
        staleTime: 60 * 60 * 1000,
    });

    const needs = useMemo(() => (meal.data ? mealNeeds(meal.data) : null), [meal.data]);
    const entries = useMemo(() => (data ? nearbyEntries(data, { category, needs }) : []), [data, category, needs]);
    const counts = useMemo(() => (data ? categoryCounts(data) : new Map<PlaceCategory, number>()), [data]);
    const selected = entries.find((entry) => entry.id === selectedId) ?? null;

    useEffect(() => {
        const target = selected ?? position;
        if (!target) return;
        const delta = selected ? 0.006 : radius / 50000;
        mapRef.current?.animateToRegion({ latitude: target.lat, longitude: target.lon, latitudeDelta: delta, longitudeDelta: delta }, 400);
    }, [selected?.id, position?.lat, position?.lon, radius]);

    const pickMeal = (id: string | null) => {
        setMealId(id);
        setCategory(null);
        setSelectedId(null);
    };

    if (!position || changingPosition) {
        return (
            <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
                <Text style={ui.title}>Les commerces autour de vous</Text>
                <Text style={ui.muted}>Boulangeries, primeurs, fromagers, marchés : vrais commerces, vraies adresses, horaires à jour.</Text>
                <LocationPicker onDone={() => setChangingPosition(false)} />
                {position && <Button title="Annuler" variant="ghost" onPress={() => setChangingPosition(false)} />}
            </ScrollView>
        );
    }

    const header = (
        <View style={{ gap: 10 }}>
            <View style={[ui.row, { justifyContent: "space-between" }]}>
                <MapPin size={16} color={colors.muted} />
                <Text style={[ui.muted, { flex: 1 }]} numberOfLines={1}>{position.label}</Text>
                <Pressable accessibilityRole="button" onPress={() => setChangingPosition(true)}>
                    <Text style={{ color: colors.accent, fontFamily: fonts.semibold }}>Changer</Text>
                </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {RADII.map((r) => <Chip key={r} label={formatDistance(r)} active={radius === r} onPress={() => setRadius(r)} />)}
            </ScrollView>
            {meal.data && needs ? (
                <View style={[ui.card, { backgroundColor: colors.brandLight, borderColor: colors.brandLight, gap: 4 }]}>
                    <View style={[ui.row, { justifyContent: "space-between" }]}>
                        <ForkKnife size={18} color={colors.text} />
                        <Text style={[ui.subtitle, { flex: 1 }]}>Pour {meal.data.name}</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Retirer le repas" onPress={() => pickMeal(null)}>
                            <X size={18} color={colors.muted} />
                        </Pressable>
                    </View>
                    {[...needs].map(([c, names]) => (
                        <Text key={c} style={ui.muted}>
                            <Text style={{ fontFamily: fonts.semibold, color: colors.text }}>{PLACE_CATEGORY_LABELS[c]}</Text> : {names.join(", ")}
                        </Text>
                    ))}
                </View>
            ) : mealId && meal.isLoading ? (
                <Loading />
            ) : mealId && meal.isError ? (
                <View style={[ui.row, { justifyContent: "space-between" }]}>
                    <Text style={ui.muted}>Ce repas est introuvable.</Text>
                    <Button title="Retirer" variant="ghost" onPress={() => pickMeal(null)} />
                </View>
            ) : (
                <MealPicker onPick={pickMeal} />
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                <Chip label="Tout" active={category === null} onPress={() => setCategory(null)} />
                {FOOD_CATEGORIES.filter((c) => counts.get(c) && fitsMeal(c, needs)).map((c) => (
                    <Chip key={c} category={c} label={PLACE_CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
                ))}
            </ScrollView>
            <ErrorText message={error ? errorMessage(error) : null} />
            {isLoading && <Loading />}
            {data && (
                <Text style={ui.muted}>
                    {entries.length} commerces, dont {entries.filter((entry) => entry.kind === "partner").length} sur MarketSquare
                </Text>
            )}
        </View>
    );

    return (
        <View style={ui.screen}>
            <View style={styles.mapBox}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    initialRegion={{ latitude: position.lat, longitude: position.lon, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                    mapType={Platform.OS === "android" ? "none" : "standard"}
                    showsUserLocation
                >
                    <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
                    {entries.slice(0, MAX_MARKERS).map((entry) => (
                        <Marker
                            key={entry.id}
                            coordinate={{ latitude: entry.lat, longitude: entry.lon }}
                            title={entry.name}
                            description={categoryLabel(entry.category)}
                            pinColor={entry.id === selectedId ? colors.text : entry.kind === "partner" ? colors.accent : colors.faint}
                            onPress={() => setSelectedId(entry.id)}
                        />
                    ))}
                </MapView>
                <Text style={styles.attribution}>© OpenStreetMap</Text>
            </View>

            {selected ? (
                <EntryDetail entry={selected} origin={position} onBack={() => setSelectedId(null)} />
            ) : (
                <FlatList
                    data={isLoading ? [] : entries}
                    keyExtractor={(entry) => entry.id}
                    contentContainerStyle={ui.content}
                    ListHeaderComponent={header}
                    ListEmptyComponent={isLoading ? null : <Text style={ui.muted}>Aucun commerce dans ce rayon. Élargissez la zone.</Text>}
                    renderItem={({ item: entry }) => (
                        <Pressable accessibilityRole="button" style={[ui.row, styles.row]} onPress={() => setSelectedId(entry.id)}>
                            <View style={[styles.badge, entry.kind === "partner" && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                                <CategoryIcon category={entry.category} size={19} color={entry.kind === "partner" ? "#fff" : colors.body} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={ui.body} numberOfLines={1}>{entry.name}</Text>
                                <Text style={ui.muted}>
                                    {entry.category ? PLACE_CATEGORY_LABELS[entry.category] : "Commerce"} · {formatDistance(entry.distance)}
                                    {entry.kind === "partner" ? <Text style={{ color: colors.accentDark, fontFamily: fonts.medium }}> · Commande en ligne</Text> : null}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mapBox: { height: "42%", backgroundColor: colors.border },
    attribution: { position: "absolute", right: 6, bottom: 4, fontSize: 10, color: colors.muted, backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 4 },
    chip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    chipActive: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: { fontSize: 13, color: colors.text, fontFamily: fonts.medium },
    row: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 12 },
    badge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});
