import { authController } from "./auth.controller";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "./auth.schema";

const router = Router();

router.post(
  "/register/send-otp",
  validate(sendOtpSchema),
  authController.sendRegisterOtp,
);
router.post(
  "/register/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyRegisterOtp,
);
router.post("/register", validate(registerSchema), authController.register);

router.post(
  "/change-password/send-otp",
  validate(sendOtpSchema),
  authController.sendChangePasswordOtp,
);
router.post(
  "/change-password/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyChangePasswordOtp,
);
router.post(
  "/change-password",
  validate(changePasswordSchema),
  authController.changePassword,
);

router.post("/login", validate(loginSchema), authController.login);

router.post("/logout", authenticate, authController.logout);

router.post("/logout-all", authenticate, authController.logoutAll);

router.post("/refresh", authController.refresh);

router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

export default router;
