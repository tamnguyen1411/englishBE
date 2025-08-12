import { Request, Response } from "express";
import OpenAI from "openai";

type ExType = "vocab_mcq" | "grammar_mcq" | "cloze" | "reorder";
type Exercise = {
  id: string;
  type: ExType;
  prompt: string;
  passage?: string;
  choices?: string[];
  answerIndex?: number;
  answerText?: string;
  explanation_vi?: string;
};

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

export const generateExercises = async (req: Request, res: Response) => {
  try {
    const {
      topic = "daily life",
      level = "A2",
      types = ["vocab_mcq", "grammar_mcq", "cloze"],
      n = 5,
    } = req.body as {
      topic?: string;
      level?: "A1" | "A2" | "B1" | "B2" | "C1";
      types?: ExType[];
      n?: number;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ msg: "Chưa cấu hình OPENAI_API_KEY" });

    const client = new OpenAI({ apiKey });

    const system = `
Bạn là giáo viên tiếng Anh. Hãy tạo bài tập theo JSON schema:
{
  "meta": { "topic": string, "level": "A1"|"A2"|"B1"|"B2"|"C1", "count": number },
  "exercises": Exercise[]
}
Exercise = {
  "id": string,
  "type": "vocab_mcq"|"grammar_mcq"|"cloze"|"reorder",
  "prompt": string,
  "passage"?: string,
  "choices"?: string[],
  "answerIndex"?: number,
  "answerText"?: string,
  "explanation_vi": string
}

YÊU CẦU:
- Không kèm giải thích ngoài JSON.
- Ngôn ngữ câu hỏi/prompt bằng tiếng Anh; giải thích (explanation_vi) bằng tiếng Việt.
- Nội dung phù hợp level CEFR cung cấp.
- Với "cloze": dùng 1 đoạn ngắn (40–80 từ) và 3–6 chỗ trống dạng ____.
- Với "reorder": cho 1 câu bị xáo trộn 5–8 từ; answerText là câu đúng.
- Với MCQ: 1 đáp án đúng, 3 nhiễu, answerIndex (0..3).
`;

    const user = `
Generate ${Math.min(n, 12)} exercises.
topic="${topic}", level="${level}", allowedTypes=${JSON.stringify(types)}
Phân bố đều giữa các loại trong allowedTypes.
`;

    const out = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = out.choices?.[0]?.message?.content || "{}";
    const json = cleanJSON(raw);
    if (!json?.exercises) {
      return res.json({ meta: { topic, level, count: 0 }, exercises: [] });
    }

    // Sửa lỗi type assignment
    const exercises: Exercise[] = (json.exercises as any[]).slice(0, n).map(
      (e: any, i: number): Exercise => ({
        id: e.id || `ex-${i + 1}`,
        type: e.type,
        prompt: e.prompt,
        ...(e.passage && { passage: e.passage }),
        ...(e.choices && { choices: e.choices.slice(0, 4) }),
        ...(typeof e.answerIndex === "number" && {
          answerIndex: e.answerIndex,
        }),
        ...(e.answerText && { answerText: e.answerText }),
        ...(e.explanation_vi && { explanation_vi: e.explanation_vi }),
      })
    );
    console.log("Generated exercises:", exercises);
    return res.json({
      meta: { topic, level, count: exercises.length },
      exercises,
    });
  } catch (err) {
    console.error("generateExercises error:", err);
    return res.status(500).json({ msg: "Lỗi khi tạo bài tập" });
  }
};
