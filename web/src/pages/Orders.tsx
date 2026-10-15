import { useState } from "react";
import { Link, useLocation } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { DELIVERY_METHOD_LABELS, formatDate, formatPrice } from "@marketsquare/shared";
import { api } from "../lib/api.ts";
import { EmptyState, PageHeader, Pagination, Spinner, StatusBadge, SuccessBox } from "../components/ui.tsx";

export function OrdersPage() {
    const location = useLocation();
    const created = (location.state as { created?: number } | null)?.created;
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["orders", page],
        queryFn: () => api.orders.list({ page, limit: 10 }),
        placeholderData: keepPreviousData,
    });

    return (
        <>
            <PageHeader title="Mes commandes" />
            {created && <div className="mb-6"><SuccessBox>Merci ! {created} commande(s) envoyée(s) aux commerçants.</SuccessBox></div>}

            {isLoading ? (
                <Spinner />
            ) : data?.data.length ? (
                <>
                    <ul className="space-y-3">
                        {data.data.map((order) => (
                            <li key={order.id}>
                                <Link to={`/orders/${order.id}`}
                                    className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-brand-200 hover:shadow-sm">
                                    <div>
                                        <p className="font-medium">{order.shop?.name ?? "Boutique supprimée"}</p>
                                        <p className="text-sm text-stone-500">
                                            {formatDate(order.createdAt)} · {DELIVERY_METHOD_LABELS[order.deliveryMethod]} · {order.items.length} article(s)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={order.status} />
                                        <span className="w-24 text-right font-semibold">{formatPrice(order.totalAmount)}</span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Pagination pagination={data.pagination} onChange={setPage} />
                </>
            ) : (
                <EmptyState icon={<Receipt className="size-10" />} title="Aucune commande">
                    Vos commandes apparaîtront ici.
                </EmptyState>
            )}
        </>
    );
}
