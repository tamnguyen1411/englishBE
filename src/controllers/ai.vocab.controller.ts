
import { Request, Response } from "express";
import OpenAI from "openai";

type VocabItem = {
  word: string;
  pos?: string; 
  meaning_vi: string;
  cefr?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  example_en: string;
  example_vi?: string;
  synonyms?: string[];
  collocations?: string[];
};

function safeParseJSON(s: string) {
  try {
    const cleaned = s
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "");
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export const vocabAssist = async (req: Request, res: Response) => {
  try {
    const { text, limit = 6 } = req.body as { text?: string; limit?: number };
    if (!text?.trim()) return res.status(400).json({ msg: "Thiếu text" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ msg: "OpenAI API key chưa cấu hình" });

    const client = new OpenAI({ apiKey });

    const system = `
Bạn là giáo viên tiếng Anh. Phân tích đoạn văn của người học và TRẢ VỀ JSON theo schema:
{
  "corrected": string, // nếu câu có lỗi thì sửa; nếu không, giữ nguyên
  "vocab": VocabItem[], // 4-8 từ/cụm quan trọng
  "quiz": {
    "questions": [
      {
        "q": string, // câu hỏi trắc nghiệm (ENG)
        "choices": string[4],
        "answerIndex": number, // 0..3
        "explain_vi": string
      }
    ]
  }
}
Trong đó VocabItem = {
  "word": string,
  "pos": string,
  "meaning_vi": string,
  "cefr": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
  "example_en": string,
  "example_vi": string,
  "synonyms": string[], // tối đa 3
  "collocations": string[] // tối đa 3
}

YÊU CẦU:
- Giữ câu trả lời ngắn gọn, đúng JSON, không kèm giải thích ngoài JSON.
- Quiz dựa trên nội dung đã phân tích (từ vựng/ý chính). 3 câu hỏi.
- corrected phải tự nhiên, không thay đổi ý nghĩa.
- vocab.length tối đa theo 'limit' yêu cầu từ người dùng.
`;

    const user = `Đoạn văn: """${text}"""\nlimit: ${Math.min(+limit || 6, 12)}`;

    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = ai.choices?.[0]?.message?.content || "{}";
    const json = safeParseJSON(raw);

    if (!json) {
      return res.status(200).json({
        corrected: text,
        vocab: [],
        quiz: { questions: [] },
      });
    }

    return res.json(json);
  } catch (err) {
    console.error("vocabAssist error:", err);
    return res.status(500).json({ msg: "Lỗi khi gọi AI service" });
  }
};
