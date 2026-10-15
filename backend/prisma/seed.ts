import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";

const PASSWORD = "Password123!";

const ingredientImage = (name: string) => `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}.png`;

interface SeedProduct {
    name: string;
    price: number;
    stock: number;
    image: string;
    description?: string;
}

interface SeedShop {
    merchant: { email: string; firstname: string; lastname: string; username: string };
    shop: { name: string; description: string; category: string };
    address: { streetAddress: string; postalCode: string; addressLocality: string; latitude: number; longitude: number };
    products: SeedProduct[];
}

const shops: SeedShop[] = [
    {
        merchant: { email: "boulangerie@marketsquare.dev", firstname: "Paul", lastname: "Durand", username: "paul_boulanger" },
        shop: { name: "Boulangerie Lucette", description: "Pains au levain cuits sur place, farines bio du Gâtinais.", category: "bakery" },
        address: { streetAddress: "41 Rue Oberkampf", postalCode: "75011", addressLocality: "Paris", latitude: 48.864476, longitude: 2.371576 },
        products: [
            { name: "Baguette tradition", price: 1.3, stock: 60, image: ingredientImage("Baguette"), description: "Fermentation lente, 250 g." },
            { name: "Pain de campagne", price: 4.2, stock: 20, image: ingredientImage("Bread"), description: "Levain naturel, 800 g." },
            { name: "Pâte feuilletée pur beurre", price: 3.5, stock: 12, image: ingredientImage("Puff Pastry"), description: "Faite maison, 400 g." },
            { name: "Farine de blé T65", price: 2.4, stock: 25, image: ingredientImage("Plain Flour"), description: "Moulin du Gâtinais, 1 kg." },
        ],
    },
    {
        merchant: { email: "primeur@marketsquare.dev", firstname: "Amina", lastname: "Benali", username: "amina_primeur" },
        shop: { name: "Primeur des Trois Bornes", description: "Fruits et légumes de saison, producteurs d'Île-de-France.", category: "greengrocer" },
        address: { streetAddress: "22 Rue Jean-Pierre Timbaud", postalCode: "75011", addressLocality: "Paris", latitude: 48.865422, longitude: 2.368949 },
        products: [
            { name: "Carottes (1 kg)", price: 2.2, stock: 40, image: ingredientImage("Carrots") },
            { name: "Pommes de terre (2 kg)", price: 3.6, stock: 30, image: ingredientImage("Potatoes") },
            { name: "Tomates (1 kg)", price: 3.9, stock: 25, image: ingredientImage("Tomatoes") },
            { name: "Citrons (x4)", price: 2.1, stock: 30, image: ingredientImage("Lemons") },
            { name: "Pommes (1 kg)", price: 3.2, stock: 35, image: ingredientImage("Apples") },
            { name: "Poireaux (botte)", price: 2.8, stock: 20, image: ingredientImage("Leek") },
            { name: "Oignons jaunes (1 kg)", price: 1.9, stock: 40, image: ingredientImage("Onions") },
            { name: "Poivrons rouges (x3)", price: 3.4, stock: 18, image: ingredientImage("Red Pepper") },
            { name: "Courgettes (1 kg)", price: 2.9, stock: 22, image: ingredientImage("Courgettes") },
            { name: "Champignons de Paris (500 g)", price: 3.1, stock: 15, image: ingredientImage("Mushrooms") },
            { name: "Épinards (500 g)", price: 2.7, stock: 12, image: ingredientImage("Spinach") },
            { name: "Ail (3 têtes)", price: 1.8, stock: 30, image: ingredientImage("Garlic") },
            { name: "Avocats (x2)", price: 2.6, stock: 16, image: ingredientImage("Avocado") },
            { name: "Bananes (1 kg)", price: 2.3, stock: 25, image: ingredientImage("Banana") },
            { name: "Fraises (250 g)", price: 4.5, stock: 0, image: ingredientImage("Strawberries") },
        ],
    },
    {
        merchant: { email: "boucherie@marketsquare.dev", firstname: "Karim", lastname: "Haddad", username: "karim_boucher" },
        shop: { name: "Boucherie Saint-Maur", description: "Viandes françaises, volailles fermières Label Rouge.", category: "butcher" },
        address: { streetAddress: "112 Rue Saint-Maur", postalCode: "75011", addressLocality: "Paris", latitude: 48.866824, longitude: 2.376437 },
        products: [
            { name: "Blancs de poulet fermier (x2)", price: 9.8, stock: 20, image: ingredientImage("Chicken Breast") },
            { name: "Bœuf haché 15% (500 g)", price: 8.9, stock: 18, image: ingredientImage("Minced Beef") },
            { name: "Poitrine de bœuf (1 kg)", price: 16.5, stock: 8, image: ingredientImage("Beef Brisket") },
            { name: "Saucisses de Toulouse (x4)", price: 7.2, stock: 15, image: ingredientImage("Sausages") },
            { name: "Lardons fumés (200 g)", price: 3.4, stock: 25, image: ingredientImage("Bacon") },
            { name: "Jambon blanc (4 tranches)", price: 5.6, stock: 20, image: ingredientImage("Ham") },
        ],
    },
    {
        merchant: { email: "cremerie@marketsquare.dev", firstname: "Sophie", lastname: "Marchal", username: "sophie_cremiere" },
        shop: { name: "Crèmerie de la Roquette", description: "Fromages affinés, beurre de baratte et œufs plein air.", category: "cheese" },
        address: { streetAddress: "35 Rue de la Roquette", postalCode: "75011", addressLocality: "Paris", latitude: 48.855089, longitude: 2.373261 },
        products: [
            { name: "Brie de Meaux (250 g)", price: 6.9, stock: 10, image: ingredientImage("Brie") },
            { name: "Parmesan 24 mois (200 g)", price: 7.5, stock: 12, image: ingredientImage("Parmesan") },
            { name: "Cheddar affiné (200 g)", price: 5.2, stock: 10, image: ingredientImage("Cheddar Cheese") },
            { name: "Fromage de chèvre frais", price: 4.4, stock: 14, image: ingredientImage("Goats Cheese") },
            { name: "Beurre de baratte doux (250 g)", price: 4.1, stock: 20, image: ingredientImage("Butter") },
            { name: "Œufs plein air (x6)", price: 3.3, stock: 30, image: ingredientImage("Eggs") },
            { name: "Lait entier (1 L)", price: 1.6, stock: 25, image: ingredientImage("Milk") },
            { name: "Crème entière (20 cl)", price: 2.4, stock: 18, image: ingredientImage("Double Cream") },
            { name: "Yaourt grec (500 g)", price: 3.6, stock: 15, image: ingredientImage("Greek Yogurt") },
        ],
    },
    {
        merchant: { email: "poissonnerie@marketsquare.dev", firstname: "Yann", lastname: "Le Goff", username: "yann_maree" },
        shop: { name: "Marée Oberkampf", description: "Arrivages quotidiens de Bretagne et de Normandie.", category: "seafood" },
        address: { streetAddress: "12 Rue Oberkampf", postalCode: "75011", addressLocality: "Paris", latitude: 48.863125, longitude: 2.36872 },
        products: [
            { name: "Pavés de saumon (x2)", price: 11.9, stock: 12, image: ingredientImage("Salmon") },
            { name: "Dos de cabillaud (400 g)", price: 13.5, stock: 8, image: ingredientImage("Cod") },
            { name: "Crevettes cuites (300 g)", price: 8.7, stock: 10, image: ingredientImage("Prawns") },
            { name: "Moules de bouchot (1 kg)", price: 6.4, stock: 15, image: ingredientImage("Mussels") },
        ],
    },
    {
        merchant: { email: "epicerie@marketsquare.dev", firstname: "Hugo", lastname: "Lefèvre", username: "hugo_epicier" },
        shop: { name: "Épicerie Folie-Méricourt", description: "Épicerie de quartier : vrac, conserves, vins nature.", category: "grocery" },
        address: { streetAddress: "8 Rue de la Folie-Méricourt", postalCode: "75011", addressLocality: "Paris", latitude: 48.861655, longitude: 2.374593 },
        products: [
            { name: "Huile d'olive vierge extra (50 cl)", price: 9.5, stock: 15, image: ingredientImage("Olive Oil") },
            { name: "Spaghetti (500 g)", price: 1.9, stock: 40, image: ingredientImage("Spaghetti") },
            { name: "Riz basmati (1 kg)", price: 3.8, stock: 25, image: ingredientImage("Rice") },
            { name: "Lentilles vertes (500 g)", price: 2.9, stock: 20, image: ingredientImage("Lentils") },
            { name: "Pois chiches (500 g)", price: 2.6, stock: 20, image: ingredientImage("Chickpeas") },
            { name: "Miel de fleurs (250 g)", price: 6.8, stock: 12, image: ingredientImage("Honey") },
            { name: "Chocolat noir 70% (100 g)", price: 2.9, stock: 30, image: ingredientImage("Dark Chocolate") },
            { name: "Café en grains (250 g)", price: 7.9, stock: 14, image: ingredientImage("Coffee") },
            { name: "Confiture de framboise", price: 4.3, stock: 16, image: ingredientImage("Raspberry Jam") },
            { name: "Vin rouge Côtes-du-Rhône", price: 8.5, stock: 24, image: ingredientImage("Red Wine") },
            { name: "Vin blanc Muscadet", price: 7.9, stock: 24, image: ingredientImage("White Wine") },
        ],
    },
];

const LEGACY_MERCHANTS = ["librairie@marketsquare.dev"];

const main = async (): Promise<void> => {
    const password = await bcrypt.hash(PASSWORD, 10);
    const baseUser = { password, gender: "OTHER" as const, dateOfBirth: new Date("1990-01-01"), phone: "0600000000" };

    await prisma.user.upsert({
        where: { email: "admin@marketsquare.dev" },
        update: {},
        create: { ...baseUser, email: "admin@marketsquare.dev", username: "admin", firstname: "Admin", lastname: "MarketSquare", role: "ADMIN" },
    });

    const customer = await prisma.user.upsert({
        where: { email: "client@marketsquare.dev" },
        update: {},
        create: {
            ...baseUser, email: "client@marketsquare.dev", username: "claire_client", firstname: "Claire", lastname: "Moreau",
            addresses: {
                create: {
                    streetAddress: "8 Rue Oberkampf", postalCode: "75011", addressLocality: "Paris",
                    addressRegion: "Île-de-France", addressCountry: "FR", housingType: "APARTMENT",
                    latitude: 48.86308, longitude: 2.36824,
                },
            },
        },
    });

    await prisma.shop.deleteMany({ where: { merchant: { email: { in: LEGACY_MERCHANTS } } } });

    for (const entry of shops) {
        const merchant = await prisma.user.upsert({
            where: { email: entry.merchant.email },
            update: { role: "MERCHANT" },
            create: { ...baseUser, ...entry.merchant, role: "MERCHANT" },
        });

        await prisma.shop.deleteMany({ where: { merchantId: merchant.id } });

        const shop = await prisma.shop.create({
            data: {
                ...entry.shop,
                merchantId: merchant.id,
                address: { create: { ...entry.address, addressRegion: "Île-de-France", addressCountry: "FR", type: "SHOP" } },
                products: {
                    create: entry.products.map((product) => ({
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        imageUrl: product.image,
                        description: product.description ?? null,
                    })),
                },
            },
            include: { products: true },
        });

        const firstProduct = shop.products[0];
        if (firstProduct) {
            await prisma.review.create({ data: { authorId: customer.id, productId: firstProduct.id, rating: 5, comment: "Toujours parfait, je recommande." } });
            await prisma.product.update({ where: { id: firstProduct.id }, data: { averageRating: 5, reviewCount: 1 } });
        }
        await prisma.review.create({ data: { authorId: customer.id, shopId: shop.id, rating: 4, comment: "Accueil sympathique, bons conseils." } });
        await prisma.shop.update({ where: { id: shop.id }, data: { averageRating: 4, reviewCount: 1 } });
    }

    console.log("Seed done. Accounts (password: %s):", PASSWORD);
    console.log("  admin@marketsquare.dev (ADMIN)");
    console.log("  client@marketsquare.dev (USER)");
    shops.forEach((entry) => console.log(`  ${entry.merchant.email} (MERCHANT, ${entry.shop.name})`));
};

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
