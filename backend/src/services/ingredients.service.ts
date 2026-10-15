import type { PlaceCategory } from "./places.service.ts";

const TRANSLATIONS: Record<string, string> = {
    "all spice": "piment de la Jamaïque",
    almonds: "amandes",
    "almond milk": "lait d'amande",
    anchovy: "anchois",
    apple: "pomme",
    apples: "pommes",
    asparagus: "asperges",
    aubergine: "aubergine",
    avocado: "avocat",
    bacon: "bacon",
    "baking powder": "levure chimique",
    "baking soda": "bicarbonate",
    banana: "banane",
    basil: "basilic",
    "basmati rice": "riz basmati",
    "bay leaf": "laurier",
    "bay leaves": "laurier",
    beef: "bœuf",
    "beef stock": "bouillon de bœuf",
    "black pepper": "poivre noir",
    "brown sugar": "sucre roux",
    "brown rice": "riz complet",
    "cornstarch": "fécule de maïs",
    "cornflour": "fécule de maïs",
    "minced garlic": "ail haché",
    "ground ginger": "gingembre en poudre",
    "ground cumin": "cumin en poudre",
    "ground cinnamon": "cannelle en poudre",
    "stir-fry vegetables": "légumes à poêler",
    "free-range eggs": "œufs plein air",
    "self-raising flour": "farine à levure incorporée",
    "icing sugar": "sucre glace",
    "granulated sugar": "sucre",
    "unsalted butter": "beurre doux",
    "salted butter": "beurre demi-sel",
    "whole milk": "lait entier",
    "single cream": "crème liquide",
    "sour cream": "crème aigre",
    "beef brisket": "poitrine de bœuf",
    "lamb mince": "agneau haché",
    "pork chops": "côtes de porc",
    "chicken legs": "cuisses de poulet",
    "potato": "pomme de terre",
    "sweet potatoes": "patates douces",
    "red chilli": "piment rouge",
    "green chilli": "piment vert",
    "fresh thyme": "thym frais",
    "fresh basil": "basilic frais",
    "sesame seed oil": "huile de sésame",
    "sesame seeds": "graines de sésame",
    "fish sauce": "sauce poisson",
    "worcestershire sauce": "sauce Worcestershire",
    "tomato ketchup": "ketchup",
    "plain yogurt": "yaourt nature",
    "lemons": "citrons",
    "limes": "citrons verts",
    "kidney beans": "haricots rouges",
    "black beans": "haricots noirs",
    "cherry tomatoes": "tomates cerises",
    "puff pastry": "pâte feuilletée",
    "shortcrust pastry": "pâte brisée",
    "egg white": "blanc d'œuf",
    "egg yolk": "jaune d'œuf",
    "vanilla extract": "extrait de vanille",
    "vanilla": "vanille",
    bread: "pain",
    breadcrumbs: "chapelure",
    broccoli: "brocoli",
    butter: "beurre",
    cabbage: "chou",
    "caster sugar": "sucre en poudre",
    carrot: "carotte",
    carrots: "carottes",
    celery: "céleri",
    "cheddar cheese": "cheddar",
    cheese: "fromage",
    chicken: "poulet",
    "chicken breast": "blanc de poulet",
    "chicken breasts": "blancs de poulet",
    "chicken stock": "bouillon de volaille",
    "chicken thighs": "cuisses de poulet",
    chickpeas: "pois chiches",
    chilli: "piment",
    "chilli powder": "piment en poudre",
    chives: "ciboulette",
    chocolate: "chocolat",
    cinnamon: "cannelle",
    cod: "cabillaud",
    "coconut milk": "lait de coco",
    coriander: "coriandre",
    courgettes: "courgettes",
    cream: "crème",
    "creme fraiche": "crème fraîche",
    cucumber: "concombre",
    cumin: "cumin",
    "dark chocolate": "chocolat noir",
    "double cream": "crème entière",
    egg: "œuf",
    eggs: "œufs",
    "egg yolks": "jaunes d'œufs",
    "extra virgin olive oil": "huile d'olive vierge extra",
    "feta cheese": "feta",
    flour: "farine",
    garlic: "ail",
    "garlic clove": "gousse d'ail",
    ginger: "gingembre",
    "green beans": "haricots verts",
    "green pepper": "poivron vert",
    ham: "jambon",
    honey: "miel",
    lamb: "agneau",
    leek: "poireau",
    lemon: "citron",
    "lemon juice": "jus de citron",
    lettuce: "salade",
    lime: "citron vert",
    milk: "lait",
    mint: "menthe",
    "minced beef": "bœuf haché",
    mozzarella: "mozzarella",
    mushrooms: "champignons",
    mussels: "moules",
    mustard: "moutarde",
    nutmeg: "muscade",
    "olive oil": "huile d'olive",
    olives: "olives",
    onion: "oignon",
    onions: "oignons",
    oregano: "origan",
    paprika: "paprika",
    parmesan: "parmesan",
    "parmesan cheese": "parmesan",
    parsley: "persil",
    pasta: "pâtes",
    peas: "petits pois",
    pepper: "poivre",
    "plain flour": "farine",
    pork: "porc",
    potatoes: "pommes de terre",
    prawns: "crevettes",
    "red onion": "oignon rouge",
    "red pepper": "poivron rouge",
    "red wine": "vin rouge",
    rice: "riz",
    rosemary: "romarin",
    salmon: "saumon",
    salt: "sel",
    sausages: "saucisses",
    shallots: "échalotes",
    "soy sauce": "sauce soja",
    spaghetti: "spaghetti",
    spinach: "épinards",
    "spring onions": "oignons nouveaux",
    sugar: "sucre",
    thyme: "thym",
    tomato: "tomate",
    tomatoes: "tomates",
    "tomato puree": "concentré de tomate",
    "chopped tomatoes": "tomates concassées",
    tuna: "thon",
    turmeric: "curcuma",
    "vegetable oil": "huile végétale",
    "vegetable stock": "bouillon de légumes",
    vinegar: "vinaigre",
    water: "eau",
    "white wine": "vin blanc",
    yogurt: "yaourt",
    "greek yogurt": "yaourt grec",
};

const normalize = (value: string): string =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/œ/g, "oe")
        .trim();

const translateIngredient = (name: string): string => TRANSLATIONS[name.toLowerCase().trim()] ?? name;

const PANTRY_WORDS = [
    "stock", "bouillon", "sauce", "powder", "poudre", "flour", "farine", "sugar", "sucre", "oil", "huile",
    "vinegar", "vinaigre", "puree", "concentre", "paste", "salt", "sel", "spice", "epice", "pasta", "pates",
    "rice", "riz", "noodle", "honey", "miel", "mustard", "moutarde", "chocolate", "chocolat", "baking", "levure",
    "chapelure", "breadcrumbs", "coconut milk", "lait de coco", "chickpeas", "pois chiches", "lentil", "lentille",
    "canned", "conserve", "jam", "confiture", "cereal", "cafe", "coffee", "tea", "the",
];

const CATEGORY_KEYWORDS: [PlaceCategory, string[]][] = [
    ["seafood", ["poisson", "saumon", "thon", "crevette", "moule", "cabillaud", "colin", "sardine", "anchois", "fish", "salmon", "tuna", "prawn", "shrimp", "cod", "mussel", "haddock", "anchovy", "squid", "calamar", "huitre", "oyster", "crab", "lobster"]],
    ["butcher", ["viande", "boeuf", "poulet", "porc", "agneau", "veau", "steak", "jambon", "saucisse", "lardon", "dinde", "canard", "chicken", "beef", "pork", "lamb", "bacon", "sausage", "mince", "ham", "turkey", "duck", "goat", "chorizo", "merguez", "roti", "escalope"]],
    ["cheese", ["fromage", "lait", "beurre", "creme", "yaourt", "oeuf", "comte", "brie", "camembert", "chevre", "emmental", "parmesan", "mozzarella", "feta", "ricotta", "cheese", "milk", "butter", "cream", "yogurt", "egg", "cheddar", "mascarpone"]],
    ["bakery", ["pain", "baguette", "croissant", "brioche", "viennoiserie", "fougasse", "tarte", "gateau", "bread", "bun", "pastry", "tortilla", "pita", "naan"]],
    ["greengrocer", ["fruit", "legume", "laitue", "mache", "roquette", "pomme", "poire", "banane", "tomate", "salade", "carotte", "oignon", "ail", "courgette", "poivron", "champignon", "citron", "orange", "persil", "basilic", "coriandre", "menthe", "thym", "romarin", "laurier", "epinard", "gingembre", "concombre", "aubergine", "celeri", "poireau", "avocat", "piment", "echalote", "haricot", "petit pois", "brocoli", "chou", "fraise", "raisin", "onion", "garlic", "potato", "carrot", "tomato", "lettuce", "pepper", "mushroom", "lemon", "lime", "apple", "banana", "spinach", "ginger", "parsley", "cucumber", "celery", "leek", "zucchini", "courgettes", "avocado", "chilli", "shallot", "bean", "peas", "broccoli", "cabbage", "berries", "herb", "mint", "basil", "thyme", "rosemary", "coriander", "asparagus", "asperge"]],
    ["wine", ["vin", "biere", "champagne", "cidre", "wine", "beer", "rum", "brandy", "cognac", "whisky", "sherry", "porto"]],
];

const hasTerm = (text: string, words: string[], term: string): boolean => {
    if (term.includes(" ")) return text.includes(term);
    return words.some((word) => word === term || word === `${term}s` || word === `${term}es` || word === `${term}x`);
};

const classifyItem = (label: string): PlaceCategory => {
    const text = normalize(label);
    const words = text.split(/[^a-z]+/).filter(Boolean);
    const matches = (terms: string[]) => terms.some((term) => hasTerm(text, words, term));

    if (matches(["vin", "wine"]) && !matches(["vinaigre", "vinegar"])) return "wine";
    if (matches(PANTRY_WORDS)) return "grocery";
    for (const [category, terms] of CATEGORY_KEYWORDS) {
        if (matches(terms)) return category;
    }
    return "grocery";
};

const significantWords = (label: string): string[] =>
    normalize(label)
        .split(/[^a-z]+/)
        .filter((word) => word.length > 2 && !["les", "des", "une", "aux", "avec", "pour", "the", "and", "fresh", "frais"].includes(word));

export { translateIngredient, classifyItem, significantWords, normalize };
