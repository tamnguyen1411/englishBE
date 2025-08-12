import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  listComments,
  createCommentSvc,
  deleteCommentSvc,
} from "../services/comment.service";

export const getByPrompt = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;
    if (!promptId) {
      return res.status(400).json({ msg: "Thiếu promptId" });
    }

    const items = await listComments(promptId);
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ msg: e.message || "Lỗi server" });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { promptId } = req.params;
    const { content } = req.body;

    if (!promptId) {
      return res.status(400).json({ msg: "Thiếu promptId" });
    }
    if (!content?.trim()) {
      return res.status(400).json({ msg: "Thiếu nội dung" });
    }

    const c = await createCommentSvc(promptId, content, req.user!);
    res.status(201).json(c);
  } catch (e: any) {
    res.status(500).json({ msg: e.message || "Lỗi server" });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Thiếu ID" });
    }

    await deleteCommentSvc(id, req.user!);
    res.json({ msg: "Đã xoá" });
  } catch (e: any) {
    res
      .status(e.message.includes("quyền") ? 403 : 404)
      .json({ msg: e.message });
  }
};
