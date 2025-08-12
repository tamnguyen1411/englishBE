import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getByPrompt,
  createComment,
  deleteComment,
} from "../controllers/comment.controller";
const router = express.Router();

router.get("/:promptId", getByPrompt);
router.post("/:promptId", authMiddleware, createComment);
router.delete("/:id", authMiddleware, deleteComment);

export default router;
