import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../lib/api.ts";
import { ErrorBox, Field, SuccessBox } from "../../components/ui.tsx";

export function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const mutation = useMutation({ mutationFn: () => api.auth.forgotPassword(email) });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        mutation.mutate();
    };

    const devLink = mutation.data?.token && mutation.data.userId
        ? `/reset-password?userId=${mutation.data.userId}&token=${encodeURIComponent(mutation.data.token)}`
        : null;

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-display text-3xl font-semibold">Mot de passe oublié</h1>
            <p className="mb-8 text-stone-600">Indiquez votre email, nous vous enverrons un lien de réinitialisation.</p>
            <form onSubmit={onSubmit} className="card space-y-4 p-6">
                <Field label="Email">
                    <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                {mutation.error && <ErrorBox>{errorMessage(mutation.error)}</ErrorBox>}
                {mutation.isSuccess && (
                    <SuccessBox>
                        Si un compte correspond à cet email, un lien vient d’être envoyé.
                        {devLink && (
                            <span className="mt-2 block">
                                Mode développement : <Link to={devLink} className="font-medium underline">réinitialiser maintenant</Link>
                            </span>
                        )}
                    </SuccessBox>
                )}
                <button className="btn-primary w-full" disabled={mutation.isPending}>Envoyer le lien</button>
            </form>
        </div>
    );
}
