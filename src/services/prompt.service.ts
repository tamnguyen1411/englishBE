import Prompt from "../models/Prompt";
import mongoose from "mongoose";
import { checkEnglishLearningRelevance } from "../utils/aihelper";
import { HttpError } from "../utils/HttpError";



export async function listPrompts(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Prompt.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name"),
    Prompt.countDocuments(),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

export async function createPromptSvc(params: {
  title: string;
  content: string;
  userId: string;
}) {
  const { title, content, userId } = params;
  if (!title?.trim() || !content?.trim()) {
    throw new Error("Thiếu title/content");
  }

  console.log("Creating prompt:", title, content);


  // 2) Relevance check (liên quan học tiếng Anh?)
  const rel = await checkEnglishLearningRelevance(title, content);
  console.log("Relevance check result:", rel);
  if (!rel.is_related) {
    return {
      ok: false,
      msg: "Nội dung không liên quan đến học tiếng Anh",
      status: 422,
      data: { reason: rel.reason },
    };
  }

  const doc = await Prompt.create({
    title: title.trim(),
    content,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  return { ok: true, data: doc };
}

export async function updatePromptSvc(params: {
  id: string;
  userId: string;
  title?: string;
  content?: string;
}) {
  const { id, userId, title, content } = params;
  const prompt = await Prompt.findById(id);
  if (!prompt) throw new Error("Không tìm thấy");
  if (prompt.createdBy.toString() !== userId) throw new Error("Không có quyền");

  if (typeof title !== "undefined") prompt.title = title;
  if (typeof content !== "undefined") prompt.content = content;

  // Chỉ chạy AI nếu có thay đổi nội dung/trích đoạn
  if (typeof title !== "undefined" || typeof content !== "undefined") {
    
    const text = `${prompt.title}\n\n${prompt.content}`;
    
    const rel = await checkEnglishLearningRelevance(prompt.title, prompt.content);
    if (!rel.is_related) {
      throw new HttpError(422, "Nội dung không liên quan đến học tiếng Anh", {
        ok: false,
        reason: rel.reason, // nếu muốn gửi thêm lý do
      });
    }
  }

  await prompt.save();
  return prompt;
}

export async function deletePromptSvc(params: { id: string; userId: string }) {
  const { id, userId } = params;
  const prompt = await Prompt.findById(id);
  if (!prompt) throw new Error("Không tìm thấy");
  if (prompt.createdBy.toString() !== userId) throw new Error("Không có quyền");

  await prompt.deleteOne();
  return { msg: "Đã xoá" };
}

// Lưu ý: upvote nên ràng buộc theo user để chống spam (idempotent/toggle)
export async function upvotePromptSvc(id: string) {
  const prompt = await Prompt.findByIdAndUpdate(
    id,
    { $inc: { upvotes: 1 } },
    { new: true }
  );
  if (!prompt) throw new Error("Không tìm thấy");
  return prompt;
}

export async function getUserPromptStats(userId: string) {
  const result = await Prompt.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$createdBy",
        totalPosts: { $sum: 1 },
        totalUpvotes: { $sum: "$upvotes" },
      },
    },
  ]);

  if (result.length === 0) {
    return { totalPosts: 0, totalUpvotes: 0 };
  }

  return {
    totalPosts: result[0].totalPosts,
    totalUpvotes: result[0].totalUpvotes,
  };
}
