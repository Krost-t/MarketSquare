import { useState } from "react";
import { FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MagnifyingGlass } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useStackNavigation, useStackRoute } from "../hooks";
import { MEAL_CATEGORY_LABELS, SLOT_LABELS, capitalize, longFormat, parseISODate } from "../lib/meals";
import { Button, Chip, ChipRow, ErrorText, Loading } from "../components/ui";
import { colors, fonts, radius, ui } from "../theme";

export function MealPickerScreen() {
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const { date, slot } = useStackRoute<"MealPicker">().params;
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string | null>(null);

    const categories = useQuery({ queryKey: ["meal-categories"], queryFn: () => api.meals.categories(), staleTime: Infinity });
    const results = useQuery({
        queryKey: ["meals", search, category],
        queryFn: () => (category ? api.meals.byCategory(category) : search ? api.meals.search(search) : api.meals.random(10)),
        placeholderData: keepPreviousData,
        staleTime: category || search ? 60 * 60 * 1000 : 0,
    });

    const setMeal = useMutation({
        mutationFn: (mealId: string) => api.mealPlan.set(date, slot, mealId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["meal-plan"] });
            navigation.goBack();
        },
    });

    const submit = () => {
        setCategory(null);
        setSearch(query.trim());
    };

    return (
        <FlatList
            style={ui.screen}
            contentContainerStyle={ui.content}
            data={results.data?.slice(0, 30) ?? []}
            keyExtractor={(meal) => meal.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
                <View style={{ gap: 12, marginBottom: 4 }}>
                    <Text style={ui.subtitle}>{SLOT_LABELS[slot]}, {capitalize(longFormat.format(parseISODate(date)))}</Text>
                    <View style={ui.row}>
                        <TextInput
                            style={[ui.input, { flex: 1 }]}
                            placeholder="Rechercher un plat (chicken, pasta, soup)"
                            placeholderTextColor={colors.faint}
                            accessibilityLabel="Rechercher un plat"
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={submit}
                            returnKeyType="search"
                        />
                        <Button icon={<MagnifyingGlass size={18} color="#fff" />} onPress={submit} />
                    </View>
                    <ChipRow>
                        <Chip label="Suggestions" active={!category && !search} onPress={() => { setCategory(null); setSearch(""); setQuery(""); }} />
                        {categories.data?.map((c) => (
                            <Chip key={c.name} label={MEAL_CATEGORY_LABELS[c.name] ?? c.name} active={category === c.name} onPress={() => { setCategory(c.name); setSearch(""); }} />
                        ))}
                    </ChipRow>
                    <ErrorText message={results.error ? errorMessage(results.error) : setMeal.error ? errorMessage(setMeal.error) : null} />
                    {results.isLoading && <Loading />}
                    {results.data?.length === 0 && <Text style={ui.muted}>Aucun plat trouvé.</Text>}
                </View>
            }
            renderItem={({ item: meal }) => (
                <Pressable accessibilityRole="button" disabled={setMeal.isPending} style={({ pressed }) => [{ flex: 1, marginBottom: 14 }, pressed && { opacity: 0.8 }]} onPress={() => setMeal.mutate(meal.id)}>
                    <Image source={{ uri: `${meal.thumbnail}/medium` }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.ui }} />
                    <Text style={{ fontFamily: fonts.medium, color: colors.text, fontSize: 13, marginTop: 6 }} numberOfLines={2}>{meal.name}</Text>
                </Pressable>
            )}
        />
    );
}
