import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  listPrompts,
  createPromptSvc,
  updatePromptSvc,
  deletePromptSvc,
  upvotePromptSvc,
  getUserPromptStats
} from "../services/prompt.service";
import { HttpError } from "../utils/HttpError";
// GET /api/prompts
export const getPrompts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const result = await listPrompts(page, limit);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ msg: e.message || "Lỗi server" });
  }
};

// POST /api/prompts
export const createPrompt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createPromptSvc({
      title: req.body.title,
      content: req.body.content,
      userId: req.user!,
    });

    if (!result.ok) {
      // status do service gợi ý, mặc định 400
      return res.status(result.status ?? 400).json(result);
    }
    return res.status(201).json(result); // { ok:true, data }
  } catch (e) {
    // lỗi bất ngờ
    next(e);
  }
};

// PATCH /api/prompts/:id
export const updatePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Thiếu ID" });
    }

    const prompt = await updatePromptSvc({
      id,
      userId: req.user!,
      title: req.body.title,
      content: req.body.content,
    });
    res.json(prompt);
  } catch (e: any) {
    const msg = e.message || "Lỗi";
    const code = msg.includes("Không tìm thấy")
      ? 404
      : msg.includes("Không có quyền")
      ? 403
      : 500;
    res.status(code).json({ msg });
  }
};

// DELETE /api/prompts/:id
export const deletePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Thiếu ID" });
    }

    const ok = await deletePromptSvc({ id, userId: req.user! });
    res.json(ok);
  } catch (e: any) {
    const msg = e.message || "Lỗi";
    const code = msg.includes("Không tìm thấy")
      ? 404
      : msg.includes("Không có quyền")
      ? 403
      : 500;
    res.status(code).json({ msg });
  }
};

// POST /api/prompts/:id/upvote
export const upvotePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Thiếu ID" });
    }

    const prompt = await upvotePromptSvc(id);
    res.json(prompt);
  } catch (e: any) {
    const msg = e.message || "Lỗi";
    res.status(msg.includes("Không tìm thấy") ? 404 : 500).json({ msg });
  }
};


export const getMyStatsController = async (req: AuthRequest, res: Response) => {
  try {
    console.log("User:", req.user);
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const stats = await getUserPromptStats(req.user);
    return res.json({ success: true, data: stats });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};