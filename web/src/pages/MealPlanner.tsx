import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowSquareOut, Basket, CaretLeft, CaretRight, ForkKnife, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { addDays, startOfWeek, toISODate, type MealPlanEntry, type MealSlot, type MealSummary } from "@marketsquare/shared";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";
import { Dialog } from "../components/Dialog.tsx";
import { EmptyState, ErrorBox, Skeleton, SuccessBox } from "../components/ui.tsx";

type Period = "day" | "week" | "month";

const SLOT_LABELS: Record<MealSlot, string> = { LUNCH: "Midi", DINNER: "Soir" };
const SLOTS: MealSlot[] = ["LUNCH", "DINNER"];

const CATEGORY_LABELS: Record<string, string> = {
    Beef: "Bœuf",
    Chicken: "Poulet",
    Dessert: "Desserts",
    Lamb: "Agneau",
    Miscellaneous: "Divers",
    Pasta: "Pâtes",
    Pork: "Porc",
    Seafood: "Poisson",
    Side: "Accompagnements",
    Starter: "Entrées",
    Vegan: "Vegan",
    Vegetarian: "Végétarien",
    Breakfast: "Petit-déjeuner",
    Goat: "Chèvre",
};

const dayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric" });
const longFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

const rangeFor = (period: Period, anchor: Date): { from: Date; days: Date[] } => {
    if (period === "day") return { from: anchor, days: [anchor] };
    if (period === "week") {
        const from = startOfWeek(anchor);
        return { from, days: Array.from({ length: 7 }, (_, i) => addDays(from, i)) };
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const days = Array.from({ length: last.getDate() }, (_, i) => addDays(first, i));
    return { from: first, days };
};

function RecipeDialog({ mealId, onClose }: { mealId: string | null; onClose: () => void }) {
    const { data: meal, isLoading } = useQuery({ queryKey: ["meal", mealId], queryFn: () => api.meals.get(mealId!), enabled: Boolean(mealId) });

    return (
        <Dialog open={Boolean(mealId)} onClose={onClose} title={meal?.name ?? "Recette"} wide>
            {isLoading || !meal ? (
                <Skeleton className="h-64" />
            ) : (
                <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                    <div>
                        <img src={meal.thumbnail} alt={meal.name} className="aspect-square w-full rounded-[var(--radius-ui)] object-cover" />
                        <p className="mt-2 text-sm text-ink-500">
                            {[meal.category && (CATEGORY_LABELS[meal.category] ?? meal.category), meal.area].filter(Boolean).join(", ")}
                        </p>
                        {meal.youtube && (
                            <a className="mt-2 inline-flex items-center gap-1 text-sm underline" href={meal.youtube} target="_blank" rel="noreferrer">
                                Vidéo <ArrowSquareOut size={13} aria-hidden />
                            </a>
                        )}
                    </div>
                    <div>
                        <h3 className="mb-2 font-semibold">Ingrédients</h3>
                        <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                            {meal.ingredients.map((ingredient) => (
                                <li key={ingredient.original} className="flex items-center gap-2 text-sm">
                                    <img src={ingredient.image} alt="" className="size-8 shrink-0 rounded bg-white object-contain" loading="lazy" />
                                    <span className="min-w-0">
                                        <span className="text-ink-900 dark:text-white">{ingredient.name}</span>
                                        {ingredient.measure && <span className="num block text-xs text-ink-500">{ingredient.measure}</span>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <h3 className="mt-6 mb-2 font-semibold">Préparation</h3>
                        <p className="text-xs text-ink-500">Recette d'origine en anglais (TheMealDB).</p>
                        <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                            {meal.instructions.split(/\r?\n+/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
}

function MealPicker({ target, onClose, onPick }: {
    target: { date: Date; slot: MealSlot } | null;
    onClose: () => void;
    onPick: (meal: MealSummary) => void;
}) {
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string | null>(null);

    const categories = useQuery({ queryKey: ["meal-categories"], queryFn: () => api.meals.categories(), staleTime: Infinity });
    const results = useQuery({
        queryKey: ["meals", search, category],
        queryFn: () => (category ? api.meals.byCategory(category) : search ? api.meals.search(search) : api.meals.random(9)),
        enabled: Boolean(target),
        placeholderData: keepPreviousData,
        staleTime: category || search ? 60 * 60 * 1000 : 0,
    });

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        setCategory(null);
        setSearch(query.trim());
    };

    return (
        <Dialog open={Boolean(target)} onClose={onClose} title={target ? `${SLOT_LABELS[target.slot]}, ${longFormat.format(target.date)}` : ""} wide>
            <form onSubmit={onSubmit} className="flex gap-2">
                <label className="sr-only" htmlFor="meal-search">Rechercher un plat</label>
                <input id="meal-search" className="input" placeholder="Rechercher un plat (en anglais : chicken, pasta, soup)" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button className="btn-primary px-3" aria-label="Rechercher"><MagnifyingGlass size={18} /></button>
            </form>
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                <button className="chip" aria-pressed={!category && !search} onClick={() => { setCategory(null); setSearch(""); setQuery(""); }}>Suggestions</button>
                {categories.data?.map((c) => (
                    <button key={c.name} className="chip" aria-pressed={category === c.name} onClick={() => { setCategory(c.name); setSearch(""); }}>
                        {CATEGORY_LABELS[c.name] ?? c.name}
                    </button>
                ))}
            </div>
            {results.error && <div className="mt-4"><ErrorBox>{errorMessage(results.error)}</ErrorBox></div>}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {results.isLoading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}
                {results.data?.length === 0 && <p className="col-span-full text-sm text-ink-500">Aucun plat trouvé.</p>}
                {results.data?.slice(0, 30).map((meal) => (
                    <button key={meal.id} onClick={() => onPick(meal)} className="group text-left">
                        <img src={`${meal.thumbnail}/medium`} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-[var(--radius-ui)] object-cover transition group-hover:opacity-85" />
                        <span className="mt-1.5 line-clamp-2 block text-sm font-medium">{meal.name}</span>
                    </button>
                ))}
            </div>
        </Dialog>
    );
}

function SlotCell({ entry, onAdd, onOpen, onRemove, compact }: {
    entry: MealPlanEntry | undefined;
    onAdd: () => void;
    onOpen: () => void;
    onRemove: () => void;
    compact: boolean;
}) {
    if (!entry) {
        return (
            <button
                onClick={onAdd}
                className={`flex w-full items-center justify-center gap-1 rounded-[var(--radius-ui)] border border-dashed border-ink-300 text-sm text-ink-400 transition hover:border-ink-500 hover:text-ink-700 dark:border-ink-700 dark:hover:text-ink-200 ${compact ? "h-9" : "aspect-[4/3]"}`}
                aria-label="Ajouter un plat"
            >
                <Plus size={compact ? 14 : 18} aria-hidden />
                {!compact && "Ajouter"}
            </button>
        );
    }
    if (compact) {
        return (
            <button onClick={onOpen} className="flex h-9 w-full items-center gap-1.5 overflow-hidden rounded-[var(--radius-ui)] bg-ink-100 pr-2 text-left text-xs dark:bg-ink-800" title={entry.name}>
                {entry.thumbnail && <img src={`${entry.thumbnail}/small`} alt="" className="h-full w-9 shrink-0 object-cover" />}
                <span className="truncate">{entry.name}</span>
            </button>
        );
    }
    return (
        <div className="group relative">
            <button onClick={onOpen} className="block w-full text-left">
                {entry.thumbnail && <img src={`${entry.thumbnail}/medium`} alt="" className="aspect-[4/3] w-full rounded-[var(--radius-ui)] object-cover" />}
                <span className="mt-1.5 line-clamp-2 block text-sm font-medium">{entry.name}</span>
            </button>
            <button
                onClick={onRemove}
                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-ink-700 opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100 dark:bg-ink-900/90 dark:text-ink-200"
                aria-label={`Retirer ${entry.name}`}
            >
                <X size={14} />
            </button>
        </div>
    );
}

export function MealPlannerPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [period, setPeriod] = useState<Period>("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [picking, setPicking] = useState<{ date: Date; slot: MealSlot } | null>(null);
    const [viewing, setViewing] = useState<string | null>(null);

    const { from, days } = useMemo(() => rangeFor(period, anchor), [period, anchor]);
    const to = days[days.length - 1]!;
    const range = { from: toISODate(from), to: toISODate(to) };

    const { data: entries, isLoading } = useQuery({
        queryKey: ["meal-plan", range.from, range.to],
        queryFn: () => api.mealPlan.list(range.from, range.to),
        enabled: Boolean(user),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["meal-plan"] });
    const setMeal = useMutation({
        mutationFn: ({ date, slot, mealId }: { date: Date; slot: MealSlot; mealId: string }) => api.mealPlan.set(toISODate(date), slot, mealId),
        onSuccess: () => {
            setPicking(null);
            invalidate();
        },
    });
    const removeMeal = useMutation({ mutationFn: (id: string) => api.mealPlan.remove(id), onSuccess: invalidate });
    const toList = useMutation({
        mutationFn: () => api.mealPlan.toShoppingList(range.from, range.to),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
            navigate("/liste");
        },
    });

    const byKey = useMemo(() => new Map((entries ?? []).map((entry) => [`${entry.date.slice(0, 10)}-${entry.slot}`, entry])), [entries]);
    const entryFor = (date: Date, slot: MealSlot) => byKey.get(`${toISODate(date)}-${slot}`);

    const move = (direction: -1 | 1) => {
        if (period === "day") setAnchor(addDays(anchor, direction));
        else if (period === "week") setAnchor(addDays(anchor, 7 * direction));
        else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
    };

    const title =
        period === "day" ? longFormat.format(anchor)
            : period === "week" ? `Semaine du ${longFormat.format(from)}`
                : monthFormat.format(anchor);

    if (authLoading) return null;
    if (!user) {
        return (
            <EmptyState icon={<ForkKnife size={32} />} title="Planifiez vos repas">
                <Link to="/login" state={{ from: "/repas" }} className="font-medium text-ink-900 underline dark:text-white">Connectez-vous</Link> pour
                choisir vos plats du jour, de la semaine ou du mois et acheter les ingrédients chez vos commerçants.
            </EmptyState>
        );
    }

    const today = toISODate(new Date());
    const plannedCount = entries?.length ?? 0;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button className="btn-ghost px-2" onClick={() => move(-1)} aria-label="Période précédente"><CaretLeft size={18} /></button>
                    <button className="btn-ghost px-2" onClick={() => move(1)} aria-label="Période suivante"><CaretRight size={18} /></button>
                    <h1 className="ml-2 text-xl font-semibold first-letter:uppercase md:text-2xl">{title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-[var(--radius-ui)] border border-ink-200 p-0.5 dark:border-ink-700" role="group" aria-label="Période">
                        {(["day", "week", "month"] as const).map((p) => (
                            <button
                                key={p}
                                aria-pressed={period === p}
                                onClick={() => setPeriod(p)}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-600 aria-pressed:bg-ink-900 aria-pressed:text-white dark:text-ink-300 dark:aria-pressed:bg-white dark:aria-pressed:text-ink-900"
                            >
                                {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
                            </button>
                        ))}
                    </div>
                    <button className="btn-accent" disabled={plannedCount === 0 || toList.isPending} onClick={() => toList.mutate()}>
                        <Basket size={17} aria-hidden /> Acheter les ingrédients
                    </button>
                </div>
            </div>

            {toList.error && <div className="mb-4"><ErrorBox>{errorMessage(toList.error)}</ErrorBox></div>}
            {setMeal.error && <div className="mb-4"><ErrorBox>{errorMessage(setMeal.error)}</ErrorBox></div>}
            {plannedCount > 0 && (
                <div className="mb-6">
                    <SuccessBox><span className="num">{plannedCount}</span> repas prévus sur la période. Les ingrédients iront dans votre liste, classés par commerce.</SuccessBox>
                </div>
            )}

            {isLoading ? (
                <Skeleton className="h-80" />
            ) : period === "month" ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {days.map((day) => (
                        <div key={toISODate(day)} className={`rounded-[var(--radius-ui)] border p-2 ${toISODate(day) === today ? "border-ink-900 dark:border-white" : "border-ink-200 dark:border-ink-800"}`}>
                            <p className="mb-1.5 text-xs font-medium text-ink-500 first-letter:uppercase">{dayFormat.format(day)}</p>
                            <div className="space-y-1">
                                {SLOTS.map((slot) => {
                                    const entry = entryFor(day, slot);
                                    return (
                                        <SlotCell
                                            key={slot}
                                            compact
                                            entry={entry}
                                            onAdd={() => setPicking({ date: day, slot })}
                                            onOpen={() => entry && setViewing(entry.mealId)}
                                            onRemove={() => entry && removeMeal.mutate(entry.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`grid gap-4 ${period === "day" ? "max-w-2xl grid-cols-1" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-7"}`}>
                    {days.map((day) => (
                        <div key={toISODate(day)}>
                            <p className={`mb-2 text-sm font-medium first-letter:uppercase ${toISODate(day) === today ? "text-tomato-600" : "text-ink-500"}`}>
                                {period === "day" ? "" : dayFormat.format(day)}
                            </p>
                            <div className={period === "day" ? "grid grid-cols-2 gap-4" : "space-y-3"}>
                                {SLOTS.map((slot) => {
                                    const entry = entryFor(day, slot);
                                    return (
                                        <div key={slot}>
                                            <p className="mb-1 text-xs text-ink-400">{SLOT_LABELS[slot]}</p>
                                            <SlotCell
                                                compact={false}
                                                entry={entry}
                                                onAdd={() => setPicking({ date: day, slot })}
                                                onOpen={() => entry && setViewing(entry.mealId)}
                                                onRemove={() => entry && removeMeal.mutate(entry.id)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <MealPicker
                target={picking}
                onClose={() => setPicking(null)}
                onPick={(meal) => picking && setMeal.mutate({ date: picking.date, slot: picking.slot, mealId: meal.id })}
            />
            <RecipeDialog mealId={viewing} onClose={() => setViewing(null)} />
        </div>
    );
}
