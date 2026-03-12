import LessonGroup from "@/constants/LessonGroup";
export const getLessonList = (completedLettersData: Record<string, string[]>) =>
  LessonGroup.map((lessonDetails, index) => {
    const completedSigns = completedLettersData[lessonDetails.id] || [];
    const totalSigns = lessonDetails.signs?.length || 1;

    const progressPercent = Math.round(
      (completedSigns.length / totalSigns) * 100
    );

    // Determine Status
    let status: "locked" | "in-progress" | "completed" = "locked";

    if (progressPercent === 100) {
      status = "completed";
    } else {
      // Check if previous lesson is started to unlock this one
      const isFirstLesson = index === 0;
      const prevLessonId = index > 0 ? LessonGroup[index - 1].id : null;
      const prevLessonCompletedSigns = prevLessonId
        ? completedLettersData[prevLessonId] || []
        : [];

      const isPrevLessonOngoing = prevLessonCompletedSigns.length > 0;

      if (isFirstLesson || isPrevLessonOngoing || completedSigns.length > 0) {
        status = "in-progress";
      }
    }

    return {
      ...lessonDetails,
      status,
      progress: `${progressPercent}%`, // Renamed from score
    };
  });
