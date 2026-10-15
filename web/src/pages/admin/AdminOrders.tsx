import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DELIVERY_METHOD_LABELS, formatDate, formatPrice } from "@marketsquare/shared";
import { api } from "../../lib/api.ts";
import { Pagination, Spinner, StatusBadge } from "../../components/ui.tsx";

export function AdminOrdersPage() {
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "orders", page],
        queryFn: () => api.admin.orders({ page, limit: 20 }),
        placeholderData: keepPreviousData,
    });

    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-6">
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Client</th>
                            <th className="px-4 py-3 font-medium">Boutique</th>
                            <th className="px-4 py-3 font-medium">Mode</th>
                            <th className="px-4 py-3 font-medium">Statut</th>
                            <th className="px-4 py-3 text-right font-medium">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                        {data?.data.map((order) => (
                            <tr key={order.id}>
                                <td className="px-4 py-3">
                                    <Link to={`/orders/${order.id}`} className="hover:underline">{formatDate(order.createdAt)}</Link>
                                </td>
                                <td className="px-4 py-3 text-stone-600">{order.customer?.email}</td>
                                <td className="px-4 py-3">{order.shop?.name ?? "—"}</td>
                                <td className="px-4 py-3 text-stone-600">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</td>
                                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                                <td className="px-4 py-3 text-right font-medium">{formatPrice(order.totalAmount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination pagination={data?.pagination} onChange={setPage} />
        </div>
    );
}
