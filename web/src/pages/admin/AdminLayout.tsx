import { NavLink, Outlet } from "react-router";

const tabClass = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-1 pb-3 text-sm font-medium transition ${isActive ? "border-brand-700 text-brand-800" : "border-transparent text-stone-500 hover:text-stone-800"}`;

export function AdminLayout() {
    return (
        <>
            <h1 className="mb-6 font-display text-3xl font-semibold">Administration</h1>
            <nav className="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-stone-200" aria-label="Administration">
                <NavLink to="/admin" end className={tabClass}>Tableau de bord</NavLink>
                <NavLink to="/admin/users" className={tabClass}>Utilisateurs</NavLink>
                <NavLink to="/admin/shops" className={tabClass}>Boutiques</NavLink>
                <NavLink to="/admin/reviews" className={tabClass}>Avis</NavLink>
                <NavLink to="/admin/orders" className={tabClass}>Commandes</NavLink>
            </nav>
            <Outlet />
        </>
    );
}
