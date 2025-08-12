import Comment from "../models/Comment";

export const listComments = (promptId: string) =>
  Comment.find({ prompt: promptId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name");

export const createCommentSvc = (
  promptId: string,
  content: string,
  userId: string
) => Comment.create({ prompt: promptId, content, createdBy: userId });

export const deleteCommentSvc = async (id: string, userId: string) => {
  const c = await Comment.findById(id);
  if (!c) throw new Error("Không tìm thấy");
  if (c.createdBy.toString() !== userId) throw new Error("Không có quyền");
  await c.deleteOne();
};
