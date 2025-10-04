const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Chỉ hỗ trợ phương thức POST." }),
    };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("LỖI: GOOGLE_API_KEY chưa được thiết lập!");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Lỗi cấu hình máy chủ." }),
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Dữ liệu gửi lên không hợp lệ." }),
    };
  }

  const { question, lesson_id } = body;
  if (!question || question.length > 500) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Câu hỏi không hợp lệ hoặc quá dài." }),
    };
  }

  const lessonPrompts = {
    "thuc-hanh-do-toc-do": "Bạn là trợ lý AI giúp học sinh lớp 7 hiểu bài thực hành đo tốc độ. Trả lời ngắn gọn, dễ hiểu.",
    default: "Bạn là trợ lý AI giúp học sinh lớp 7 học vật lý. Trả lời ngắn gọn, dễ hiểu.",
  };

  const prompt = `${lessonPrompts[lesson_id] || lessonPrompts.default}\n\nCâu hỏi: ${question}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: text }),
    };
  } catch (err) {
    console.error("====== LỖI XẢY RA KHI GỌI GOOGLE API ======");
    console.error("Message:", err.message);
    console.error("==========================================");

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Đã xảy ra lỗi khi gọi AI." }),
    };
  }
};
