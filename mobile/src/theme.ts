import { StyleSheet } from "react-native";

export const colors = {
    brand: "#15181e",
    brandDark: "#15181e",
    brandLight: "#fff3ef",
    accent: "#e2522a",
    accentDark: "#c63f1a",
    paper: "#f6f7f8",
    card: "#ffffff",
    border: "#dadde3",
    borderSoft: "#eceef1",
    text: "#15181e",
    body: "#22262e",
    muted: "#646b78",
    faint: "#8d94a0",
    success: "#047857",
    danger: "#b91c1c",
    dangerLight: "#fef2f2",
};

export const fonts = {
    regular: "Geist_400Regular",
    medium: "Geist_500Medium",
    semibold: "Geist_600SemiBold",
    bold: "Geist_700Bold",
};

export const radius = { ui: 8, panel: 12 };

export const ui = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.paper },
    content: { padding: 16, gap: 12 },
    card: { backgroundColor: colors.card, borderRadius: radius.panel, borderWidth: 1, borderColor: colors.border, padding: 16 },
    title: { fontSize: 24, fontFamily: fonts.semibold, color: colors.text, letterSpacing: -0.4 },
    subtitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text, letterSpacing: -0.2 },
    body: { fontSize: 15, fontFamily: fonts.regular, color: colors.body },
    muted: { fontSize: 13, fontFamily: fonts.regular, color: colors.muted },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.ui,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: colors.text,
    },
    label: { fontSize: 13, fontFamily: fonts.medium, color: colors.body, marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    price: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
    error: { color: colors.danger, backgroundColor: colors.dangerLight, padding: 10, borderRadius: radius.ui, fontSize: 13, fontFamily: fonts.regular },
});
