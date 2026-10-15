import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../../lib/api.ts";
import { ErrorBox, Pagination, Spinner, Stars } from "../../components/ui.tsx";

export function AdminShopsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "shops", page],
        queryFn: () => api.admin.shops({ page, limit: 20 }),
        placeholderData: keepPreviousData,
    });

    const remove = useMutation({
        mutationFn: (id: string) => api.admin.deleteShop(id),
        onSuccess: () => {
            setConfirmDelete(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "shops"] });
        },
    });

    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-6">
            <p className="text-sm text-stone-500">Les boutiques les moins bien notées apparaissent en premier.</p>
            {remove.error && <ErrorBox>{errorMessage(remove.error)}</ErrorBox>}
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Boutique</th>
                            <th className="px-4 py-3 font-medium">Marchand</th>
                            <th className="px-4 py-3 font-medium">Note</th>
                            <th className="px-4 py-3 font-medium">Produits / commandes</th>
                            <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                        {data?.data.map((shop) => (
                            <tr key={shop.id}>
                                <td className="px-4 py-3">
                                    <Link to={`/shops/${shop.id}`} className="font-medium hover:underline">{shop.name}</Link>
                                    {shop.address && <p className="text-stone-500">{shop.address.postalCode} {shop.address.addressLocality}</p>}
                                </td>
                                <td className="px-4 py-3 text-stone-600">{shop.merchant.email}</td>
                                <td className="px-4 py-3"><Stars value={shop.averageRating} count={shop.reviewCount} /></td>
                                <td className="px-4 py-3 text-stone-600">{shop._count.products} / {shop._count.orders}</td>
                                <td className="px-4 py-3 text-right">
                                    {confirmDelete === shop.id ? (
                                        <span className="inline-flex gap-2">
                                            <button className="btn-danger py-1" onClick={() => remove.mutate(shop.id)}>Confirmer</button>
                                            <button className="btn-ghost py-1" onClick={() => setConfirmDelete(null)}>Annuler</button>
                                        </span>
                                    ) : (
                                        <button className="btn-danger py-1" onClick={() => setConfirmDelete(shop.id)}>Supprimer</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination pagination={data?.pagination} onChange={setPage} />
        </div>
    );
}
