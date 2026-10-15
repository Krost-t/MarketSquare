import { Children, type ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@marketsquare/shared";
import { colors, fonts, radius, ui } from "../theme";

type Variant = "primary" | "accent" | "ghost" | "danger";

export function Button({ title, onPress, variant = "primary", disabled, icon, compact }: {
    title?: string;
    onPress: () => void;
    variant?: Variant;
    disabled?: boolean;
    icon?: ReactNode;
    compact?: boolean;
}) {
    const textColor = variant === "primary" || variant === "accent" ? "#fff" : variant === "danger" ? colors.danger : colors.text;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [styles.button, styles[variant], compact && styles.compact, (pressed || disabled) && { opacity: 0.6 }]}
        >
            {icon}
            {title ? <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text> : null}
        </Pressable>
    );
}

export function Input({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
    return (
        <View>
            <Text style={ui.label}>{label}</Text>
            <TextInput
                placeholderTextColor={colors.faint}
                accessibilityLabel={label}
                {...props}
                style={[ui.input, props.multiline && { minHeight: 90, textAlignVertical: "top" }, props.style]}
            />
            {hint ? <Text style={[ui.muted, { marginTop: 4, fontSize: 12 }]}>{hint}</Text> : null}
        </View>
    );
}

export function Loading() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.text} size="large" />
        </View>
    );
}

export function Empty({ title, icon, children }: { title: string; icon?: ReactNode; children?: ReactNode }) {
    return (
        <View style={[styles.center, { padding: 32, gap: 10 }]}>
            {icon}
            <Text style={[ui.subtitle, { textAlign: "center" }]}>{title}</Text>
            {Children.map(children, (child) => (typeof child === "string" ? <Text style={[ui.muted, { textAlign: "center" }]}>{child}</Text> : child))}
        </View>
    );
}

export function ErrorText({ message }: { message?: string | null }) {
    if (!message) return null;
    return <Text style={ui.error}>{message}</Text>;
}

export function SuccessText({ children }: { children: ReactNode }) {
    return <Text style={styles.success}>{children}</Text>;
}

export function Thumb({ uri, size, height, contain }: { uri: string | null | undefined; size?: number; height?: number; contain?: boolean }) {
    const style = size ? { width: size, height: size, borderRadius: radius.ui } : { width: "100%" as const, height: height ?? 160, borderRadius: radius.panel };
    if (!uri) return <View style={[style, { backgroundColor: colors.borderSoft }]} />;
    return <Image source={{ uri }} style={[style, { backgroundColor: colors.card }]} resizeMode={contain ? "contain" : "cover"} />;
}

export function Rating({ value, count }: { value: string | number; count?: number }) {
    const rounded = Math.round(Number(value));
    return (
        <Text style={ui.muted} accessibilityLabel={`Note ${Number(value).toFixed(1)} sur 5`}>
            <Text style={{ color: colors.text }}>{"★".repeat(rounded)}</Text>
            <Text style={{ color: colors.border }}>{"★".repeat(5 - rounded)}</Text>
            {count !== undefined ? ` (${count})` : ""}
        </Text>
    );
}

export function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    return (
        <View style={ui.row} accessibilityRole="adjustable" accessibilityLabel={`Note ${value} sur 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} accessibilityRole="button" accessibilityLabel={`${star} étoile(s)`} onPress={() => onChange(star)} hitSlop={6}>
                    <Text style={{ fontSize: 28, color: star <= value ? colors.text : colors.border }}>★</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
    const done = status === "DELIVERED";
    const cancelled = status === "CANCELLED" || status === "RETURNED";
    return (
        <Text style={[styles.badge, done && { backgroundColor: "#ecfdf5", color: colors.success }, cancelled && { backgroundColor: colors.borderSoft, color: colors.muted }]}>
            {ORDER_STATUS_LABELS[status]}
        </Text>
    );
}

export function Chip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: (color: string) => ReactNode }) {
    return (
        <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
            {icon?.(active ? "#fff" : colors.text)}
            <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
        </Pressable>
    );
}

export function ChipRow({ children }: { children: ReactNode }) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flexGrow: 0 }}>
            {children}
        </ScrollView>
    );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
    return (
        <View style={styles.segmented} accessibilityRole="radiogroup">
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        onPress={() => onChange(option.value)}
                        style={[styles.segment, active && { backgroundColor: colors.text }]}
                    >
                        <Text style={[styles.chipText, { color: active ? "#fff" : colors.body }]}>{option.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
    return (
        <View style={[ui.row, { justifyContent: "space-between", alignItems: "flex-end" }]}>
            <View style={{ flex: 1, gap: 2 }}>
                <Text style={ui.title}>{title}</Text>
                {subtitle ? <Text style={ui.muted}>{subtitle}</Text> : null}
            </View>
            {action}
        </View>
    );
}

export function LinkText({ children, onPress, color = colors.text }: { children: ReactNode; onPress: () => void; color?: string }) {
    return (
        <Text accessibilityRole="link" onPress={onPress} style={{ color, fontFamily: fonts.medium, textDecorationLine: "underline" }}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    button: { flexDirection: "row", gap: 8, borderRadius: radius.ui, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    compact: { paddingVertical: 8, paddingHorizontal: 10 },
    primary: { backgroundColor: colors.brand, borderColor: colors.brand },
    accent: { backgroundColor: colors.accent, borderColor: colors.accent },
    ghost: { backgroundColor: colors.card, borderColor: colors.border },
    danger: { backgroundColor: colors.card, borderColor: "#fecaca" },
    buttonText: { fontFamily: fonts.semibold, fontSize: 15 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 32 },
    success: { color: colors.success, backgroundColor: "#ecfdf5", padding: 10, borderRadius: radius.ui, fontSize: 13, fontFamily: fonts.regular },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: colors.brandLight,
        color: colors.accentDark,
        fontSize: 12,
        fontFamily: fonts.semibold,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        overflow: "hidden",
    },
    chip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    chipActive: { backgroundColor: colors.text, borderColor: colors.text },
    chipText: { fontSize: 13, color: colors.text, fontFamily: fonts.medium },
    segmented: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radius.ui, padding: 2, backgroundColor: colors.card },
    segment: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 6 },
});
