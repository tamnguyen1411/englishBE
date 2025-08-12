import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  upvotePrompt,
  getMyStatsController
} from "../controllers/prompt.controller";

const router = express.Router();

router.get("/", getPrompts);
router.post("/", authMiddleware, createPrompt);
router.patch("/:id", authMiddleware, updatePrompt);
router.delete("/:id", authMiddleware, deletePrompt);
router.post("/:id/upvote", authMiddleware, upvotePrompt);
router.get("/me/stats", authMiddleware, getMyStatsController);
export default router;
