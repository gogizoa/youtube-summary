// queries/video.js
export const fetchVideoSummary = async (videoId) => {
  try {
    // API 호출 로직
    const response = await fetch(
      `http://localhost:8000/api/summary/${videoId}`
    );
    return await response.json();
  } catch (error) {
    throw new Error("Failed to fetch summary");
  }
};
