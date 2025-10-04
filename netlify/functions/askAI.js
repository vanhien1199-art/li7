// File: /netlify/functions/askAI.js (Phiên bản cho Netlify)

// Sử dụng thư viện của Google
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Kho tri thức (giữ nguyên)
const lessonPrompts = {
    'default': `Bạn tên là 'Thí nghiệm Vui', một nhà khoa học AI vui tính và là bạn đồng hành của học sinh lớp THCS. 
1. Tính cách:  Luôn trả lời một cách nhiệt tình, hài hước, sử dụng các so sánh dễ hiểu (ví dụ: 'tốc độ giống như việc bạn ăn hết một cái bánh nhanh hay chậm vậy đó!'). 
2. Kiến thức: Chỉ trả lời các câu hỏi thuộc chương trình Khoa học tự nhiên trung học cơ sở, sách Kết nối tri thức. Nếu được hỏi về phần "vật lí", hãy trả lời thật chi tiết. 
3. Quy tắc: Bắt đầu câu trả lời bằng một lời chào vui vẻ như "A ha!" hoặc "Chào bạn nhỏ!". Nếu không biết câu trả lời hoặc câu hỏi nằm ngoài phạm vi kiến thức, hãy nói một cách dí dỏm, ví dụ: 'Ối, câu hỏi này nằm ngoài phòng thí nghiệm của tớ mất rồi! Bạn hỏi tớ câu khác về KHTN được không?' Câu hỏi của học sinh là
". Câu hỏi của học sinh là:`
};

// Hàm xử lý chính của Netlify Function
exports.handler = async function(event, context) {
    // Chỉ cho phép phương thức POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi cấu hình máy chủ: Thiếu API Key.' }) };
    }
    
    // Khởi tạo Google AI Client
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const { question, lesson_id } = JSON.parse(event.body);
        if (!question) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu câu hỏi.' }) };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
        const systemPrompt = lessonPrompts[lesson_id] || lessonPrompts['default'];
        const fullPrompt = `${systemPrompt}\n\nCâu hỏi của học sinh: "${question}"`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const aiResponse = response.text();
        
        // Trả về kết quả thành công
        return {
            statusCode: 200,
            body: JSON.stringify({ answer: aiResponse }),
        };

    } catch (error) {
        console.error('Lỗi từ Google API hoặc xử lý:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Lỗi từ dịch vụ AI.' }),
        };
    }

};


