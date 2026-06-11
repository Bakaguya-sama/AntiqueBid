import { antiqueController } from "./antique.controller";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  createAntiqueSchema,
  getAntiqueSchema,
  getAntiqueByCreatorSchema,
  updateAntiqueSchema,
  deleteAntiqueSchema,
} from "./antique.schema";

const router = Router();

router.get(
  "/:id",
  validate(getAntiqueSchema),
  antiqueController.getAntiqueById,
);

router.get(
  "/creator/:id",
  validate(getAntiqueByCreatorSchema),
  antiqueController.getAntiqueByCreator,
);

router.patch(
  "/:id",
  validate(updateAntiqueSchema),
  antiqueController.updateAntique,
);

router.post(
  "/create",
  validate(createAntiqueSchema),
  antiqueController.createAntique,
);

router.delete(
  "/:id",
  validate(deleteAntiqueSchema),
  antiqueController.deleteAntique,
);

export default router;
