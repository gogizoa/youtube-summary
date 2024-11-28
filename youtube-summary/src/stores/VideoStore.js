import { create } from "zustand";
import { fetchVideoSummary } from "../queries/video";

const useVideoStore = create((set, get) => ({
  // Initial state
  currentVideo: null,
  isPopupOpen: false,
  activeTab: "summary", // 'summary' | 'query'
  isSummaryLoading: false,

  // Actions
  setVideo: (video) =>
    set({
      currentVideo: {
        videoId: video.videoId,
        title: video.title,
      },
    }),

  updateSummary: (summary) =>
    set((state) => ({
      currentVideo: state.currentVideo
        ? { ...state.currentVideo, summary }
        : null,
    })),

  clearVideo: () => set({ currentVideo: null }),

  setIsPopupOpen: (isPopupOpen) => set({ isPopupOpen }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setIsSummaryLoading: (isSummaryLoading) => set({ isSummaryLoading }),

  // 액션 함수들
  generateSummary: async () => {
    const store = get();
    const videoId = store.currentVideo?.videoId;

    if (!videoId) return;

    set({ isSummaryLoading: true }); // isSummaryLoading으로 일관성 유지

    try {
      const summaryResult = await fetchVideoSummary(videoId);
      store.updateSummary(summaryResult); // 기존 updateSummary 활용
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      set({ isSummaryLoading: false });
    }
  },
}));

export default useVideoStore;
