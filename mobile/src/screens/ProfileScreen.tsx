import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateProfileInput, User } from "@marketsquare/shared";
import { MapPin, Trash } from "../components/icons";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useStackNavigation } from "../hooks";
import { AddressFields, emptyAddress, type AddressValue } from "../components/AddressFields";
import { Button, ErrorText, Input, SuccessText } from "../components/ui";
import { colors, ui } from "../theme";

function Card({ title, children, danger }: { title: string; children: ReactNode; danger?: boolean }) {
    return (
        <View style={[ui.card, { gap: 12 }, danger && { borderColor: "#fecaca" }]}>
            <Text style={[ui.title, { fontSize: 19 }, danger && { color: colors.danger }]}>{title}</Text>
            {children}
        </View>
    );
}

function ProfileForm({ user }: { user: User }) {
    const { refreshUser } = useAuth();
    const [form, setForm] = useState<UpdateProfileInput>({
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
    });
    const mutation = useMutation({
        mutationFn: () => api.user.updateProfile({ ...form, avatarUrl: form.avatarUrl || null }),
        onSuccess: () => refreshUser(),
    });
    const set = (key: keyof UpdateProfileInput) => (value: string) => setForm({ ...form, [key]: value });

    return (
        <Card title="Profil">
            <Text style={ui.muted}>{user.email}</Text>
            <Input label="Prénom" value={form.firstname} onChangeText={set("firstname")} />
            <Input label="Nom" value={form.lastname} onChangeText={set("lastname")} />
            <Input label="Pseudo" autoCapitalize="none" value={form.username} onChangeText={set("username")} />
            <Input label="Téléphone" keyboardType="phone-pad" value={form.phone} onChangeText={set("phone")} />
            <Input label="Photo de profil (URL)" autoCapitalize="none" keyboardType="url" value={form.avatarUrl ?? ""} onChangeText={set("avatarUrl")} />
            <ErrorText message={mutation.error ? errorMessage(mutation.error) : null} />
            {mutation.isSuccess && <SuccessText>Profil mis à jour.</SuccessText>}
            <Button title="Enregistrer" disabled={mutation.isPending} onPress={() => mutation.mutate()} />
        </Card>
    );
}

function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const mutation = useMutation({
        mutationFn: () => api.user.changePassword(currentPassword, newPassword),
        onSuccess: () => {
            setCurrentPassword("");
            setNewPassword("");
        },
    });

    return (
        <Card title="Mot de passe">
            <Input label="Mot de passe actuel" secureTextEntry autoComplete="current-password" value={currentPassword} onChangeText={setCurrentPassword} />
            <Input label="Nouveau mot de passe" hint="8 caractères minimum" secureTextEntry autoComplete="new-password" value={newPassword} onChangeText={setNewPassword} />
            <ErrorText message={mutation.error ? errorMessage(mutation.error) : null} />
            {mutation.isSuccess && <SuccessText>Mot de passe modifié.</SuccessText>}
            <Button title="Changer le mot de passe" disabled={mutation.isPending || !currentPassword || newPassword.length < 8} onPress={() => mutation.mutate()} />
        </Card>
    );
}

function Addresses() {
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState(false);
    const [address, setAddress] = useState<AddressValue>(emptyAddress);

    const { data } = useQuery({ queryKey: ["addresses"], queryFn: () => api.addresses.list() });
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses"] });

    const create = useMutation({
        mutationFn: () => api.addresses.create({ ...address, type: "SHIPPING" }),
        onSuccess: () => {
            setAdding(false);
            setAddress(emptyAddress);
            invalidate();
        },
    });
    const remove = useMutation({ mutationFn: (id: string) => api.addresses.remove(id), onSuccess: invalidate });

    return (
        <Card title="Adresses de livraison">
            {data?.length ? (
                data.map((a) => (
                    <View key={a.id} style={[ui.row, { gap: 10, paddingVertical: 6 }]}>
                        <MapPin size={16} color={colors.accentDark} />
                        <Text style={[ui.body, { flex: 1, fontSize: 14 }]}>{a.streetAddress}, {a.postalCode} {a.addressLocality}</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Supprimer l'adresse" onPress={() => remove.mutate(a.id)} hitSlop={8}>
                            <Trash size={18} color={colors.faint} />
                        </Pressable>
                    </View>
                ))
            ) : (
                !adding && <Text style={ui.muted}>Aucune adresse enregistrée.</Text>
            )}
            {adding ? (
                <View style={{ gap: 12, borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 }}>
                    <AddressFields value={address} onChange={setAddress} />
                    <ErrorText message={create.error ? errorMessage(create.error) : null} />
                    <View style={ui.row}>
                        <View style={{ flex: 1 }}><Button title="Enregistrer" disabled={create.isPending} onPress={() => create.mutate()} /></View>
                        <Button title="Annuler" variant="ghost" onPress={() => setAdding(false)} />
                    </View>
                </View>
            ) : (
                <Button title="Ajouter une adresse" variant="ghost" onPress={() => setAdding(true)} />
            )}
        </Card>
    );
}

function DangerZone() {
    const { logout } = useAuth();
    const navigation = useStackNavigation();
    const [confirming, setConfirming] = useState(false);
    const mutation = useMutation({
        mutationFn: () => api.user.deleteAccount(),
        onSuccess: async () => {
            await logout().catch(() => undefined);
            navigation.navigate("Tabs", { screen: "Home" });
        },
    });

    return (
        <Card title="Supprimer mon compte" danger>
            <Text style={ui.muted}>Cette action est définitive. Un compte avec des commandes ne peut pas être supprimé.</Text>
            <ErrorText message={mutation.error ? errorMessage(mutation.error) : null} />
            {confirming ? (
                <View style={ui.row}>
                    <View style={{ flex: 1 }}><Button title="Confirmer la suppression" variant="danger" disabled={mutation.isPending} onPress={() => mutation.mutate()} /></View>
                    <Button title="Annuler" variant="ghost" onPress={() => setConfirming(false)} />
                </View>
            ) : (
                <Button title="Supprimer mon compte" variant="danger" onPress={() => setConfirming(true)} />
            )}
        </Card>
    );
}

export function ProfileScreen() {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={[ui.content, { gap: 16 }]} keyboardShouldPersistTaps="handled">
                <ProfileForm user={user} />
                <PasswordForm />
                <Addresses />
                <DangerZone />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
