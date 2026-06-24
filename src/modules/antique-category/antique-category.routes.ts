import { antiqueCategoryController } from "./antique-category.controller";
import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { anyUser, adminOnly, userOnly } from "@/middlewares/role.middleware";
import {
  getAntiqueCategoryByIdSchema,
  getAllAntiqueCategoriesSchema,
  createOneAntiqueCategorySchema,
  updateOneAntiqueCategorySchema,
  deleteAntiqueCategorySchema,
} from "./antique-category.schema";

const router = Router();

router.get(
  "/",
  anyUser,
  validate(getAllAntiqueCategoriesSchema),
  antiqueCategoryController.getAllCategories,
);
router.get(
  "/:id",
  anyUser,
  validate(getAntiqueCategoryByIdSchema),
  antiqueCategoryController.findCategoryById,
);

router.post(
  "/",
  adminOnly,
  validate(createOneAntiqueCategorySchema),
  antiqueCategoryController.createOneCategory,
);

router.patch(
  "/:id",
  adminOnly,
  validate(updateOneAntiqueCategorySchema),
  antiqueCategoryController.updateOneCategory,
);

router.delete(
  "/:id",
  adminOnly,
  validate(deleteAntiqueCategorySchema),
  antiqueCategoryController.deleteOneCategory,
);

export default router;
