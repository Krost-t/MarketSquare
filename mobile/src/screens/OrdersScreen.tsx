import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { DELIVERY_METHOD_LABELS, formatDate, formatPrice } from "@marketsquare/shared";
import { Receipt } from "../components/icons";
import { api } from "../lib/api";
import { useStackNavigation, useStackRoute } from "../hooks";
import { Empty, Loading, StatusBadge, SuccessText } from "../components/ui";
import { colors, fonts, ui } from "../theme";

export function OrdersScreen() {
    const navigation = useStackNavigation();
    const created = useStackRoute<"Orders">().params?.created;
    const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["orders"], queryFn: () => api.orders.list({ limit: 50 }) });

    if (isLoading) return <Loading />;

    return (
        <FlatList
            style={ui.screen}
            contentContainerStyle={ui.content}
            data={data?.data ?? []}
            keyExtractor={(order) => order.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.text} />}
            ListHeaderComponent={created ? <SuccessText>Merci ! {created} commande(s) envoyée(s) aux commerçants.</SuccessText> : null}
            ListEmptyComponent={<Empty icon={<Receipt size={36} color={colors.text} />} title="Aucune commande">Vos commandes apparaîtront ici.</Empty>}
            renderItem={({ item: order }) => (
                <Pressable accessibilityRole="button" style={({ pressed }) => [ui.card, { gap: 6 }, pressed && { borderColor: colors.faint }]} onPress={() => navigation.navigate("Order", { id: order.id })}>
                    <View style={[ui.row, { justifyContent: "space-between" }]}>
                        <Text style={{ fontFamily: fonts.medium, color: colors.text, flex: 1 }} numberOfLines={1}>{order.shop?.name ?? "Boutique supprimée"}</Text>
                        <Text style={ui.price}>{formatPrice(order.totalAmount)}</Text>
                    </View>
                    <Text style={ui.muted}>{formatDate(order.createdAt)} · {DELIVERY_METHOD_LABELS[order.deliveryMethod]} · {order.items.length} article(s)</Text>
                    <StatusBadge status={order.status} />
                </Pressable>
            )}
        />
    );
}
