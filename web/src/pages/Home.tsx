import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Basket, ForkKnife, ListChecks, MapTrifold, Storefront } from "@phosphor-icons/react";
import { api } from "../lib/api.ts";
import { ShopCard } from "../components/Cards.tsx";
import { Skeleton } from "../components/ui.tsx";

const FEATURES = [
    {
        icon: MapTrifold,
        title: "Les commerces autour de vous",
        text: "Boulangeries, primeurs, fromagers, marchés : une carte des vrais commerces de votre quartier, avec horaires et distance à pied.",
        to: "/carte",
        cta: "Ouvrir la carte",
    },
    {
        icon: ForkKnife,
        title: "Des repas aux courses",
        text: "Choisissez vos repas de la semaine. MarketSquare en tire la liste de courses et vous dit chez quel commerçant trouver chaque ingrédient.",
        to: "/repas",
        cta: "Planifier mes repas",
    },
    {
        icon: Basket,
        title: "Commande et retrait",
        text: "Chez les commerçants partenaires, commandez en ligne puis passez récupérer vos produits, ou faites-vous livrer.",
        to: "/shops",
        cta: "Voir les boutiques",
    },
];

const STEPS = [
    { icon: MapTrifold, title: "Indiquez où vous êtes", text: "Géolocalisation ou simple adresse, rien de plus." },
    { icon: ListChecks, title: "Composez votre liste", text: "À la main, ou à partir des repas que vous avez prévus." },
    { icon: Storefront, title: "Faites vos courses près de chez vous", text: "Itinéraire à pied, ou commande en click & collect." },
];

export function HomePage() {
    const { data: shops, isLoading } = useQuery({
        queryKey: ["shops", { home: true }],
        queryFn: () => api.shops.list({ limit: 3 }),
    });

    return (
        <div className="space-y-20 md:space-y-28">
            <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.1fr_1fr]">
                <div>
                    <p className="mb-4 text-sm font-medium text-tomato-600 dark:text-tomato-400">Commerces de quartier</p>
                    <h1 className="text-4xl font-semibold leading-[1.1] md:text-5xl">
                        Vos courses chez les commerçants du coin.
                    </h1>
                    <p className="mt-5 max-w-xl text-lg text-ink-600 dark:text-ink-300">
                        MarketSquare réunit les commerces de proximité sur une carte, transforme vos repas en liste de courses
                        et vous permet de commander chez ceux qui sont partenaires.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/carte" className="btn-accent">
                            <MapTrifold size={18} aria-hidden /> Voir les commerces autour de moi
                        </Link>
                        <Link to="/repas" className="btn-ghost border border-ink-200 dark:border-ink-700">
                            <ForkKnife size={18} aria-hidden /> Planifier mes repas
                        </Link>
                    </div>
                </div>

                {(isLoading || Boolean(shops?.data.length)) && <div className="space-y-3">
                    <p className="text-sm text-ink-500 dark:text-ink-400">Déjà sur MarketSquare</p>
                    {isLoading
                        ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 rounded-[var(--radius-panel)]" />)
                        : shops?.data.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
                </div>}
            </section>

            <section>
                <h2 className="text-2xl font-semibold md:text-3xl">Ce que vous pouvez faire</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {FEATURES.map(({ icon: Icon, title, text, to, cta }) => (
                        <article key={title} className="card flex flex-col p-6">
                            <span className="grid size-11 place-items-center rounded-[var(--radius-ui)] bg-ink-900 text-white dark:bg-white dark:text-ink-900">
                                <Icon size={22} aria-hidden />
                            </span>
                            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                            <p className="mt-2 flex-1 text-ink-600 dark:text-ink-300">{text}</p>
                            <Link to={to} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-tomato-600 hover:underline dark:text-tomato-400">
                                {cta} <ArrowRight size={15} aria-hidden />
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold md:text-3xl">Comment ça marche</h2>
                <ol className="mt-8 grid gap-8 md:grid-cols-3">
                    {STEPS.map(({ icon: Icon, title, text }, index) => (
                        <li key={title} className="flex gap-4">
                            <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-tomato-500 text-sm font-semibold text-white">{index + 1}</span>
                            <div>
                                <h3 className="flex items-center gap-2 font-semibold"><Icon size={18} aria-hidden /> {title}</h3>
                                <p className="mt-1 text-ink-600 dark:text-ink-300">{text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="card flex flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Vous êtes commerçant ?</h2>
                    <p className="mt-2 max-w-xl text-ink-600 dark:text-ink-300">
                        Mettez vos produits en ligne, recevez des commandes en click & collect et apparaissez en tête de la carte de votre quartier.
                    </p>
                </div>
                <Link to="/register?merchant=1" className="btn-primary shrink-0">
                    Ouvrir ma boutique <ArrowRight size={16} aria-hidden />
                </Link>
            </section>
        </div>
    );
}
