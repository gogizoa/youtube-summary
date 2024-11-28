// src/components/DraggablePopup.jsx
import React, { useState, useRef, useEffect } from "react";
import useVideoStore from "../stores/VideoStore";
import Summary from "./Summary";

const DraggablePopup = () => {
  const isPopupOpen = useVideoStore((state) => state.isPopupOpen);
  const setIsPopupOpen = useVideoStore((state) => state.setIsPopupOpen);
  const activeTab = useVideoStore((state) => state.activeTab);
  const setActiveTab = useVideoStore((state) => state.setActiveTab);

  const [position, setPosition] = useState({
    x: window.innerWidth - 720,
    y: 10,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains("popup-header")) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 검사
      const maxX = window.innerWidth - popupRef.current.offsetWidth;
      const maxY = window.innerHeight - popupRef.current.offsetHeight;

      setPosition({
        x: Math.min(Math.max(0, newX), maxX),
        y: Math.min(Math.max(0, newY), maxY),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isPopupOpen) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPopupOpen, isDragging]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return <Summary />;
      case "query":
        return <div>영상에 대해 질문해보세요...</div>;
      default:
        return null;
    }
  };

  if (!isPopupOpen) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "700px",
        height: "550px",
        backgroundColor: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        borderRadius: "8px",
        zIndex: 9999,
      }}
    >
      <div
        className="popup-header"
        onMouseDown={handleMouseDown}
        style={{
          borderBottom: "1px solid #e1e1e1",
          display: "flex",
          backgroundColor: "#f8f8f8",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex" }}>
          <button
            onClick={() => setActiveTab("summary")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === "summary" ? "2px solid #2ea043" : "none",
              fontWeight: activeTab === "summary" ? "bold" : "normal",
            }}
          >
            영상 요약
          </button>
          <button
            onClick={() => setActiveTab("query")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === "query" ? "2px solid #2ea043" : "none",
              fontWeight: activeTab === "query" ? "bold" : "normal",
            }}
          >
            내용 질의
          </button>
        </div>
        <button
          onClick={() => setIsPopupOpen(false)}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "16px",
            padding: "12px 24px",
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          padding: "16px",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DraggablePopup;
