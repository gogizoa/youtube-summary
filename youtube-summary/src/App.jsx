import { useState, useEffect } from "react";
import { SummaryTab } from "./components/SummaryTab.jsx";
import { ContactTab } from "./components/ContactTab.jsx";
import { ChatTab } from "./components/ChatTab.jsx";
import "./App.css";
import { useVideoStore } from "./stores/VideoStore.js";

const App = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const setVideo = useVideoStore((state) => state.setVideo);
  const video = useVideoStore((state) => state.video);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await chrome.storage.local.get(["videoData"]);
        setVideo(result.videoData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // 빈 배열을 넣어 컴포넌트가 마운트될 때 한 번만 실행되도록 함

  const renderTabContent = () => {
    // if (!video) {
    //   return <div>Loading...</div>; // 데이터가 로딩 중일 때 표시할 내용
    // }

    switch (activeTab) {
      case "summary":
        return <SummaryTab />;
      case "chat":
        return <ChatTab />;
      case "contact":
        return <ContactTab />;
      default:
        return null;
    }
  };

  return (
    <div className="outer-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          요약
        </button>
        <button
          className={`tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          질문하기
        </button>
        <button
          className={`tab ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          문의하기
        </button>
      </div>
      <div className="main-content">{renderTabContent()}</div>
    </div>
  );
};

export default App;
