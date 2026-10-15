import { useState } from "react";
import { Link } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import {
    DELIVERY_METHOD_LABELS,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_TRANSITIONS,
    PAYMENT_METHOD_LABELS,
    formatDate,
    formatPrice,
    type OrderStatus,
} from "@marketsquare/shared";
import { api, errorMessage } from "../../lib/api.ts";
import { EmptyState, ErrorBox, Pagination, Spinner, StatusBadge } from "../../components/ui.tsx";

const FILTERS: (OrderStatus | "")[] = ["", "PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

export function MerchantOrdersPage() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<OrderStatus | "">("");
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useQuery({
        queryKey: ["shop-orders", status, page],
        queryFn: () => api.orders.shopOrders({ page, limit: 10, ...(status && { status }) }),
        placeholderData: keepPreviousData,
    });

    const update = useMutation({
        mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => api.orders.updateStatus(id, next),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-orders"] }),
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
                {FILTERS.map((filter) => (
                    <button key={filter || "all"}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${status === filter ? "bg-brand-700 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`}
                        aria-pressed={status === filter}
                        onClick={() => {
                            setStatus(filter);
                            setPage(1);
                        }}>
                        {filter ? ORDER_STATUS_LABELS[filter] : "Toutes"}
                    </button>
                ))}
            </div>

            {error && <ErrorBox>{errorMessage(error)}</ErrorBox>}
            {update.error && <ErrorBox>{errorMessage(update.error)}</ErrorBox>}

            {isLoading ? (
                <Spinner />
            ) : data?.data.length ? (
                <>
                    <ul className="space-y-4">
                        {data.data.map((order) => (
                            <li key={order.id} className="card p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <Link to={`/orders/${order.id}`} className="font-medium hover:underline">
                                            {order.customer?.firstname} {order.customer?.lastname}
                                        </Link>
                                        <p className="text-sm text-stone-500">
                                            {formatDate(order.createdAt)} · {DELIVERY_METHOD_LABELS[order.deliveryMethod]} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                                        </p>
                                        {order.deliveryMethod === "DELIVERY" && (
                                            <p className="text-sm text-stone-500">{order.shippingStreet}, {order.shippingPostalCode} {order.shippingLocality}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={order.status} />
                                        <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                                    </div>
                                </div>
                                <ul className="mt-3 text-sm text-stone-700">
                                    {order.items.map((item) => (
                                        <li key={item.id}>{item.quantity} × {item.productName}</li>
                                    ))}
                                </ul>
                                {ORDER_STATUS_TRANSITIONS[order.status].length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
                                        {ORDER_STATUS_TRANSITIONS[order.status].map((next) => (
                                            <button key={next} disabled={update.isPending}
                                                className={next === "CANCELLED" || next === "RETURNED" ? "btn-danger" : "btn-ghost"}
                                                onClick={() => update.mutate({ id: order.id, next })}>
                                                {ORDER_STATUS_LABELS[next]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    <Pagination pagination={data.pagination} onChange={setPage} />
                </>
            ) : (
                <EmptyState icon={<Receipt className="size-10" />} title="Aucune commande" />
            )}
        </div>
    );
}
