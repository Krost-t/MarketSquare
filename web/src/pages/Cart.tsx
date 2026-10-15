import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import {
    DELIVERY_METHOD_LABELS,
    PAYMENT_METHOD_LABELS,
    formatPrice,
    type CartItem,
    type DeliveryMethod,
    type PaymentMethod,
} from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { CART_QUERY_KEY, useCart, useCartMutation } from "../lib/cart.ts";
import { EmptyState, ErrorBox, PageHeader, Spinner, Thumb } from "../components/ui.tsx";

export function CartPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: cart, isLoading } = useCart();
    const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api.addresses.list() });

    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ON_SITE");
    const [addressId, setAddressId] = useState("");

    const updateQuantity = useCartMutation(({ id, quantity }: { id: string; quantity: number }) => api.cart.update(id, quantity));
    const removeItem = useCartMutation((id: string) => api.cart.remove(id));

    const checkout = useMutation({
        mutationFn: () =>
            api.orders.checkout({
                deliveryMethod,
                paymentMethod,
                ...(deliveryMethod === "DELIVERY" && { addressId: addressId || addresses.data?.[0]?.id }),
            }),
        onSuccess: (orders) => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            navigate("/orders", { state: { created: orders.length } });
        },
    });

    if (isLoading) return <Spinner />;

    if (!cart || cart.items.length === 0) {
        return (
            <EmptyState icon={<ShoppingBasket className="size-10" />} title="Votre panier est vide">
                <Link to="/products" className="font-medium text-brand-700 hover:underline">Parcourir le catalogue</Link>
            </EmptyState>
        );
    }

    const byShop = cart.items.reduce<Record<string, { name: string; items: CartItem[] }>>((groups, item) => {
        const shopId = item.product.shopId;
        groups[shopId] ??= { name: item.product.shop?.name ?? "Boutique", items: [] };
        groups[shopId].items.push(item);
        return groups;
    }, {});

    const changeDelivery = (method: DeliveryMethod) => {
        setDeliveryMethod(method);
        if (method === "DELIVERY" && paymentMethod === "ON_SITE") setPaymentMethod("CARD");
    };

    const paymentOptions = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).filter(
        (method) => method !== "ON_SITE" || deliveryMethod === "PICKUP",
    );
    const needsAddress = deliveryMethod === "DELIVERY" && !addresses.data?.length;
    const shopCount = Object.keys(byShop).length;

    return (
        <>
            <PageHeader title="Mon panier" subtitle={`${cart.itemCount} article(s)`} />
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    {Object.entries(byShop).map(([shopId, group]) => (
                        <section key={shopId} className="card overflow-hidden">
                            <h2 className="border-b border-stone-200 bg-stone-50 px-5 py-3 text-sm font-semibold">
                                <Link to={`/shops/${shopId}`} className="hover:underline">{group.name}</Link>
                            </h2>
                            <ul className="divide-y divide-stone-200">
                                {group.items.map((item) => (
                                    <li key={item.id} className="flex items-center gap-4 p-4">
                                        <Thumb src={item.product.imageUrl} alt={item.product.name} className="size-16 shrink-0 rounded-lg" />
                                        <div className="min-w-0 flex-1">
                                            <Link to={`/products/${item.productId}`} className="font-medium hover:underline">{item.product.name}</Link>
                                            <p className="text-sm text-stone-500">{formatPrice(item.product.price)} / unité</p>
                                        </div>
                                        <div className="flex items-center rounded-lg border border-stone-300">
                                            <button className="p-2 disabled:opacity-40" aria-label="Diminuer" disabled={item.quantity <= 1}
                                                onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}>
                                                <Minus className="size-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button className="p-2 disabled:opacity-40" aria-label="Augmenter" disabled={item.quantity >= item.product.stock}
                                                onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}>
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>
                                        <p className="w-20 text-right font-semibold">{formatPrice(Number(item.product.price) * item.quantity)}</p>
                                        <button className="p-2 text-stone-400 hover:text-red-600" aria-label={`Retirer ${item.product.name}`}
                                            onClick={() => removeItem.mutate(item.id)}>
                                            <Trash2 className="size-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                    {(updateQuantity.error || removeItem.error) && <ErrorBox>{errorMessage(updateQuantity.error ?? removeItem.error)}</ErrorBox>}
                </div>

                <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-24">
                    <h2 className="font-display text-xl font-semibold">Finaliser</h2>

                    <fieldset className="space-y-2">
                        <legend className="label">Mode de retrait</legend>
                        {(Object.keys(DELIVERY_METHOD_LABELS) as DeliveryMethod[]).map((method) => (
                            <label key={method} className="flex items-center gap-2 text-sm">
                                <input type="radio" name="delivery" className="accent-brand-700" checked={deliveryMethod === method}
                                    onChange={() => changeDelivery(method)} />
                                {DELIVERY_METHOD_LABELS[method]}
                            </label>
                        ))}
                    </fieldset>

                    {deliveryMethod === "DELIVERY" && (
                        needsAddress ? (
                            <p className="text-sm text-amber-800">
                                Ajoutez une adresse dans <Link to="/account" className="font-medium underline">votre compte</Link> pour être livré.
                            </p>
                        ) : (
                            <label className="block">
                                <span className="label">Adresse de livraison</span>
                                <select className="input" value={addressId || addresses.data?.[0]?.id} onChange={(e) => setAddressId(e.target.value)}>
                                    {addresses.data?.map((address) => (
                                        <option key={address.id} value={address.id}>
                                            {address.streetAddress}, {address.postalCode} {address.addressLocality}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )
                    )}

                    <label className="block">
                        <span className="label">Paiement</span>
                        <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                            {paymentOptions.map((method) => (
                                <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>
                            ))}
                        </select>
                    </label>

                    <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                        <span className="text-stone-600">Total</span>
                        <span className="text-2xl font-semibold">{formatPrice(cart.total)}</span>
                    </div>
                    {shopCount > 1 && (
                        <p className="text-xs text-stone-500">Votre panier sera découpé en {shopCount} commandes, une par boutique.</p>
                    )}
                    {checkout.error && <ErrorBox>{errorMessage(checkout.error)}</ErrorBox>}
                    <button className="btn-primary w-full" disabled={checkout.isPending || needsAddress} onClick={() => checkout.mutate()}>
                        Commander
                    </button>
                </aside>
            </div>
        </>
    );
}
