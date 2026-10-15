import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import { useStackNavigation } from "../hooks";
import { Button, ErrorText, Input, SuccessText } from "../components/ui";
import { ui } from "../theme";

export function ForgotPasswordScreen() {
    const navigation = useStackNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const request = useMutation({ mutationFn: () => api.auth.forgotPassword(email.trim()) });
    const reset = useMutation({
        mutationFn: () => api.auth.resetPassword(request.data!.userId!, request.data!.token!, password),
    });

    const devToken = request.data?.token && request.data.userId;

    return (
        <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={[ui.content, { paddingTop: 24 }]} keyboardShouldPersistTaps="handled">
                <Text style={ui.title}>Mot de passe oublié</Text>
                <Text style={ui.muted}>Indiquez votre email, nous vous enverrons un lien de réinitialisation.</Text>
                <View style={[ui.card, { gap: 12 }]}>
                    <Input label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
                    <ErrorText message={request.error ? errorMessage(request.error) : null} />
                    {request.isSuccess && <SuccessText>Si un compte correspond à cet email, un lien vient d’être envoyé.</SuccessText>}
                    <Button title="Envoyer le lien" disabled={request.isPending || !email} onPress={() => request.mutate()} />
                </View>

                {devToken && (
                    <View style={[ui.card, { gap: 12 }]}>
                        <Text style={ui.subtitle}>Mode développement</Text>
                        <Text style={ui.muted}>Le serveur a renvoyé le jeton : choisissez directement un nouveau mot de passe.</Text>
                        <Input label="Nouveau mot de passe" hint="8 caractères minimum" secureTextEntry value={password} onChangeText={setPassword} />
                        <ErrorText message={reset.error ? errorMessage(reset.error) : null} />
                        {reset.isSuccess ? (
                            <>
                                <SuccessText>Mot de passe réinitialisé.</SuccessText>
                                <Button title="Se connecter" onPress={() => navigation.navigate("Login")} />
                            </>
                        ) : (
                            <Button title="Réinitialiser" disabled={reset.isPending || password.length < 8} onPress={() => reset.mutate()} />
                        )}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
