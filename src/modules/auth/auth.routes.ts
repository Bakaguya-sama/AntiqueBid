import { authController } from "./auth.controller";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { loginSchema, registerSchema } from "./auth.schema";

const router = Router();
router.post("/register", validate(registerSchema), authController.register);

router.post("/login", validate(loginSchema), authController.login);

router.post("/logout", authenticate, authController.logout);

router.post("/logout-all", authenticate, authController.logoutAll);

router.post("/refresh", authController.refresh);

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

export default router;
