import { Request, Response } from "express";
import OpenAI from "openai";

export const grammarFix = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    console.log(apiKey, "apikey");

    const client = new OpenAI({ apiKey });
    if (!text?.trim()) {
      return res.status(400).json({ msg: "Thiếu text" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ msg: "OpenAI API key chưa được cấu hình" });
    }

    const system =
      "You are an English teacher. Correct grammar and explain briefly in Vietnamese. Return JSON with { corrected, explanation }.";
    const user = `Text: """${text}"""`;

    const out = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const json = out.choices[0]?.message?.content || "{}";
    console.log("AI response:", json);
    res.json(JSON.parse(json));
  } catch (error: any) {
    console.error("OpenAI error:", error);
    res.status(500).json({ msg: "Lỗi khi gọi AI service" });
  }
};
