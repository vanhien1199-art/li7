document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // THAY ĐỔI QUAN TRỌNG: URL của "bộ não" AI giờ là một đường dẫn tương đối
    const AI_SERVICE_URL = '/.netlify/functions/askAI'; 

    const LESSON_ID = window.lessonId || 'default';

    if(sendButton){
        sendButton.addEventListener('click', askAI);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                askAI();
            }
        });
    }

    // ... (Hàm addMessageToChat giữ nguyên không đổi) ...
    function addMessageToChat(text, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', className);
        chatWindow.appendChild(messageElement);
        messageElement.innerHTML = marked.parse(text);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return messageElement;
    }

    async function askAI() {
        const question = userInput.value.trim();
        if (!question) return;

        addMessageToChat(question, 'user-message');
        userInput.value = '';
        const waitingMessage = addMessageToChat('Trợ lý AI đang suy nghĩ...', 'ai-message');

        try {
            const response = await fetch(AI_SERVICE_URL, { // URL đã được cập nhật
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    lesson_id: LESSON_ID
                })
            });

            if (!response.ok) {
                throw new Error('Lỗi mạng hoặc server');
            }
            
            const data = await response.json();
            waitingMessage.innerHTML = marked.parse(data.answer);

        } catch (error) {
            waitingMessage.innerHTML = marked.parse('**Xin lỗi, đã có lỗi xảy ra!** Vui lòng thử lại sau.');
        }
    }
});