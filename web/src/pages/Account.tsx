import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Trash2 } from "lucide-react";
import type { UpdateProfileInput, User } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { ME_QUERY_KEY, useAuth } from "../lib/auth.tsx";
import { AddressFields, emptyAddress, type AddressValue } from "../components/AddressFields.tsx";
import { ErrorBox, Field, PageHeader, SuccessBox } from "../components/ui.tsx";

const ROLE_LABELS = { USER: "Client", MERCHANT: "Commerçant", ADMIN: "Administrateur" } as const;

export function AccountPage() {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <>
            <PageHeader title="Mon compte" subtitle={`@${user.username} · ${ROLE_LABELS[user.role]}`} />
            <div className="grid gap-8 lg:grid-cols-2">
                <ProfileForm user={user} />
                <div className="space-y-8">
                    <PasswordForm />
                    <Addresses />
                    <DangerZone />
                </div>
            </div>
        </>
    );
}

function ProfileForm({ user }: { user: User }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<UpdateProfileInput>({
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
    });

    const mutation = useMutation({
        mutationFn: () => api.user.updateProfile({ ...form, avatarUrl: form.avatarUrl || null }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <form onSubmit={onSubmit} className="card h-fit space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Profil</h2>
            <p className="text-sm text-stone-500">{user.email}</p>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom">
                    <input className="input" required value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
                </Field>
                <Field label="Nom">
                    <input className="input" required value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
                </Field>
                <Field label="Pseudo">
                    <input className="input" required minLength={3} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </Field>
                <Field label="Téléphone">
                    <input className="input" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
            </div>
            <Field label="Photo de profil (URL)">
                <input className="input" type="url" value={form.avatarUrl ?? ""} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
            </Field>
            {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
            {mutation.isSuccess && <SuccessBox>Profil mis à jour.</SuccessBox>}
            <button className="btn-primary" disabled={mutation.isPending}>Enregistrer</button>
        </form>
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

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    return (
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Mot de passe</h2>
            <Field label="Mot de passe actuel">
                <input className="input" type="password" required autoComplete="current-password" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} />
            </Field>
            <Field label="Nouveau mot de passe" hint="8 caractères minimum">
                <input className="input" type="password" required minLength={8} autoComplete="new-password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} />
            </Field>
            {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
            {mutation.isSuccess && <SuccessBox>Mot de passe modifié.</SuccessBox>}
            <button className="btn-primary" disabled={mutation.isPending}>Changer le mot de passe</button>
        </form>
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

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        create.mutate();
    };

    return (
        <section className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Adresses de livraison</h2>
                {!adding && <button className="btn-ghost" onClick={() => setAdding(true)}>Ajouter</button>}
            </div>
            {data?.length ? (
                <ul className="divide-y divide-stone-200">
                    {data.map((a) => (
                        <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                            <MapPin className="size-4 shrink-0 text-brand-700" aria-hidden />
                            <span className="flex-1">{a.streetAddress}, {a.postalCode} {a.addressLocality}</span>
                            <button className="p-1 text-stone-400 hover:text-red-600" aria-label="Supprimer l'adresse" onClick={() => remove.mutate(a.id)}>
                                <Trash2 className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                !adding && <p className="text-sm text-stone-500">Aucune adresse enregistrée.</p>
            )}
            {adding && (
                <form onSubmit={onSubmit} className="space-y-4 border-t border-stone-200 pt-4">
                    <AddressFields value={address} onChange={setAddress} />
                    {create.error && <ErrorBox>{errorMessage(create.error)}</ErrorBox>}
                    <div className="flex gap-2">
                        <button className="btn-primary" disabled={create.isPending}>Enregistrer</button>
                        <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Annuler</button>
                    </div>
                </form>
            )}
        </section>
    );
}

function DangerZone() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);

    const mutation = useMutation({
        mutationFn: () => api.user.deleteAccount(),
        onSuccess: async () => {
            await logout().catch(() => undefined);
            queryClient.setQueryData(ME_QUERY_KEY, null);
            navigate("/");
        },
    });

    return (
        <section className="card space-y-3 border-red-200 p-6">
            <h2 className="font-display text-xl font-semibold text-red-800">Supprimer mon compte</h2>
            <p className="text-sm text-stone-600">Cette action est définitive. Un compte avec des commandes ne peut pas être supprimé.</p>
            {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
            {confirming ? (
                <div className="flex gap-2">
                    <button className="btn-danger" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Confirmer la suppression</button>
                    <button className="btn-ghost" onClick={() => setConfirming(false)}>Annuler</button>
                </div>
            ) : (
                <button className="btn-danger" onClick={() => setConfirming(true)}>Supprimer mon compte</button>
            )}
        </section>
    );
}
