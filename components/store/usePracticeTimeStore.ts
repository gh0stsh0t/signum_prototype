import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PracticeTimeState {
  totalSeconds: number;
  addPracticeTime: (seconds: number) => void;
}

export const usePracticeTimeStore = create<PracticeTimeState>()(
  persist(
    (set) => ({
      totalSeconds: 0,

      addPracticeTime: (seconds) => {
        set((state) => ({
          totalSeconds: state.totalSeconds + seconds,
        }));
      },
    }),
    {
      name: "asl-practice-time-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
