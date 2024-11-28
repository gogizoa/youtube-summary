import { create } from "zustand";

export const useVideoStore = create((set) => ({
  video: null,
  setVideo: (videoInfo) => set({ video: videoInfo }),
}));
