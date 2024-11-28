import { useState, useEffect, useRef } from "react";
import { useVideoStore } from "../stores/VideoStore";
import { useMessageStore } from "../stores/MessageStore";

export const ChatTab = () => {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const video = useVideoStore((state) => state.video);
  const messages = useMessageStore((state) => state.messages);
  const addMessage = useMessageStore((state) => state.addMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && !isLoading) {
      const userMessage = { text: newMessage, type: "user" };
      addMessage(userMessage);
      setNewMessage("");
      setIsLoading(true);

      try {
        const response = await fetch(`/api/chat/${video?.id}`, {
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

        addMessage({
          text: data.answer,
          type: "bot",
          sources: data.sources,
        });
      } catch (error) {
        console.error("Error:", error);
        addMessage({
          text: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          type: "bot",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        <div className="messages-wrapper">
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.type}`}>
              <div className={`message-bubble ${msg.type}`}>
                <p>{msg.text}</p>
                {msg.sources && (
                  <div className="sources">
                    <p className="sources-title">참고 내용:</p>
                    {msg.sources.map((source, idx) => (
                      <p key={idx} className="source-text">
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
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="질문을 입력하세요..."
              disabled={isLoading}
              className="message-input"
            />
            <button type="submit" disabled={isLoading} className="send-button">
              {isLoading ? "전송 중..." : "전송"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
