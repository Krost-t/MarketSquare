import { NavLink, Outlet } from "react-router";

const tabClass = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-1 pb-3 text-sm font-medium transition ${isActive ? "border-brand-700 text-brand-800" : "border-transparent text-stone-500 hover:text-stone-800"}`;

export function MerchantLayout() {
    return (
        <>
            <h1 className="mb-6 font-display text-3xl font-semibold">Espace marchand</h1>
            <nav className="mb-8 flex gap-6 border-b border-stone-200" aria-label="Espace marchand">
                <NavLink to="/merchant" end className={tabClass}>Ma boutique</NavLink>
                <NavLink to="/merchant/products" className={tabClass}>Produits</NavLink>
                <NavLink to="/merchant/orders" className={tabClass}>Commandes</NavLink>
            </nav>
            <Outlet />
        </>
    );
}
