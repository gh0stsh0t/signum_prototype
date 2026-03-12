const LETTERS_IDS = ["1", "2", "3", "4", "5"];
export const getAlphabetCompletion = (
  completedLettersData: Record<string, string[]>
) =>
  LETTERS_IDS.reduce(
    (acc, id) => (acc = (completedLettersData[id]?.length || 0) + acc),
    0
  );
