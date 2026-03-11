import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
const renderIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <Ionicons name="checkmark-circle" size={24} color="#022469" />;
    case "in-progress":
      return <Ionicons name="play-circle" size={24} color="#022469" />;
    case "locked":
      return <Ionicons name="lock-closed" size={20} color="#6B8ECA" />;
    default:
      return null;
  }
};
const ASLLettersScreen = () => {
  const lessons = [
    { id: "1", title: "Letters A - E", status: "completed", score: "100%" },
    { id: "2", title: "Letters F - J", status: "in-progress", score: "45%" },
    { id: "3", title: "Letters K - O", status: "locked", score: null },
    { id: "4", title: "Letters P - T", status: "locked", score: null },
    { id: "5", title: "Letters U - Z", status: "locked", score: null },
  ];
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#022469" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ASL Alphabet</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Master the Basics</Text>
            <Text style={styles.heroSubtitle}>
              Learn the 26 letters of the ASL alphabet to start fingerspelling.
            </Text>

            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue Learning</Text>
            </TouchableOpacity>
          </View>

          {/* Decorative Circle representing progress/graphic */}
          <View style={styles.heroProgressCircle}>
            <Text style={styles.heroProgressText}>18%</Text>
          </View>
        </View>

        {/* Lesson List */}
        <View style={styles.lessonHeaderContainer}>
          <Text style={styles.sectionTitle}>Lesson Modules</Text>
          <Ionicons name="grid" size={20} color="#022469" />
        </View>

        {lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={[
              styles.lessonCard,
              lesson.status === "locked" && styles.lessonCardLocked,
            ]}
            disabled={lesson.status === "locked"}
            onPress={() => router.navigate("./lesson/letter")}
          >
            <View style={styles.lessonInfo}>
              <Text
                style={[
                  styles.lessonTitle,
                  lesson.status === "locked" && styles.lessonTitleLocked,
                ]}
              >
                {lesson.title}
              </Text>
              {lesson.score && (
                <Text style={styles.lessonSubtitle}>
                  Accuracy: {lesson.score}
                </Text>
              )}
              {lesson.status === "locked" && (
                <Text style={styles.lessonSubtitleLocked}>
                  Complete previous lessons
                </Text>
              )}
            </View>

            <View style={styles.iconContainer}>
              {renderIcon(lesson.status)}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 25,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#022469", // Deep Navy from theme
  },
  heroCard: {
    backgroundColor: "#AEC6EE", // Soft light blue from theme
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    // Optional shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#022469",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#022469",
    opacity: 0.85,
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#022469",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  heroProgressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#022469",
  },
  heroProgressText: {
    color: "#022469",
    fontWeight: "bold",
    fontSize: 18,
  },
  lessonHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#022469",
  },
  lessonCard: {
    backgroundColor: "#AEC6EE", // Base light blue card
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  lessonCardLocked: {
    backgroundColor: "#E5EDFA", // Faded blue for locked state
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#022469",
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: "#6B8ECA",
  },
  lessonSubtitle: {
    fontSize: 14,
    color: "#022469",
    fontWeight: "500",
  },
  lessonSubtitleLocked: {
    fontSize: 13,
    color: "#8AA5D4",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ASLLettersScreen;
