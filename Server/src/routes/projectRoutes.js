import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  restoreProject,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "../controllers/projectController.js";
import {
  createProjectValidator,
  updateProjectValidator,
  inviteMemberValidator,
  updateMemberRoleValidator,
} from "../validators/projectValidator.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { restrictTo } from "../middleware/role.js";

const router = Router();

// Every route here requires login. Fine-grained permission checks
// (owner vs project-admin vs member) happen inside projectService,
// since they depend on THIS project's member list, not just the
// logged-in user's global role.
router.use(protect);

// Creating a project and inviting members are gated on global role
// (admin/manager) rather than any per-project membership — there's no
// project to be a member of yet at creation time, and invites are
// deliberately restricted to the same roles rather than left to
// whoever happens to hold project-owner/admin status.
router.post("/", restrictTo("admin", "manager"), createProjectValidator, validate, createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.patch("/:id", updateProjectValidator, validate, updateProject);
router.delete("/:id", deleteProject);

router.patch("/:id/archive", archiveProject);
router.patch("/:id/restore", restoreProject);

router.post("/:id/members", restrictTo("admin", "manager"), inviteMemberValidator, validate, inviteMember);
router.delete("/:id/members/:userId", removeMember);
router.patch("/:id/members/:userId/role", updateMemberRoleValidator, validate, updateMemberRole);

export default router;
