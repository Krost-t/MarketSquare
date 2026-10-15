import { Router } from "express";
import { authMiddleware, adminMiddleware } from '../middlewares/user.middleware.ts';
import {
    AdminDashboardHandler,
    AdminProfileHandler,
    AdminShowAllUsersHandler,
    AdminShowOneUserHandler,
    AdminCreateUserHandler,
    AdminUpdateOneFieldUserHandler,
    AdminUpdateOneRoleUserHandler,
    AdminDeleteOneUserHandler,
    AdminListAllReviewsHandler,
    AdminDeleteAnyReviewHandler,
    AdminListAllShopsForModerationHandler,
    AdminDeleteAnyShopHandler,
    AdminListAllOrdersHandler,
} from '../controllers/admin.controller.ts';



const adminRouter: Router = Router();

adminRouter.use(authMiddleware)






adminRouter.get("/dashboard", adminMiddleware, AdminDashboardHandler)

adminRouter.get("/admin-profile", adminMiddleware, AdminProfileHandler)

// get all users
adminRouter.get("/users-list", adminMiddleware, AdminShowAllUsersHandler)

// get user by id
adminRouter.get("/user/:id", adminMiddleware, AdminShowOneUserHandler)

// create user
adminRouter.post("/create-user", adminMiddleware, AdminCreateUserHandler)

// update user by id
adminRouter.put("/update-user/:id", adminMiddleware, AdminUpdateOneFieldUserHandler)

// update user by id just one field
adminRouter.patch("/update-user/:id/role", adminMiddleware, AdminUpdateOneRoleUserHandler)

// delete user by id
adminRouter.delete("/delete-user/:id", adminMiddleware, AdminDeleteOneUserHandler)


adminRouter.get("/reviews-list", adminMiddleware, AdminListAllReviewsHandler)

adminRouter.delete("/delete-review/:id", adminMiddleware, AdminDeleteAnyReviewHandler)


adminRouter.get("/shops-list", adminMiddleware, AdminListAllShopsForModerationHandler)

adminRouter.delete("/delete-shop/:id", adminMiddleware, AdminDeleteAnyShopHandler)


adminRouter.get("/orders-list", adminMiddleware, AdminListAllOrdersHandler)


export default adminRouter;
