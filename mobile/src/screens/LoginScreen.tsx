import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { useAuth } from "../lib/auth";
import { errorMessage } from "../lib/api";
import { useStackNavigation } from "../hooks";
import { Button, ErrorText, Input, LinkText } from "../components/ui";
import { ui } from "../theme";

export function LoginScreen() {
    const { login } = useAuth();
    const navigation = useStackNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const onSubmit = async () => {
        setError(null);
        setPending(true);
        try {
            await login(email.trim(), password);
            if (navigation.canGoBack()) navigation.goBack();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={[ui.content, { paddingTop: 32 }]} keyboardShouldPersistTaps="handled">
                <Text style={ui.title}>Connexion</Text>
                <Text style={ui.muted}>Connectez-vous pour commander et suivre vos commandes.</Text>
                <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
                <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
                <ErrorText message={error} />
                <Button title="Se connecter" disabled={pending || !email || !password} onPress={onSubmit} />
                <Text style={[ui.muted, { textAlign: "center", marginTop: 4 }]} onPress={() => navigation.navigate("ForgotPassword")}>
                    Mot de passe oublié ?
                </Text>
                <Text style={[ui.body, { textAlign: "center", marginTop: 8 }]}>
                    Pas encore de compte ? <LinkText onPress={() => navigation.navigate("Register")}>Créer un compte</LinkText>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
