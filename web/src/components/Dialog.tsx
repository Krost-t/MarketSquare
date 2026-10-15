import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

export function Dialog({ open, onClose, title, children, wide = false }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    wide?: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={(event) => event.target === ref.current && onClose()}
            className={`m-auto max-h-[90dvh] w-[calc(100vw-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white p-0 text-ink-800 shadow-2xl backdrop:bg-ink-950/50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100`}
        >
            {open && (
                <div className="flex max-h-[90dvh] flex-col">
                    <div className="flex items-center justify-between gap-4 border-b border-ink-200 px-5 py-3.5 dark:border-ink-800">
                        <h2 className="truncate text-base font-semibold">{title}</h2>
                        <button onClick={onClose} className="rounded-md p-1 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Fermer">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
                </div>
            )}
        </dialog>
    );
}
