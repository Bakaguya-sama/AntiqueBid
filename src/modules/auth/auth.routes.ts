import { authController } from "./auth.controller";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();
router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.post("/logout-all", authController.logoutAll);

router.post("/refresh", authController.refresh);

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

export default router;
