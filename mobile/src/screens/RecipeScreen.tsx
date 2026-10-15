import { Image, Linking, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ArrowSquareOut } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useStackRoute } from "../hooks";
import { MEAL_CATEGORY_LABELS } from "../lib/meals";
import { ErrorText, LinkText, Loading } from "../components/ui";
import { colors, fonts, radius, ui } from "../theme";

export function RecipeScreen() {
    const { id } = useStackRoute<"Recipe">().params;
    const { data: meal, isLoading, error } = useQuery({ queryKey: ["meal", id], queryFn: () => api.meals.get(id) });

    if (isLoading) return <Loading />;
    if (!meal) return <ErrorText message={errorMessage(error)} />;

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 14 }]}>
            <Image source={{ uri: meal.thumbnail }} style={{ width: "100%", aspectRatio: 1, borderRadius: radius.panel }} />
            <Text style={ui.title}>{meal.name}</Text>
            <View style={ui.row}>
                <Text style={ui.muted}>{[meal.category && (MEAL_CATEGORY_LABELS[meal.category] ?? meal.category), meal.area].filter(Boolean).join(", ")}</Text>
                {meal.youtube && (
                    <View style={[ui.row, { gap: 4 }]}>
                        <LinkText onPress={() => void Linking.openURL(meal.youtube!)}>Vidéo</LinkText>
                        <ArrowSquareOut size={13} color={colors.text} />
                    </View>
                )}
            </View>

            <Text style={ui.subtitle}>Ingrédients</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 10 }}>
                {meal.ingredients.map((ingredient) => (
                    <View key={ingredient.original} style={[ui.row, { width: "50%", paddingRight: 8 }]}>
                        <Image source={{ uri: ingredient.image }} style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: colors.card }} resizeMode="contain" />
                        <View style={{ flex: 1 }}>
                            <Text style={[ui.body, { fontSize: 14 }]} numberOfLines={2}>{ingredient.name}</Text>
                            {ingredient.measure ? <Text style={[ui.muted, { fontSize: 12 }]}>{ingredient.measure}</Text> : null}
                        </View>
                    </View>
                ))}
            </View>

            <Text style={[ui.subtitle, { marginTop: 8 }]}>Préparation</Text>
            <Text style={[ui.muted, { fontSize: 12 }]}>Recette d'origine en anglais (TheMealDB).</Text>
            {meal.instructions.split(/\r?\n+/).filter(Boolean).map((paragraph, i) => (
                <Text key={i} style={[ui.body, { fontSize: 14, lineHeight: 22, fontFamily: fonts.regular }]}>{paragraph}</Text>
            ))}
        </ScrollView>
    );
}
