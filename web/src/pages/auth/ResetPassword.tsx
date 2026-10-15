import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../lib/api.ts";
import { ErrorBox, Field, SuccessBox } from "../../components/ui.tsx";

export function ResetPasswordPage() {
    const [params] = useSearchParams();
    const userId = params.get("userId") ?? "";
    const token = params.get("token") ?? "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const mutation = useMutation({ mutationFn: () => api.auth.resetPassword(userId, token, password) });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (password !== confirm) return;
        mutation.mutate();
    };

    if (!userId || !token) {
        return <ErrorBox>Lien de réinitialisation invalide.</ErrorBox>;
    }

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-8 font-display text-3xl font-semibold">Nouveau mot de passe</h1>
            {mutation.isSuccess ? (
                <SuccessBox>
                    Mot de passe modifié. <Link to="/login" className="font-medium underline">Se connecter</Link>
                </SuccessBox>
            ) : (
                <form onSubmit={onSubmit} className="card space-y-4 p-6">
                    <Field label="Nouveau mot de passe" hint="8 caractères minimum">
                        <input className="input" type="password" minLength={8} required autoComplete="new-password"
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Field>
                    <Field label="Confirmation">
                        <input className="input" type="password" required autoComplete="new-password"
                            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </Field>
                    {confirm && password !== confirm && <ErrorBox>Les mots de passe ne correspondent pas.</ErrorBox>}
                    {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
                    <button className="btn-primary w-full" disabled={mutation.isPending}>Valider</button>
                </form>
            )}
        </div>
    );
}
