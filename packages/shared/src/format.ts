import type { DeliveryMethod, OrderStatus, PaymentMethod } from "./types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: "En attente",
    PAID: "Payée",
    PREPARING: "En préparation",
    SHIPPED: "Expédiée / prête",
    DELIVERED: "Livrée / retirée",
    CANCELLED: "Annulée",
    RETURNED: "Retournée",
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["PAID", "PREPARING", "CANCELLED"],
    PAID: ["PREPARING", "CANCELLED"],
    PREPARING: ["SHIPPED", "DELIVERED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["RETURNED"],
    CANCELLED: [],
    RETURNED: [],
};

export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "PAID"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CARD: "Carte bancaire",
    PAYPAL: "PayPal",
    BANK_TRANSFER: "Virement",
    ON_SITE: "Sur place",
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
    PICKUP: "Click & collect",
    DELIVERY: "Livraison",
};

export const formatPrice = (value: string | number): string =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value));

export const formatDate = (value: string): string =>
    new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
