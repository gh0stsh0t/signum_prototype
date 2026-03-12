import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProgressState {
  // Key is groupId, value is an array of completed letters
  completedLetters: Record<string, string[]>;
  addCompletedLetter: (groupId: string, letter: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLetters: {},

      addCompletedLetter: (groupId, letter) => {
        const currentLetters = get().completedLetters[groupId] || [];

        // Only add the letter if it's not already in the array
        if (!currentLetters?.includes(letter)) {
          set((state) => ({
            completedLetters: {
              ...state.completedLetters,
              [groupId]: [...currentLetters, letter],
            },
          }));
        }
      },
    }),
    {
      name: "asl-progress-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
