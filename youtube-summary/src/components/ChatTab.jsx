import { useState, useEffect, useRef } from "react";

export const ChatTab = ({ video_info }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && !isLoading) {
      // 사용자 메시지 추가
      const userMessage = { text: newMessage, type: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setNewMessage("");
      setIsLoading(true);

      try {
        // API 요청
        const response = await fetch(`/api/chat/${video_info?.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: newMessage.trim() }),
        });

        if (!response.ok) {
          throw new Error("API 요청이 실패했습니다.");
        }

        const data = await response.json();

        // AI 응답 추가
        setMessages((prev) => [
          ...prev,
          {
            text: data.answer,
            type: "bot",
            sources: data.sources,
          },
        ]);
      } catch (error) {
        console.error("Error:", error);
        // 에러 메시지 추가
        setMessages((prev) => [
          ...prev,
          {
            text: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            type: "bot",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              {msg.sources && (
                <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                  <p className="font-semibold">참고 내용:</p>
                  {msg.sources.map((source, idx) => (
                    <p key={idx} className="mt-1">
                      {source}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-lg px-6 py-2 text-white ${
              isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? "전송 중..." : "전송"}
          </button>
        </form>
      </div>
    </div>
  );
};
