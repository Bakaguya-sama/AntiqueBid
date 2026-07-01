import { userController } from "./user.controller";
import { validate } from "@/middlewares/validate.middleware";
import { Router } from "express";
import { updateProfileSchema, getUserByIdSchema } from "./user.schema";

const route = Router();

route.get("/me", userController.getMyProfile);

route.patch(
  "/me",
  validate(updateProfileSchema),
  userController.updateMyProfile,
);

route.get("/:id", validate(getUserByIdSchema), userController.getUser);

export default route;
