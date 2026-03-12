import ASLCameraQuiz from "@/components/ASLCameraQuiz";
import { usePracticeTimeStore } from "@/components/store/usePracticeTimeStore";
import { useProgressStore } from "@/components/store/useProgressStore";
import { useStreakStore } from "@/components/store/useStreakStore";
import Instructions from "@/constants/Instructions";
import LessonGroup from "@/constants/LessonGroup";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const ASLLessonViewScreen = () => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [currentIndex, setCurrentIndex] = useState(0);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const updateStreak = useStreakStore((state) => state.updateStreak);
  const addCompletedLetter = useProgressStore(
    (state) => state.addCompletedLetter
  );
  const addPracticeTime = usePracticeTimeStore(
    (state) => state.addPracticeTime
  );

  useEffect(() => {
    if (!showQuiz) return;
    const startTime = Date.now();
    // The cleanup function runs automatically when showQuiz changes to false,
    // OR if the user navigates back/away while the quiz is still open.
    return () => {
      const endTime = Date.now();
      const secondsSpent = Math.floor((endTime - startTime) / 1000);
      if (secondsSpent > 0) {
        addPracticeTime(secondsSpent);
      }
    };
  }, [showQuiz]);

  const currentGroup = LessonGroup.find((lesson) => lesson.id === groupId);
  const currentSign = currentGroup?.signs[currentIndex] || "";
  const currentInstruction = Instructions?.[currentSign] || {};
  const player = useVideoPlayer(currentInstruction?.videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const totalLetters = currentGroup?.signs.length || 0;
  const progressPercentage = (currentIndex / totalLetters) * 100;

  // ==========================================
  // 1. QUIZ VIEW
  // ==========================================
  if (showQuiz) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.quizHeader}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // Allows the user to back out of the quiz to re-read instructions
              setShowQuiz(false);
              setQuizPassed(false);
            }}
          >
            <Ionicons name="arrow-back" size={28} color="#022469" />
          </TouchableOpacity>
          <Text style={styles.quizHeaderTitle}>Practice Quiz</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.promptText}>Sign the letter</Text>
          <Text style={styles.targetLetter}>{currentSign}</Text>

          <ASLCameraQuiz
            targetLetter={currentSign}
            onSuccess={() => {
              addCompletedLetter(groupId, currentSign);
              updateStreak();
              setQuizPassed(true);
            }}
          />
        </ScrollView>

        <View style={styles.quizFooter}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              // Note: We intentionally do NOT call addCompletedLetter here
              if (currentIndex < totalLetters - 1) {
                setCurrentIndex((prev) => prev + 1);
                setShowQuiz(false);
                setQuizPassed(false);
              } else {
                alert("Lesson Complete!");
                router.back();
              }
            }}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextQuizButton,
              !quizPassed && styles.nextButtonDisabled,
            ]}
            disabled={!quizPassed}
            onPress={() => {
              if (currentIndex < totalLetters - 1) {
                setCurrentIndex((prev) => prev + 1);
                setShowQuiz(false);
                setQuizPassed(false);
              } else {
                alert("Lesson Complete!");
                router.back();
              }
            }}
          >
            <Text style={styles.nextQuizButtonText}>
              {currentIndex === totalLetters - 1
                ? "Finish Lesson"
                : "Next Letter"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // 2. INSTRUCTION VIEW
  // ==========================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Navigation & Progress */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={28} color="#022469" />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${progressPercentage}%` }]}
            />
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          <Text style={styles.letterHighlight}>{currentSign}</Text>
          <Text style={styles.letterInstruction}>
            Palm position: {currentInstruction.palm}
            {"\n"}
            {currentInstruction.instruction}
          </Text>

          <View style={styles.mediaContainer}>
            {currentInstruction?.videoSource ? (
              <VideoView
                style={styles.video}
                player={player}
                contentFit="cover" // This fits the height and crops the width
                nativeControls={false} // Hides the play/pause UI overlays
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="hand-right-outline" size={80} color="#022469" />
                <Text style={styles.placeholderText}>
                  ASL "{currentSign}" Sign Image
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Navigation Controls */}
        <View style={styles.footer}>
          {currentIndex > 0 ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentIndex((prev) => prev - 1)}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              // Instead of advancing the index immediately, send them to the quiz!
              setShowQuiz(true);
            }}
          >
            <Text style={styles.primaryButtonText}>Practice Sign</Text>
            <Ionicons
              name="camera-outline"
              size={20}
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- Shared Styles ---
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  iconButton: { padding: 5 },

  // --- Instruction View Styles ---
  container: { flex: 1, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 15,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5EDFA",
    borderRadius: 4,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#022469",
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  letterHighlight: {
    fontSize: 80,
    fontWeight: "800",
    color: "#022469",
    marginBottom: 10,
  },
  letterInstruction: {
    fontSize: 16,
    color: "#022469",
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 40,
    lineHeight: 24,
  },
  mediaContainer: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: "#AEC6EE",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: {
    marginTop: 15,
    color: "#022469",
    fontWeight: "600",
    fontSize: 16,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#022469",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
    marginLeft: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  secondaryButton: {
    backgroundColor: "#E5EDFA",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 10,
  },
  secondaryButtonText: { color: "#022469", fontWeight: "700", fontSize: 16 },
  spacer: { flex: 1, marginRight: 10 },

  // --- Quiz View Styles ---
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  quizHeaderTitle: { fontSize: 20, fontWeight: "700", color: "#022469" },
  scrollArea: { flex: 1, width: "100%" },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  promptText: { fontSize: 18, color: "#022469", opacity: 0.8 },
  targetLetter: {
    fontSize: 64,
    fontWeight: "800",
    color: "#022469",
    marginBottom: 15,
  },
  quizFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  skipButton: {
    backgroundColor: "#E5EDFA",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 10,
  },
  skipButtonText: {
    color: "#022469",
    fontWeight: "700",
    fontSize: 16,
  },
  nextQuizButton: {
    backgroundColor: "#022469",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
    marginLeft: 10,
  },
  nextButtonDisabled: { backgroundColor: "#AEC6EE", opacity: 0.5 },
  nextQuizButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});

export default ASLLessonViewScreen;
