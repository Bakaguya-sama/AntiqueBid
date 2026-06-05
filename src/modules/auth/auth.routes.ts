import { authController } from "./auth.controller";
import { Router } from "express";

const router = Router();
router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.post("/logout-all", authController.logoutAll);

router.post("/refresh", authController.refresh);

export default router;
