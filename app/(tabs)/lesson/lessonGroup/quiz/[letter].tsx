import ASLCameraQuiz from "@/components/ASLCameraQuiz"; // Import the component above
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizScreen() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const [passed, setPassed] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="close" size={28} color="#022469" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice Quiz</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.promptText}>Sign the letter</Text>
        <Text style={styles.targetLetter}>{letter}</Text>

        {/* The Embedded Camera Component */}
        <ASLCameraQuiz
          targetLetter={letter}
          onSuccess={() => {
            setPassed(true);
            // You can add a delay here before navigating to the next question
          }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !passed && styles.nextButtonDisabled]}
          disabled={!passed}
        >
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#022469" },
  backButton: { padding: 5 },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  promptText: { fontSize: 18, color: "#022469", opacity: 0.8 },
  scrollArea: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  targetLetter: {
    fontSize: 64,
    fontWeight: "800",
    color: "#022469",
    marginBottom: 15,
  },

  footer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 10,
  },
  nextButton: {
    backgroundColor: "#022469",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  nextButtonDisabled: { backgroundColor: "#AEC6EE", opacity: 0.5 },
  nextButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
});
