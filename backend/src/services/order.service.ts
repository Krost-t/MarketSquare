import type { OrderStatus } from "../generated/client.ts";

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["PAID", "PREPARING", "CANCELLED"],
    PAID: ["PREPARING", "CANCELLED"],
    PREPARING: ["SHIPPED", "DELIVERED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["RETURNED"],
    CANCELLED: [],
    RETURNED: [],
};

const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "PAID"];

const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
    ORDER_STATUS_TRANSITIONS[from].includes(to);

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: "en attente",
    PAID: "payée",
    PREPARING: "en préparation",
    SHIPPED: "expédiée / prête",
    DELIVERED: "livrée / retirée",
    CANCELLED: "annulée",
    RETURNED: "retournée",
};

export { ORDER_STATUS_TRANSITIONS, CUSTOMER_CANCELLABLE_STATUSES, ORDER_STATUS_LABELS, canTransition };
