import { useState } from "react";
import { RefreshControl, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ProductSort } from "@marketsquare/shared";
import { MagnifyingGlass, Package } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { Button, Chip, ChipRow, Empty, ErrorText, Loading } from "../components/ui";
import { ProductGrid } from "../components/ProductCard";
import { colors, ui } from "../theme";

const SORTS: { value: ProductSort; label: string }[] = [
    { value: "newest", label: "Nouveautés" },
    { value: "price_asc", label: "Prix croissant" },
    { value: "price_desc", label: "Prix décroissant" },
    { value: "rating", label: "Mieux notés" },
];

export function ProductsScreen() {
    const [form, setForm] = useState({ search: "", minPrice: "", maxPrice: "" });
    const [filters, setFilters] = useState(form);
    const [sort, setSort] = useState<ProductSort>("newest");
    const [inStock, setInStock] = useState(false);

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["products", filters, sort, inStock],
        queryFn: () =>
            api.products.list({
                search: filters.search || undefined,
                minPrice: filters.minPrice ? Number(filters.minPrice.replace(",", ".")) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice.replace(",", ".")) : undefined,
                inStock: inStock || undefined,
                sort,
                limit: 40,
            }),
        placeholderData: keepPreviousData,
    });

    return (
        <ScrollView
            style={ui.screen}
            contentContainerStyle={[ui.content, { gap: 14 }]}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.text} />}
        >
            <Text style={ui.muted}>Tout ce que proposent les commerçants de MarketSquare.</Text>
            <View style={[ui.card, { gap: 10, padding: 12 }]}>
                <View style={ui.row}>
                    <TextInput style={[ui.input, { flex: 1 }]} placeholder="Rechercher un produit…" placeholderTextColor={colors.faint} accessibilityLabel="Recherche"
                        value={form.search} onChangeText={(search) => setForm({ ...form, search })} onSubmitEditing={() => setFilters(form)} returnKeyType="search" />
                    <Button icon={<MagnifyingGlass size={18} color="#fff" />} onPress={() => setFilters(form)} />
                </View>
                <View style={ui.row}>
                    <TextInput style={[ui.input, { flex: 1 }]} placeholder="Prix min" placeholderTextColor={colors.faint} keyboardType="decimal-pad" accessibilityLabel="Prix minimum"
                        value={form.minPrice} onChangeText={(minPrice) => setForm({ ...form, minPrice })} onSubmitEditing={() => setFilters(form)} />
                    <TextInput style={[ui.input, { flex: 1 }]} placeholder="Prix max" placeholderTextColor={colors.faint} keyboardType="decimal-pad" accessibilityLabel="Prix maximum"
                        value={form.maxPrice} onChangeText={(maxPrice) => setForm({ ...form, maxPrice })} onSubmitEditing={() => setFilters(form)} />
                    <Button title="Filtrer" onPress={() => setFilters(form)} />
                </View>
                <ChipRow>
                    {SORTS.map((option) => <Chip key={option.value} label={option.label} active={sort === option.value} onPress={() => setSort(option.value)} />)}
                </ChipRow>
                <View style={[ui.row, { justifyContent: "space-between" }]}>
                    <Text style={ui.body}>Uniquement les produits disponibles</Text>
                    <Switch value={inStock} onValueChange={setInStock} trackColor={{ true: colors.text, false: colors.border }} thumbColor="#fff" />
                </View>
            </View>

            <ErrorText message={error ? errorMessage(error) : null} />
            {isLoading ? (
                <Loading />
            ) : data?.data.length ? (
                <>
                    <Text style={ui.muted}>{data.pagination.total} produit(s)</Text>
                    <ProductGrid products={data.data} />
                </>
            ) : (
                <Empty icon={<Package size={36} color={colors.text} />} title="Aucun produit ne correspond">Modifiez vos filtres pour élargir la recherche.</Empty>
            )}
        </ScrollView>
    );
}
