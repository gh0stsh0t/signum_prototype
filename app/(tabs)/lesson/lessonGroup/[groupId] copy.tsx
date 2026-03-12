import Instructions from "@/constants/Instructions";
import LessonGroup from "@/constants/LessonGroup";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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

  const currentGroup = LessonGroup.find((lesson) => lesson.id === groupId);
  const currentSign = currentGroup?.signs[currentIndex] || "";
  const currentInstruction = Instructions?.[currentSign] || {};

  const totalLetters = currentGroup?.signs.length || 0;
  const progressPercentage = ((currentIndex + 1) / totalLetters) * 100;

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

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="flag-outline" size={24} color="#022469" />
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          {/* Letter Display */}
          <Text style={styles.letterHighlight}>{currentSign}</Text>
          <Text style={styles.letterInstruction}>
            {currentInstruction.instruction}
          </Text>

          {/* Image/Video Container for the Sign */}
          <View style={styles.mediaContainer}>
            {/* Replace this placeholder with your actual ASL image or video component */}
            <View style={styles.imagePlaceholder}>
              <Ionicons name="hand-right-outline" size={80} color="#022469" />
              <Text style={styles.placeholderText}>
                ASL "{currentSign}" Sign Image
              </Text>
            </View>
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
              if (currentIndex < totalLetters - 1) {
                setCurrentIndex((prev) => prev + 1);
                // router.navigate(`./quiz/${currentSign}`);
              } else {
                // Handle lesson completion
                alert("Lesson Complete!");
              }
            }}
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === totalLetters - 1 ? "Finish" : "Next"}
            </Text>
            <Ionicons
              name={
                currentIndex === totalLetters - 1
                  ? "checkmark"
                  : "arrow-forward"
              }
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
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 15,
  },
  iconButton: {
    padding: 5,
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
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 15,
    color: "#022469",
    fontWeight: "600",
    fontSize: 16,
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
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
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
  secondaryButtonText: {
    color: "#022469",
    fontWeight: "700",
    fontSize: 16,
  },
  spacer: {
    flex: 1,
    marginRight: 10,
  },
});

export default ASLLessonViewScreen;
