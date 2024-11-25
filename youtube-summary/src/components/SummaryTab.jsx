import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export const SummaryTab = ({ video_info }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      if (typeof chrome === "undefined" || !chrome.storage) {
        throw new Error("Chrome storage API not available");
      }

      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/summary/${video_info?.id}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summary-section">
      {loading ? (
        <p className="loading-text">데이터 가져오는중....</p>
      ) : (
        <>
          {error && <p className="error-message">{error}</p>}
          {summary && (
            <ReactMarkdown>
              {`## ${video_info?.title} 요약\n${summary.summary}`}
            </ReactMarkdown>
          )}
        </>
      )}
    </div>
  );
};
