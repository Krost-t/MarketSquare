import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CUSTOMER_CANCELLABLE_STATUSES,
    DELIVERY_METHOD_LABELS,
    PAYMENT_METHOD_LABELS,
    formatDate,
    formatPrice,
} from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";
import { ErrorBox, PageHeader, Spinner, StatusBadge, Thumb } from "../components/ui.tsx";

export function OrderDetailPage() {
    const { id = "" } = useParams();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: order, isLoading, error } = useQuery({ queryKey: ["order", id], queryFn: () => api.orders.get(id) });

    const cancel = useMutation({
        mutationFn: () => api.orders.cancel(id),
        onSuccess: (updated) => {
            queryClient.setQueryData(["order", id], updated);
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });

    if (isLoading) return <Spinner />;
    if (error || !order) return <ErrorBox>{errorMessage(error) || "Commande introuvable"}</ErrorBox>;

    const isCustomer = order.customerId === user?.id;
    const canCancel = isCustomer && CUSTOMER_CANCELLABLE_STATUSES.includes(order.status);

    return (
        <>
            <PageHeader
                title={`Commande du ${formatDate(order.createdAt)}`}
                subtitle={<>Chez {order.shop ? <Link to={`/shops/${order.shop.id}`} className="font-medium text-brand-700 hover:underline">{order.shop.name}</Link> : "une boutique supprimée"}</>}
                actions={canCancel && (
                    <button className="btn-danger" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Annuler la commande</button>
                )}
            />
            {cancel.error && <div className="mb-6"><ErrorBox>{errorMessage(cancel.error)}</ErrorBox></div>}

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                <ul className="card divide-y divide-stone-200">
                    {order.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 p-4">
                            <Thumb src={item.product?.imageUrl} alt={item.productName} className="size-14 shrink-0 rounded-lg" />
                            <div className="flex-1">
                                {item.productId ? (
                                    <Link to={`/products/${item.productId}`} className="font-medium hover:underline">{item.productName}</Link>
                                ) : (
                                    <span className="font-medium">{item.productName}</span>
                                )}
                                <p className="text-sm text-stone-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                            </div>
                            <span className="font-semibold">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
                        </li>
                    ))}
                    <li className="flex justify-between p-4 text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                    </li>
                </ul>

                <aside className="card h-fit space-y-4 p-6 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-stone-600">Statut</span>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-600">Mode</span>
                        <span className="font-medium">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-600">Paiement</span>
                        <span className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                    </div>
                    <div className="border-t border-stone-200 pt-4">
                        {order.deliveryMethod === "DELIVERY" ? (
                            <>
                                <p className="mb-1 font-medium">Adresse de livraison</p>
                                <p className="text-stone-600">{order.shippingStreet}<br />{order.shippingPostalCode} {order.shippingLocality}</p>
                            </>
                        ) : order.shop?.address ? (
                            <>
                                <p className="mb-1 font-medium">Retrait en boutique</p>
                                <p className="text-stone-600">{order.shop.address.streetAddress}<br />{order.shop.address.postalCode} {order.shop.address.addressLocality}</p>
                            </>
                        ) : (
                            <p className="font-medium">Retrait en boutique</p>
                        )}
                    </div>
                    {!isCustomer && order.customer && (
                        <div className="border-t border-stone-200 pt-4">
                            <p className="mb-1 font-medium">Client</p>
                            <p className="text-stone-600">{order.customer.firstname} {order.customer.lastname} · {order.customer.phone}</p>
                        </div>
                    )}
                </aside>
            </div>
        </>
    );
}
