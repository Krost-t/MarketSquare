import type { ReactNode } from "react";
import { Basket, Star } from "@phosphor-icons/react";
import { ORDER_STATUS_LABELS, type OrderStatus, type Pagination as PaginationData } from "@marketsquare/shared";

export function Skeleton({ className = "" }: { className?: string }) {
    return <div aria-hidden className={`animate-pulse rounded-[var(--radius-ui)] bg-ink-200/70 motion-reduce:animate-none dark:bg-ink-800 ${className}`} />;
}

export function Spinner({ label = "Chargement" }: { label?: string }) {
    return (
        <div role="status" className="space-y-3 py-6">
            <span className="sr-only">{label}</span>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}

export function ErrorBox({ children }: { children: ReactNode }) {
    if (!children) return null;
    return (
        <div role="alert" className="rounded-[var(--radius-ui)] border border-tomato-200 bg-tomato-50 px-3.5 py-2.5 text-sm text-tomato-700 dark:border-tomato-700/50 dark:bg-tomato-700/15 dark:text-tomato-200">
            {children}
        </div>
    );
}

export function SuccessBox({ children }: { children: ReactNode }) {
    if (!children) return null;
    return (
        <div role="status" className="rounded-[var(--radius-ui)] border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100">
            {children}
        </div>
    );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-2 rounded-[var(--radius-panel)] border border-dashed border-ink-300 px-6 py-10 dark:border-ink-700">
            {icon && <div className="mb-1 text-ink-400">{icon}</div>}
            <h3 className="text-base font-semibold">{title}</h3>
            {children && <div className="max-w-[60ch] text-sm text-ink-500 dark:text-ink-400">{children}</div>}
        </div>
    );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-ink-500 dark:text-ink-400">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function Stars({ value, count, size = "sm" }: { value: number | string; count?: number; size?: "sm" | "md" }) {
    const rating = Number(value);
    const iconSize = size === "sm" ? 13 : 17;
    return (
        <span className="inline-flex items-center gap-1" aria-label={`Note : ${rating.toFixed(1)} sur 5`}>
            <Star size={iconSize} weight="fill" className="text-ink-900 dark:text-white" aria-hidden />
            <span className={`num ${size === "sm" ? "text-xs" : "text-sm"} font-medium`}>{rating.toFixed(1)}</span>
            {count !== undefined && <span className="num text-xs text-ink-400">({count})</span>}
        </span>
    );
}

export function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    return (
        <div className="flex gap-1" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((i) => (
                <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={value === i}
                    aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                    onClick={() => onChange(i)}
                    className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-tomato-500"
                >
                    <Star size={24} weight={i <= value ? "fill" : "regular"} className={i <= value ? "text-tomato-500" : "text-ink-300"} />
                </button>
            ))}
        </div>
    );
}

const STATUS_STYLES: Record<OrderStatus, string> = {
    PENDING: "bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100",
    PAID: "bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100",
    PREPARING: "bg-tomato-100 text-tomato-700 dark:bg-tomato-700/25 dark:text-tomato-200",
    SHIPPED: "bg-tomato-100 text-tomato-700 dark:bg-tomato-700/25 dark:text-tomato-200",
    DELIVERED: "bg-ink-900 text-white dark:bg-white dark:text-ink-900",
    CANCELLED: "bg-transparent text-ink-400 line-through",
    RETURNED: "bg-transparent text-ink-400",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
            {ORDER_STATUS_LABELS[status]}
        </span>
    );
}

export function Pagination({ pagination, onChange }: { pagination?: PaginationData; onChange: (page: number) => void }) {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { page, totalPages } = pagination;
    return (
        <nav className="mt-8 flex items-center gap-3" aria-label="Pagination">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Précédent</button>
            <span className="num text-sm text-ink-500">{page} / {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Suivant</button>
        </nav>
    );
}

export function Thumb({ src, alt, className = "", contain = false }: { src: string | null | undefined; alt: string; className?: string; contain?: boolean }) {
    if (!src) {
        return (
            <div className={`flex items-center justify-center bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600 ${className}`}>
                <Basket size={28} weight="duotone" aria-hidden />
                <span className="sr-only">{alt}</span>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`${contain ? "bg-white object-contain p-3 dark:bg-ink-100" : "object-cover"} ${className}`}
        />
    );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
    return (
        <label className="block">
            <span className="label">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
        </label>
    );
}
