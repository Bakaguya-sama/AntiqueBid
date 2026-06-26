import { userController } from "./user.controller";
import { validate } from "@/middlewares/validate.middleware";
import { Router } from "express";
import { updateProfileSchema } from "./user.schema";

const route = Router();

route.get("/me", userController.getMyProfile);

route.patch(
  "/me",
  validate(updateProfileSchema),
  userController.updateMyProfile,
);

export default route;
