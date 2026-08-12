import { Router } from "express";
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { commentValidator } from "../validators/commentValidator.js";
import { validate } from "../middleware/validate.js";

// mergeParams:true is essential here — this router is mounted inside
// taskRoutes.js at "/:id/comments", and without mergeParams it wouldn't
// see the parent's :id param at all.
const router = Router({ mergeParams: true });

// No separate `protect` here — this router only ever runs after
// taskRoutes.js's own `router.use(protect)`, since it's nested inside it.
router.post("/", commentValidator, validate, createComment);
router.get("/", getComments);
router.patch("/:commentId", commentValidator, validate, updateComment);
router.delete("/:commentId", deleteComment);

export default router;
