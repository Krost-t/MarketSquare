import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import type { RegisterInput } from "@marketsquare/shared";
import { useAuth } from "../lib/auth";
import { errorMessage } from "../lib/api";
import { useStackNavigation } from "../hooks";
import { Button, ErrorText, Input } from "../components/ui";
import { colors, fonts, radius, ui } from "../theme";

const ROLES = [
    { value: "USER", title: "Client", text: "Je commande chez mes commerçants" },
    { value: "MERCHANT", title: "Commerçant", text: "Je vends mes produits" },
] as const;

export function RegisterScreen() {
    const { register } = useAuth();
    const navigation = useStackNavigation();
    const [form, setForm] = useState<RegisterInput>({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
        gender: "OTHER",
        role: "USER",
    });
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const set = (key: keyof RegisterInput) => (value: string) => setForm({ ...form, [key]: value });

    const onSubmit = async () => {
        setError(null);
        setPending(true);
        try {
            await register({ ...form, email: form.email.trim() });
            if (form.role === "MERCHANT") navigation.navigate("MerchantShop");
            else navigation.navigate("Tabs");
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
                <Text style={ui.label}>Type de compte</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    {ROLES.map((option) => {
                        const active = form.role === option.value;
                        return (
                            <Pressable
                                key={option.value}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: active }}
                                onPress={() => setForm({ ...form, role: option.value })}
                                style={{ flex: 1, gap: 2, padding: 14, borderRadius: radius.panel, borderWidth: 1, borderColor: active ? colors.text : colors.border, backgroundColor: active ? colors.brandLight : colors.card }}
                            >
                                <Text style={{ fontFamily: fonts.semibold, color: colors.text }}>{option.title}</Text>
                                <Text style={[ui.muted, { fontSize: 12 }]}>{option.text}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Input label="Prénom" value={form.firstname} onChangeText={set("firstname")} autoComplete="given-name" />
                <Input label="Nom" value={form.lastname} onChangeText={set("lastname")} autoComplete="family-name" />
                <Input label="Date de naissance (AAAA-MM-JJ)" value={form.dateOfBirth} onChangeText={set("dateOfBirth")} placeholder="1995-04-12" />
                <Input label="Téléphone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" />
                <Input label="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
                <Input label="Mot de passe (8 caractères min.)" value={form.password} onChangeText={set("password")} secureTextEntry />
                <ErrorText message={error} />
                <Button title="Créer mon compte" disabled={pending} onPress={onSubmit} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
