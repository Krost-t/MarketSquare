import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Basket, CaretDown, ForkKnife, List as MenuIcon, ListChecks, MapTrifold, SignOut, Storefront, User, X } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth.tsx";
import { useCart } from "../lib/cart.ts";
import { useGeo } from "../lib/geo.tsx";
import { LocationPicker } from "./LocationPicker.tsx";

const navClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 rounded-[var(--radius-ui)] px-3 py-2 text-sm font-medium transition ${
        isActive ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
    }`;

const NAV_LINKS = [
    { to: "/carte", label: "Carte", icon: MapTrifold },
    { to: "/liste", label: "Ma liste", icon: ListChecks },
    { to: "/repas", label: "Repas", icon: ForkKnife },
    { to: "/shops", label: "Boutiques", icon: Storefront },
];

function Wordmark() {
    return (
        <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white">
            <span aria-hidden className="grid size-6 place-items-center rounded-md bg-ink-900 dark:bg-white">
                <span className="size-2.5 rounded-[2px] bg-tomato-500" />
            </span>
            MarketSquare
        </Link>
    );
}

function LocationButton() {
    const { position } = useGeo();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    return (
        <div ref={ref} className="relative min-w-0">
            <button
                className="flex max-w-[16rem] items-center gap-1.5 truncate rounded-[var(--radius-ui)] px-2.5 py-1.5 text-sm text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-label="Changer de position"
            >
                <span className="truncate">{position ? position.label : "Choisir une position"}</span>
                <CaretDown size={14} className="shrink-0" aria-hidden />
            </button>
            {open && (
                <div className="absolute left-0 top-full z-[1100] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border border-ink-200 bg-white p-4 shadow-xl shadow-ink-900/10 dark:border-ink-700 dark:bg-ink-900">
                    <LocationPicker compact onDone={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}

export function Layout() {
    const { user, logout } = useAuth();
    const { data: cart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const isMapPage = location.pathname === "/carte";

    useEffect(() => setOpen(false), [location.pathname]);

    const accountLinks = [
        ...(user ? [{ to: "/orders", label: "Commandes" }, { to: "/favorites", label: "Favoris" }, { to: "/account", label: "Compte" }] : []),
        ...(user?.role === "MERCHANT" || user?.role === "ADMIN" ? [{ to: "/merchant", label: "Espace marchand" }] : []),
        ...(user?.role === "ADMIN" ? [{ to: "/admin", label: "Administration" }] : []),
    ];

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className={`flex flex-col ${isMapPage ? "h-dvh" : "min-h-dvh"}`}>
            <header className="sticky top-0 z-[1000] border-b border-ink-200 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
                <div className="flex h-14 items-center gap-3 px-4">
                    <Wordmark />
                    <span aria-hidden className="hidden h-5 w-px bg-ink-200 sm:block dark:bg-ink-700" />
                    <div className="hidden sm:block"><LocationButton /></div>

                    <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
                        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                            <NavLink key={to} to={to} className={navClass}>
                                <Icon size={17} aria-hidden />
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-1 lg:ml-2">
                        {user && (
                            <Link to="/cart" className="btn-ghost relative px-3" aria-label={`Panier, ${cart?.itemCount ?? 0} article(s)`}>
                                <Basket size={18} aria-hidden />
                                {cart && cart.itemCount > 0 && <span className="num text-xs font-semibold">{cart.itemCount}</span>}
                            </Link>
                        )}
                        {user ? (
                            <div className="hidden items-center gap-1 lg:flex">
                                {accountLinks.map((link) => (
                                    <NavLink key={link.to} to={link.to} className={navClass}>{link.label}</NavLink>
                                ))}
                                <button onClick={handleLogout} className="btn-ghost px-3" aria-label="Se déconnecter">
                                    <SignOut size={18} aria-hidden />
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="btn-primary">
                                <User size={16} aria-hidden /> Connexion
                            </Link>
                        )}
                        <button className="btn-ghost px-3 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
                            {open ? <X size={18} /> : <MenuIcon size={18} />}
                        </button>
                    </div>
                </div>

                {open && (
                    <nav className="space-y-3 border-t border-ink-200 px-4 py-4 lg:hidden dark:border-ink-800" aria-label="Navigation mobile">
                        <div className="sm:hidden"><LocationPicker compact /></div>
                        <div className="grid grid-cols-2 gap-1">
                            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                                <NavLink key={to} to={to} className={navClass}>
                                    <Icon size={17} aria-hidden />
                                    {label}
                                </NavLink>
                            ))}
                            {accountLinks.map((link) => (
                                <NavLink key={link.to} to={link.to} className={navClass}>{link.label}</NavLink>
                            ))}
                        </div>
                        {user && (
                            <button onClick={handleLogout} className="btn-danger w-full">
                                <SignOut size={16} aria-hidden /> Se déconnecter
                            </button>
                        )}
                    </nav>
                )}
            </header>

            <main className={isMapPage ? "min-h-0 flex-1" : "mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10"}>
                <Outlet />
            </main>
        </div>
    );
}
