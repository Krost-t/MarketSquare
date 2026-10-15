import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Gender, RegisterInput } from "@marketsquare/shared";
import { useAuth } from "../../lib/auth.tsx";
import { errorMessage } from "../../lib/api.ts";
import { ErrorBox, Field } from "../../components/ui.tsx";

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [form, setForm] = useState<RegisterInput>({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
        gender: "OTHER",
        role: params.get("merchant") ? "MERCHANT" : "USER",
    });
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    const set = <K extends keyof RegisterInput>(key: K, value: RegisterInput[K]) => setForm({ ...form, [key]: value });

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError("");
        setPending(true);
        try {
            const user = await register(form);
            navigate(user.role === "MERCHANT" ? "/merchant" : "/", { replace: true });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="mx-auto max-w-xl">
            <h1 className="mb-2 font-display text-3xl font-semibold">Créer un compte</h1>
            <p className="mb-8 text-stone-600">
                Déjà inscrit ? <Link to="/login" className="font-medium text-brand-700 hover:underline">Connectez-vous</Link>
            </p>

            <form onSubmit={onSubmit} className="card space-y-5 p-6">
                <fieldset>
                    <legend className="label">Type de compte</legend>
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { value: "USER", title: "Client", text: "Je commande chez mes commerçants" },
                            { value: "MERCHANT", title: "Commerçant", text: "Je vends mes produits" },
                        ] as const).map((option) => (
                            <label key={option.value}
                                className={`cursor-pointer rounded-xl border p-4 transition ${form.role === option.value ? "border-brand-600 bg-brand-50" : "border-stone-200 hover:border-stone-300"}`}>
                                <input type="radio" name="role" className="sr-only" checked={form.role === option.value}
                                    onChange={() => set("role", option.value)} />
                                <span className="block font-medium">{option.title}</span>
                                <span className="text-xs text-stone-600">{option.text}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Prénom">
                        <input className="input" required autoComplete="given-name" value={form.firstname} onChange={(e) => set("firstname", e.target.value)} />
                    </Field>
                    <Field label="Nom">
                        <input className="input" required autoComplete="family-name" value={form.lastname} onChange={(e) => set("lastname", e.target.value)} />
                    </Field>
                    <Field label="Date de naissance">
                        <input className="input" type="date" required value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                    </Field>
                    <Field label="Genre">
                        <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                            <option value="FEMALE">Femme</option>
                            <option value="MALE">Homme</option>
                            <option value="OTHER">Autre / ne pas préciser</option>
                        </select>
                    </Field>
                    <Field label="Téléphone">
                        <input className="input" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    </Field>
                    <Field label="Email">
                        <input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    </Field>
                </div>
                <Field label="Mot de passe" hint="8 caractères minimum">
                    <input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password}
                        onChange={(e) => set("password", e.target.value)} />
                </Field>

                <ErrorBox>{error}</ErrorBox>
                <button className="btn-primary w-full" disabled={pending}>Créer mon compte</button>
            </form>
        </div>
    );
}
