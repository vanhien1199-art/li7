const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY chưa được thiết lập.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Thiếu GOOGLE_API_KEY trong môi trường." }),
    };
  }

  const url = "https://generativelanguage.googleapis.com/v1/models";
  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };

  try {
    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json();

    if (data.models) {
      const models = data.models.map((m) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        methods: m.supportedGenerationMethods,
      }));
      return {
        statusCode: 200,
        body: JSON.stringify({ availableModels: models }, null, 2),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Không thể lấy danh sách mô hình." }),
      };
    }
  } catch (err) {
    console.error("❌ Lỗi khi gọi Google API:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Lỗi khi gọi Google API." }),
    };
  }
};
