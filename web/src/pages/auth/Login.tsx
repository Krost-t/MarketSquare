import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../lib/auth.tsx";
import { errorMessage } from "../../lib/api.ts";
import { ErrorBox, Field } from "../../components/ui.tsx";

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError("");
        setPending(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-display text-3xl font-semibold">Connexion</h1>
            <p className="mb-8 text-stone-600">
                Pas encore de compte ? <Link to="/register" className="font-medium text-brand-700 hover:underline">Inscrivez-vous</Link>
            </p>
            <form onSubmit={onSubmit} className="card space-y-4 p-6">
                <Field label="Email">
                    <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Mot de passe">
                    <input className="input" type="password" autoComplete="current-password" required value={password}
                        onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <ErrorBox>{error}</ErrorBox>
                <button className="btn-primary w-full" disabled={pending}>Se connecter</button>
                <Link to="/forgot-password" className="block text-center text-sm text-stone-600 hover:underline">
                    Mot de passe oublié ?
                </Link>
            </form>
        </div>
    );
}
