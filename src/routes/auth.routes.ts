import { AuthController } from "../controllers/auth.controller";
import { Router } from "express";

const router = Router();
router.post("/register", AuthController.register);

export default router;
