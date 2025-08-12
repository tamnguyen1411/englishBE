import { Request, Response } from "express";
import OpenAI from "openai";

function cleanJSON(s: string) {
  const t = s
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "");
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export const smartTranslate = async (req: Request, res: Response) => {
  try {
    const { text, target_lang = "vi" } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ msg: "Thiếu text" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ msg: "Chưa cấu hình OPENAI_API_KEY" });

    const client = new OpenAI({ apiKey });

    const system = `
Bạn là chuyên gia dịch thuật thông minh.
Trả về JSON:
{
  "translation": string,         // bản dịch tự nhiên, mượt
  "notes_vi": string,            // ghi chú ngắn (giải thích cách chọn từ, lưu ý ngữ pháp)
  "keywords": string[],          // từ/cụm quan trọng sau khi dịch
  "meta": {
    "detected_source_lang": string,
    "target_lang": string,
    "style": string               // formal, casual, neutral
  }
}
YÊU CẦU:
- Phát hiện ngôn ngữ nguồn và style dựa vào văn bản.
- Dịch giữ nguyên tên riêng/brand.
- Chọn từ ngữ phù hợp ngữ cảnh.
- Không kèm văn bản ngoài JSON.`;

    const user = `Text: """${text}"""\nTarget: ${target_lang}`;

    const out = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = out.choices?.[0]?.message?.content || "{}";
    const json = cleanJSON(raw);

    if (!json?.translation) {
      return res.json({
        translation: text,
        notes_vi: "Không phân tích được, trả nguyên văn.",
        keywords: [],
        meta: { detected_source_lang: "auto", target_lang, style: "neutral" },
      });
    }

    return res.json(json);
  } catch (err) {
    console.error("smartTranslate error:", err);
    return res.status(500).json({ msg: "Lỗi khi dịch văn bản" });
  }
};
