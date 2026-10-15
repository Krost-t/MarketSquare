import { Router } from "express";
import { authMiddleware } from "../middlewares/user.middleware.ts";
import { geocodeHandler, nearbyHandler, reverseHandler } from "../controllers/places.controller.ts";
import { categoriesHandler, categoryHandler, mealHandler, randomHandler, searchHandler } from "../controllers/meals.controller.ts";
import {
    addItemsHandler,
    clearCheckedHandler,
    deleteItemHandler,
    getListHandler,
    planHandler,
    updateItemHandler,
} from "../controllers/shopping.controller.ts";
import { deleteMealHandler, ingredientsToListHandler, listPlanHandler, setMealHandler } from "../controllers/mealplan.controller.ts";


const placesRouter: Router = Router();

placesRouter.get("/nearby", nearbyHandler);

placesRouter.get("/geocode", geocodeHandler);

placesRouter.get("/reverse", reverseHandler);


const mealsRouter: Router = Router();

mealsRouter.get("/search", searchHandler);

mealsRouter.get("/random", randomHandler);

mealsRouter.get("/categories", categoriesHandler);

mealsRouter.get("/category/:name", categoryHandler);

mealsRouter.get("/:id", mealHandler);


const shoppingListRouter: Router = Router();

shoppingListRouter.use(authMiddleware);

shoppingListRouter.get("/", getListHandler);

shoppingListRouter.post("/", addItemsHandler);

shoppingListRouter.post("/plan", planHandler);

shoppingListRouter.delete("/checked", clearCheckedHandler);

shoppingListRouter.patch("/:id", updateItemHandler);

shoppingListRouter.delete("/:id", deleteItemHandler);


const mealPlanRouter: Router = Router();

mealPlanRouter.use(authMiddleware);

mealPlanRouter.get("/", listPlanHandler);

mealPlanRouter.put("/", setMealHandler);

mealPlanRouter.post("/shopping-list", ingredientsToListHandler);

mealPlanRouter.delete("/:id", deleteMealHandler);


export { placesRouter, mealsRouter, shoppingListRouter, mealPlanRouter };
