import { AuthController } from "./auth.controller";
import { Router } from "express";

const router = Router();
router.post("/register", AuthController.register);

export default router;
