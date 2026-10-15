import { Link } from "react-router";
import { EmptyState } from "../components/ui.tsx";

export function NotFoundPage() {
    return (
        <EmptyState title="Page introuvable">
            Cette page n’existe pas ou a été déplacée. <Link to="/" className="font-medium text-brand-700 hover:underline">Retour à l’accueil</Link>
        </EmptyState>
    );
}
