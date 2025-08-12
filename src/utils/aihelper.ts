import OpenAI from "openai";

// console.log(process.env.OPENAI_API_KEY);
// const client = new OpenAI({
//   apiKey:
//     process.env.OPENAI_API_KEY ,
// });



export type RelevanceResult = {
  is_related: boolean; // tổng thể có liên quan học tiếng Anh không
  reason: string; // lý do chi tiết, tiếng Việt
};

type RawRelevance = {
  is_related_overall: boolean;
  is_title_related: boolean;
  is_content_related: boolean;
  reason: string;
};

export async function checkEnglishLearningRelevance(
  title: string,
  content: string
): Promise<RelevanceResult> {
  const safeTitle = (title ?? "").trim();
  const safeContent = (content ?? "").trim();

  const schema = {
    name: "RelevanceSchema",
    schema: {
      type: "object",
      properties: {
        is_related_overall: { type: "boolean" },
        is_title_related: { type: "boolean" },
        is_content_related: { type: "boolean" },
        reason: { type: "string" },
      },
      required: [
        "is_related_overall",
        "is_title_related",
        "is_content_related",
        "reason",
      ],
      additionalProperties: false,
    },
    strict: true,
  } as const;

  const apiKey = process.env.OPENAI_API_KEY;
  console.log(apiKey, "apikey");

  const client = new OpenAI({ apiKey });

  const system = `
Bạn là bộ lọc nội dung. Nhiệm vụ: đánh giá riêng từng phần (TITLE, CONTENT) xem có LIÊN QUAN đến "học tiếng Anh" hay không.

"Liên quan" bao gồm: luyện ngữ pháp, từ vựng, kỹ năng speaking, listening, tips học, tài liệu học, câu hỏi/đáp án/sửa bài tiếng Anh, ví dụ minh hoạ học thuật.
Không liên quan: bán hàng không dính tiếng Anh, chuyện cá nhân không đề cập học tiếng Anh, spam, quảng cáo, nội dung chính trị, v.v.

Yêu cầu:
- is_title_related: true/false cho tiêu đề
- is_content_related: true/false cho nội dung
- is_related_overall: true nếu ÍT NHẤT MỘT trong hai phần liên quan một cách đáng kể (hoặc cả hai đều liên quan)
- reason: viết bằng TIẾNG VIỆT hoàn toàn, chi tiết và rõ ràng, nêu cụ thể phần nào liên quan hoặc không, và tại sao. Giữ văn phong ngắn gọn nhưng đầy đủ thông tin.
`.trim();

  const user = `TITLE:
"""${safeTitle}"""

CONTENT:
"""${safeContent}"""`;

  try {
    const out = await client.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
      temperature: 0,
    });

    const contentStr = out.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(contentStr) as RawRelevance;

    return {
      is_related: parsed.is_related_overall,
      reason: parsed.reason,
    };
  } catch (err) {
    console.error("Relevance check error:", err);
    return {
      is_related: false,
      reason: "Không kiểm tra được mức độ liên quan do lỗi hệ thống.",
    };
  }
}
