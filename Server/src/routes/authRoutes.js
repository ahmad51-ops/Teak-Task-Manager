import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  getAuthConfig,
  refreshAccessToken,
  logout,
  getMe,
  verifyEmailController,
  resendVerification,
} from "../controllers/authController.js";
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} from "../validators/authValidator.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Public — lets the login page know whether to render the Google button.
router.get("/config", getAuthConfig);

router.post("/register", registerValidator, validate, register);
router.post("/verify-email", verifyEmailValidator, validate, verifyEmailController);
router.post("/resend-verification", resendVerificationValidator, validate, resendVerification);
router.post("/login", loginValidator, validate, login);
router.post("/google", googleLogin);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
