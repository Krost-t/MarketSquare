import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@marketsquare/shared";
import { api, errorMessage } from "../../lib/api.ts";
import { ErrorBox, Spinner } from "../../components/ui.tsx";

export function AdminDashboardPage() {
    const { data, isLoading, error } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => api.admin.dashboard() });

    if (isLoading) return <Spinner />;
    if (error || !data) return <ErrorBox>{errorMessage(error)}</ErrorBox>;

    const tiles = [
        { label: "Utilisateurs", value: data.users },
        { label: "Commerçants", value: data.merchants },
        { label: "Boutiques", value: data.shops },
        { label: "Produits", value: data.products },
        { label: "Commandes", value: data.orders },
        { label: "Avis", value: data.reviews },
        { label: "Volume d’affaires", value: formatPrice(data.revenue) },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {tiles.map((tile) => (
                <div key={tile.label} className="card p-5">
                    <p className="text-sm text-stone-500">{tile.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{tile.value}</p>
                </div>
            ))}
        </div>
    );
}
