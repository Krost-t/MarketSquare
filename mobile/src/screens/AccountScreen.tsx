import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CaretRight, Heart, Package, Receipt, SignOut, Storefront, User } from "../components/icons";
import { useAuth } from "../lib/auth";
import { useStackNavigation } from "../hooks";
import { colors, fonts, radius, ui } from "../theme";

const ROLE_LABELS = { USER: "Client", MERCHANT: "Commerçant", ADMIN: "Administrateur" } as const;

type Target = "Orders" | "Favorites" | "Profile" | "MerchantShop" | "MerchantProducts" | "MerchantOrders";

function MenuRow({ icon, label, onPress, last }: { icon: ReactNode; label: string; onPress: () => void; last?: boolean }) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [ui.row, { paddingVertical: 14, paddingHorizontal: 16, gap: 12 }, !last && { borderBottomWidth: 1, borderColor: colors.borderSoft }, pressed && { backgroundColor: colors.paper }]}
        >
            {icon}
            <Text style={[ui.body, { flex: 1, fontFamily: fonts.medium, color: colors.text }]}>{label}</Text>
            <CaretRight size={16} color={colors.faint} />
        </Pressable>
    );
}

function Menu({ title, items }: { title: string; items: { icon: ReactNode; label: string; to: Target }[] }) {
    const navigation = useStackNavigation();
    return (
        <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>{title}</Text>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
                {items.map((item, index) => (
                    <MenuRow key={item.to} icon={item.icon} label={item.label} last={index === items.length - 1} onPress={() => navigation.navigate(item.to)} />
                ))}
            </View>
        </View>
    );
}

export function AccountScreen() {
    const { user, logout } = useAuth();
    const navigation = useStackNavigation();
    if (!user) return null;

    const icon = (Glyph: typeof User) => <Glyph size={20} color={colors.text} />;
    const isMerchant = user.role === "MERCHANT" || user.role === "ADMIN";

    return (
        <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { gap: 20 }]}>
            <View style={[ui.row, { gap: 14 }]}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.text, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontFamily: fonts.semibold, fontSize: 18 }}>{user.firstname.charAt(0)}{user.lastname.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={ui.title}>{user.firstname} {user.lastname}</Text>
                    <Text style={ui.muted}>@{user.username} · {ROLE_LABELS[user.role]}</Text>
                </View>
            </View>

            <Menu
                title="Mon compte"
                items={[
                    { icon: icon(Receipt), label: "Commandes", to: "Orders" },
                    { icon: icon(Heart), label: "Favoris", to: "Favorites" },
                    { icon: icon(User), label: "Profil, adresses et mot de passe", to: "Profile" },
                ]}
            />

            {isMerchant && (
                <Menu
                    title={user.shop?.name ?? "Espace marchand"}
                    items={[
                        { icon: icon(Storefront), label: user.shop ? "Ma boutique" : "Ouvrir ma boutique", to: "MerchantShop" },
                        ...(user.shop
                            ? [
                                  { icon: icon(Package), label: "Catalogue", to: "MerchantProducts" as const },
                                  { icon: icon(Receipt), label: "Commandes reçues", to: "MerchantOrders" as const },
                              ]
                            : []),
                    ]}
                />
            )}

            {user.role === "ADMIN" && <Text style={ui.muted}>L’administration (utilisateurs, avis, boutiques) se fait depuis le site web.</Text>}

            <Pressable accessibilityRole="button" onPress={() => void logout().then(() => navigation.navigate("Tabs", { screen: "Home" }))} style={[ui.row, { justifyContent: "center", paddingVertical: 12 }]}>
                <SignOut size={18} color={colors.danger} />
                <Text style={{ color: colors.danger, fontFamily: fonts.medium }}>Se déconnecter</Text>
            </Pressable>
        </ScrollView>
    );
}
