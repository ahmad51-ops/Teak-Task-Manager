import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar as uploadAvatarController,
  getInvitableUsers,
  getAllUsers,
  getUserDirectory,
  updateUserRole,
  deactivateUser,
  reactivateUser,
} from "../controllers/userController.js";
import {
  updateProfileValidator,
  changePasswordValidator,
  updateRoleValidator,
} from "../validators/userValidator.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { restrictTo } from "../middleware/role.js";
import { uploadAvatar } from "../middleware/upload.js";

const router = Router();

router.use(protect);

// --- Self-service: any logged-in user ---
router.get("/profile", getProfile);
router.patch("/profile", updateProfileValidator, validate, updateProfile);
router.patch("/change-password", changePasswordValidator, validate, changePassword);
router.post("/avatar", uploadAvatar, uploadAvatarController);

// Any member can read this — needed to populate the invite dropdown.
router.get("/invitable/:projectId", getInvitableUsers);

// --- Admin & Manager ---
router.get("/", restrictTo("admin", "manager"), getAllUsers);

// --- Admin only ---
router.get("/directory", restrictTo("admin"), getUserDirectory);
router.patch("/:id/role", restrictTo("admin"), updateRoleValidator, validate, updateUserRole);
router.patch("/:id/deactivate", restrictTo("admin"), deactivateUser);
router.patch("/:id/reactivate", restrictTo("admin"), reactivateUser);

export default router;
