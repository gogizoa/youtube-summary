import { create } from "zustand";

export const useMessageStore = create((set) => ({
  messages: [],
  setMessages: (newMessages) => set({ messages: newMessages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessage: () => set({ message: [] }),
}));
