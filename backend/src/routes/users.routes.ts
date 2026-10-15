
import { Router } from "express";
import { authMiddleware } from '../middlewares/user.middleware.ts';
import {
    getProfileHandler,
    updateProfileHandler,
    changePasswordHandler,
    deleteProfileHandler,
    updatePushTokenHandler,
    listFavoritesHandler,
    addFavoriteHandler,
    removeFavoriteHandler,
} from "../controllers/user.controller.ts";



const userRouter: Router = Router();

userRouter.use(authMiddleware)




// ========== User Routes ==========

// get current user profile
userRouter.get("/user-profile", getProfileHandler)

// update current user profile
userRouter.put("/update-profile", updateProfileHandler)

// change current user password
userRouter.patch("/change-password", changePasswordHandler)

// delete current user account
userRouter.delete("/delete-profile", deleteProfileHandler)

userRouter.patch("/push-token", updatePushTokenHandler)


userRouter.get("/favorites", listFavoritesHandler)

userRouter.post("/favorites/:productId", addFavoriteHandler)

userRouter.delete("/favorites/:productId", removeFavoriteHandler)


export default userRouter;
