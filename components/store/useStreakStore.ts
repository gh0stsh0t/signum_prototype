import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface StreakState {
  streakCount: number;
  lastPracticeDate: string | null;
  updateStreak: () => void;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      streakCount: 0,
      lastPracticeDate: null,

      updateStreak: () => {
        set((state) => {
          const today = new Date();
          // Format as YYYY-MM-DD to ignore the exact time of day
          const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

          if (!state.lastPracticeDate) {
            // First time practicing ever
            return { streakCount: 1, lastPracticeDate: todayString };
          }

          if (state.lastPracticeDate === todayString) {
            // Already practiced today, keep streak as is
            return state;
          }

          // Calculate what yesterday's date string should be
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

          if (state.lastPracticeDate === yesterdayString) {
            // Practiced yesterday, increment streak!
            return {
              streakCount: state.streakCount + 1,
              lastPracticeDate: todayString,
            };
          }

          // Streak broken (practiced more than 1 day ago), reset to 1
          return { streakCount: 1, lastPracticeDate: todayString };
        });
      },
    }),
    {
      name: "asl-streak-storage", // Unique key for this specific store
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
