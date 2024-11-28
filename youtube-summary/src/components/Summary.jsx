import React from "react";
import ReactMarkdown from "react-markdown";
import useVideoStore from "../stores/VideoStore";

const Summary = () => {
  const currentVideo = useVideoStore((state) => state.currentVideo);
  const isSummaryLoading = useVideoStore((state) => state.isSummaryLoading);
  const generateSummary = useVideoStore((state) => state.generateSummary);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(currentVideo.summary.summary);
      alert("복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isSummaryLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
        }}
      >
        <div>로딩 중...</div>
      </div>
    );
  }

  if (!currentVideo.summary) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "16px",
        }}
      >
        <div style={{ color: "#666" }}>아직 요약이 생성되지 않았습니다.</div>
        <button
          onClick={generateSummary}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2ea043",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          요약 생성하기
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", position: "relative" }}>
      {/* 헤더 영역 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {currentVideo.title}
          <span style={{ color: "#666" }}>SUMMARY</span>
        </h1>

        {/* 버튼 그룹 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={() => {
              /* 정보 표시 로직 */
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
            }}
          >
            ℹ️
          </button>
          <button
            onClick={generateSummary}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
            }}
          >
            🔄
          </button>
          <button
            onClick={handleCopyClick}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
            }}
          >
            📋
          </button>
        </div>
      </div>

      {/* 마크다운 내용 */}
      <div
        style={{
          fontSize: "16px",
          lineHeight: "1.6",
        }}
      >
        <ReactMarkdown>{currentVideo.summary.summary}</ReactMarkdown>
      </div>
    </div>
  );
};

export default Summary;
