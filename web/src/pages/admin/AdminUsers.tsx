import { useState, type FormEvent } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { formatDate, type Role } from "@marketsquare/shared";
import { api, errorMessage } from "../../lib/api.ts";
import { useAuth } from "../../lib/auth.tsx";
import { ErrorBox, Pagination, Spinner } from "../../components/ui.tsx";

const ROLES: Role[] = ["USER", "MERCHANT", "ADMIN"];

export function AdminUsersPage() {
    const { user: me } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [role, setRole] = useState<Role | "">("");
    const [page, setPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "users", query, role, page],
        queryFn: () => api.admin.users({ page, limit: 20, search: query || undefined, ...(role && { role }) }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    const updateRole = useMutation({ mutationFn: ({ id, next }: { id: string; next: Role }) => api.admin.updateRole(id, next), onSuccess: invalidate });
    const remove = useMutation({
        mutationFn: (id: string) => api.admin.deleteUser(id),
        onSuccess: () => {
            setConfirmDelete(null);
            invalidate();
        },
    });

    const onSearch = (event: FormEvent) => {
        event.preventDefault();
        setPage(1);
        setQuery(search);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={onSearch} className="flex flex-wrap gap-2">
                <input className="input max-w-xs" placeholder="Email, pseudo, nom…" aria-label="Rechercher un utilisateur"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="input w-auto" aria-label="Filtrer par rôle" value={role}
                    onChange={(e) => {
                        setRole(e.target.value as Role | "");
                        setPage(1);
                    }}>
                    <option value="">Tous les rôles</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="btn-primary">Rechercher</button>
            </form>

            {(updateRole.error || remove.error) && <ErrorBox>{errorMessage(updateRole.error ?? remove.error)}</ErrorBox>}

            {isLoading ? (
                <Spinner />
            ) : (
                <div className="card overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                            <tr>
                                <th className="px-4 py-3 font-medium">Utilisateur</th>
                                <th className="px-4 py-3 font-medium">Inscription</th>
                                <th className="px-4 py-3 font-medium">Rôle</th>
                                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                            {data?.data.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{user.firstname} {user.lastname} <span className="text-stone-400">@{user.username}</span></p>
                                        <p className="text-stone-500">{user.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-stone-500">{formatDate(user.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <select className="input w-auto py-1" aria-label={`Rôle de ${user.email}`} value={user.role}
                                            disabled={user.id === me?.id}
                                            onChange={(e) => updateRole.mutate({ id: user.id, next: e.target.value as Role })}>
                                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {user.id !== me?.id && (
                                            confirmDelete === user.id ? (
                                                <span className="inline-flex gap-2">
                                                    <button className="btn-danger py-1" onClick={() => remove.mutate(user.id)}>Confirmer</button>
                                                    <button className="btn-ghost py-1" onClick={() => setConfirmDelete(null)}>Annuler</button>
                                                </span>
                                            ) : (
                                                <button className="p-2 text-stone-400 hover:text-red-600" aria-label={`Supprimer ${user.email}`}
                                                    onClick={() => setConfirmDelete(user.id)}>
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pagination pagination={data?.pagination} onChange={setPage} />
        </div>
    );
}
