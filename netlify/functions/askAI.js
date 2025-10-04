// File: /netlify/functions/askAI.js (Phiên bản nâng cấp với lỗi chi tiết)

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Kho tri thức (giữ nguyên)
const lessonPrompts = {
    // ... (toàn bộ danh sách lessonPrompts của thầy/cô) ...
    'do-toc-do': `Bạn là một trợ giảng AI chuyên sâu về bài học "Đo tốc độ"...`,
    'quang-hop': `Bạn là một nhà thực vật học AI, chuyên gia về bài học "Quang hợp"...`,
    'co-nang': `Bạn là một nhà vật lý AI, chuyên gia về bài học "Cơ năng"...`,
    'phan-xa-toan-phan': `Bạn là một chuyên gia vật lý AI, giải đáp các thắc mắc về bài học "Phản xạ toàn phần"...`,
    'lang-kinh': `Bạn là một chuyên gia vật lý quang học, giải đáp các thắc mắc về bài học "Lăng kính"...`,
    'thau-kinh': `Bạn là một chuyên gia vật lý quang học, giải đáp các thắc mắc về bài học "Thấu kính"...`,
    'thuc-hanh-do-toc-do': `Bạn là một trợ lý phòng thí nghiệm ảo, hướng dẫn học sinh lớp 8 thực hành bài "Đo tốc độ"...`,
    'ap-suat-chat-long-khi-quyen': `Bạn là một chuyên gia vật lý, giải đáp các thắc mắc về bài học "Áp suất chất lỏng và Áp suất khí quyển"...`,
    'luc-day-archimedes': `Bạn là một chuyên gia vật lý, giải đáp các thắc mắc về bài học "Lực đẩy Archimedes"...`,
    'moment-luc': `Bạn là một chuyên gia vật lý, giải đáp các thắc mắc về bài học "Moment lực"...`,
    'don-bay': `Bạn là một chuyên gia vật lý, giải đáp các thắc mắc về bài học "Đòn bẩy và ứng dụng"...`,
    'toc-do-an-toan-giao-thong': `Bạn là một chuyên gia về an toàn giao thông, giải đáp các thắc mắc về bài học "Tốc độ và An toàn giao thông"...`,
    'default': `Bạn là một trợ giảng chung cho môn Khoa học Tự nhiên.`
};

// Hàm xử lý chính của Netlify Function
exports.handler = async function(event, context) {
    // 1. Kiểm tra các điều kiện đầu vào một cách chặt chẽ
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Phương thức không được hỗ trợ.' }) };
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("LỖI CẤU HÌNH: Biến môi trường GOOGLE_API_KEY chưa được thiết lập!");
        return { statusCode: 500, body: JSON.stringify({ error: 'Lỗi cấu hình phía máy chủ: Thiếu API Key.' }) };
    }
    
    // 2. Bắt lỗi ngay từ khâu phân tích dữ liệu gửi lên
    let question, lesson_id;
    try {
        const body = JSON.parse(event.body);
        question = body.question;
        lesson_id = body.lesson_id;
        if (!question) {
            throw new Error("Dữ liệu 'question' bị thiếu trong yêu cầu.");
        }
    } catch (parseError) {
        console.error("Lỗi phân tích cú pháp JSON:", parseError.message);
        return {
            statusCode: 400, // Bad Request - Yêu cầu không hợp lệ
            body: JSON.stringify({ error: `Yêu cầu không hợp lệ: ${parseError.message}` }),
        };
    }

    // 3. Khối try...catch chính để gọi API và xử lý lỗi
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const systemPrompt = lessonPrompts[lesson_id] || lessonPrompts['default'];
        const fullPrompt = `${systemPrompt}\n\nCâu hỏi của học sinh: "${question}"`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        
        // 4. Xử lý trường hợp Google chặn phản hồi (ví dụ: vì lý do an toàn)
        const aiResponseText = response.text();
        if (!aiResponseText) {
            const blockReason = response.promptFeedback?.blockReason || 'Không rõ lý do';
            console.warn(`Phản hồi từ Google bị chặn. Lý do: ${blockReason}`);
            const userFriendlyReason = `(Lý do từ Google: ${blockReason})`;
            return {
                statusCode: 200, // Yêu cầu vẫn hợp lệ, chỉ là không có nội dung trả về
                body: JSON.stringify({ answer: `Rất tiếc, tôi không thể trả lời câu hỏi này. ${userFriendlyReason}` }),
            };
        }

        // Trả về kết quả thành công
        return {
            statusCode: 200,
            body: JSON.stringify({ answer: aiResponseText }),
        };

    } catch (error) {
        // 5. Ghi log lỗi chi tiết và trả về thông báo lỗi cụ thể hơn
        console.error("====== LỖI XẢY RA KHI GỌI GOOGLE API ======");
        console.error("Message:", error.message);
        
        // Google API thường trả về lỗi có cấu trúc, hãy ghi lại nó nếu có
        if (error.cause) {
            console.error("Details:", JSON.stringify(error.cause, null, 2));
        }
        
        console.error("==========================================");

        // Tạo thông báo lỗi có ý nghĩa hơn để trả về cho người dùng
        let userErrorMessage = 'Đã có lỗi không xác định từ dịch vụ AI.';
        if (error.message.includes('API key not valid')) {
            userErrorMessage = 'Lỗi xác thực: API Key không hợp lệ hoặc đã hết hạn.';
        } else if (error.message.includes('404')) {
            userErrorMessage = 'Lỗi cấu hình: Tên model không được tìm thấy.';
        } else if (error.message.includes('403')) {
            userErrorMessage = 'Lỗi quyền truy cập: Dịch vụ API chưa được bật hoặc bị chặn.';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
            userErrorMessage = 'Lỗi mạng: Không thể kết nối đến máy chủ của Google.';
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: userErrorMessage }), // Trả về lỗi cụ thể hơn
        };
    }
};



