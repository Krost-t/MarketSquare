import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, startOfWeek, toISODate, type MealPlanEntry, type MealSlot } from "@marketsquare/shared";
import { Basket, CaretLeft, CaretRight, ForkKnife, Plus, X } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useStackNavigation } from "../hooks";
import { SLOTS, SLOT_LABELS, capitalize, dayFormat, longFormat, monthFormat } from "../lib/meals";
import { Button, ErrorText, Loading, Segmented, SuccessText } from "../components/ui";
import { LoginPrompt } from "../components/LoginPrompt";
import { colors, fonts, radius, ui } from "../theme";

type Period = "day" | "week" | "month";

const rangeFor = (period: Period, anchor: Date): { from: Date; days: Date[] } => {
    if (period === "day") return { from: anchor, days: [anchor] };
    if (period === "week") {
        const from = startOfWeek(anchor);
        return { from, days: Array.from({ length: 7 }, (_, i) => addDays(from, i)) };
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { from: first, days: Array.from({ length: last.getDate() }, (_, i) => addDays(first, i)) };
};

function SlotCell({ entry, compact, onAdd, onOpen, onRemove }: {
    entry: MealPlanEntry | undefined;
    compact: boolean;
    onAdd: () => void;
    onOpen: () => void;
    onRemove: () => void;
}) {
    if (!entry) {
        return (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajouter un plat"
                onPress={onAdd}
                style={{
                    height: compact ? 40 : 110,
                    borderRadius: radius.ui,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: colors.faint,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 4,
                }}
            >
                <Plus size={compact ? 14 : 18} color={colors.faint} />
                {!compact && <Text style={[ui.muted, { color: colors.faint }]}>Ajouter</Text>}
            </Pressable>
        );
    }
    if (compact) {
        return (
            <Pressable accessibilityRole="button" onPress={onOpen} style={[ui.row, { height: 40, borderRadius: radius.ui, backgroundColor: colors.borderSoft, overflow: "hidden", gap: 8, paddingRight: 8 }]}>
                {entry.thumbnail ? <Image source={{ uri: `${entry.thumbnail}/small` }} style={{ width: 40, height: 40 }} /> : null}
                <Text style={[ui.body, { flex: 1, fontSize: 13 }]} numberOfLines={1}>{entry.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${entry.name}`} onPress={onRemove} hitSlop={8}>
                    <X size={14} color={colors.muted} />
                </Pressable>
            </Pressable>
        );
    }
    return (
        <View>
            <Pressable accessibilityRole="button" onPress={onOpen}>
                {entry.thumbnail ? <Image source={{ uri: `${entry.thumbnail}/medium` }} style={{ width: "100%", height: 110, borderRadius: radius.ui }} /> : null}
                <Text style={{ fontFamily: fonts.medium, color: colors.text, fontSize: 13, marginTop: 6 }} numberOfLines={2}>{entry.name}</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Retirer ${entry.name}`}
                onPress={onRemove}
                style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 999, padding: 5 }}
            >
                <X size={14} color={colors.body} />
            </Pressable>
        </View>
    );
}

export function MealPlannerScreen() {
    const { user } = useAuth();
    const navigation = useStackNavigation();
    const queryClient = useQueryClient();
    const [period, setPeriod] = useState<Period>("week");
    const [anchor, setAnchor] = useState(() => new Date());

    const { from, days } = useMemo(() => rangeFor(period, anchor), [period, anchor]);
    const range = { from: toISODate(from), to: toISODate(days[days.length - 1]!) };

    const { data: entries, isLoading } = useQuery({
        queryKey: ["meal-plan", range.from, range.to],
        queryFn: () => api.mealPlan.list(range.from, range.to),
        enabled: Boolean(user),
        placeholderData: keepPreviousData,
    });

    const removeMeal = useMutation({
        mutationFn: (id: string) => api.mealPlan.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meal-plan"] }),
    });
    const toList = useMutation({
        mutationFn: () => api.mealPlan.toShoppingList(range.from, range.to),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
            navigation.navigate("Tabs", { screen: "List" });
        },
    });

    const byKey = useMemo(() => new Map((entries ?? []).map((entry) => [`${entry.date.slice(0, 10)}-${entry.slot}`, entry])), [entries]);
    const entryFor = (date: Date, slot: MealSlot) => byKey.get(`${toISODate(date)}-${slot}`);

    if (!user) {
        return (
            <LoginPrompt
                icon={<ForkKnife size={36} color={colors.text} />}
                title="Planifiez vos repas"
                text="Connectez-vous pour choisir vos plats du jour, de la semaine ou du mois et acheter les ingrédients chez vos commerçants."
            />
        );
    }

    const move = (direction: -1 | 1) => {
        if (period === "day") setAnchor(addDays(anchor, direction));
        else if (period === "week") setAnchor(addDays(anchor, 7 * direction));
        else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
    };

    const title = capitalize(
        period === "day" ? longFormat.format(anchor) : period === "week" ? `Semaine du ${longFormat.format(from)}` : monthFormat.format(anchor),
    );
    const today = toISODate(new Date());
    const plannedCount = entries?.length ?? 0;

    const cell = (day: Date, slot: MealSlot, compact: boolean) => {
        const entry = entryFor(day, slot);
        return (
            <SlotCell
                compact={compact}
                entry={entry}
                onAdd={() => navigation.navigate("MealPicker", { date: toISODate(day), slot })}
                onOpen={() => entry && navigation.navigate("Recipe", { id: entry.mealId, name: entry.name })}
                onRemove={() => entry && removeMeal.mutate(entry.id)}
            />
        );
    };

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 14 }]}>
            <View style={ui.row}>
                <Button variant="ghost" compact icon={<CaretLeft size={18} color={colors.text} />} onPress={() => move(-1)} />
                <Button variant="ghost" compact icon={<CaretRight size={18} color={colors.text} />} onPress={() => move(1)} />
                <Text style={[ui.title, { fontSize: 20, flex: 1, marginLeft: 4 }]} numberOfLines={2}>{title}</Text>
            </View>
            <Segmented
                options={[{ value: "day", label: "Jour" }, { value: "week", label: "Semaine" }, { value: "month", label: "Mois" }]}
                value={period}
                onChange={setPeriod}
            />
            <Button
                title="Acheter les ingrédients"
                variant="accent"
                icon={<Basket size={17} color="#fff" />}
                disabled={plannedCount === 0 || toList.isPending}
                onPress={() => toList.mutate()}
            />
            <ErrorText message={toList.error ? errorMessage(toList.error) : null} />
            {plannedCount > 0 && <SuccessText>{plannedCount} repas prévus sur la période. Les ingrédients iront dans votre liste, classés par commerce.</SuccessText>}

            {isLoading ? (
                <Loading />
            ) : (
                days.map((day) => {
                    const isToday = toISODate(day) === today;
                    return (
                        <View key={toISODate(day)} style={period === "month" ? [ui.card, { padding: 10, gap: 6 }, isToday && { borderColor: colors.text }] : { gap: 6 }}>
                            {period !== "day" && (
                                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: isToday ? colors.accentDark : colors.muted }}>{capitalize(dayFormat.format(day))}</Text>
                            )}
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                {SLOTS.map((slot) => (
                                    <View key={slot} style={{ flex: 1, gap: 4 }}>
                                        {period !== "month" && <Text style={[ui.muted, { fontSize: 12, color: colors.faint }]}>{SLOT_LABELS[slot]}</Text>}
                                        {cell(day, slot, period === "month")}
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}
