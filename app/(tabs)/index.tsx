import { usePracticeTimeStore } from "@/components/store/usePracticeTimeStore";
import { useProgressStore } from "@/components/store/useProgressStore";
import { useStreakStore } from "@/components/store/useStreakStore";
import { getAlphabetCompletion } from "@/utils/getAlphabetCompletion";
import { getLessonList } from "@/utils/getLessonList";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#FFFFFF",
  navy: "#05317E",
  textDark: "#1A2346",
  pillInactiveBg: "#E8EDEE",
  pillInactiveText: "#4A5B7D",
  pillActiveBg: "#CDE1FA",
  pillActiveText: "#05317E",
  cardBgLight: "#AECDF3",
  cardBgLighter: "#C4DBF6",
  cardIconBgLight: "#D0E3FA",
};

// Dummy Data
const filters = ["All", "Today", "This Month", "Overall"];

// 2. Add this helper function outside your component
const formatPracticeTime = (totalSeconds: number) => {
  if (totalSeconds < 60) return `${totalSeconds}s`; // Optional: Show seconds if less than a minute

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function DashboardScreen() {
  const router = useRouter();
  const completedLettersData = useProgressStore(
    (state) => state.completedLetters
  );
  const streakCount = useStreakStore((state) => state.streakCount);
  const totalPracticeSeconds = usePracticeTimeStore(
    (state) => state.totalSeconds
  );
  const lessons = getLessonList(completedLettersData);
  const alphabetCompleted = getAlphabetCompletion(completedLettersData);

  const lessonsCompleted = lessons.filter(
    (lesson) => lesson.status === "completed"
  );
  const lessonsUnlocked = lessons.filter(
    (lesson) => lesson.status !== "locked"
  );
  const startWhere = lessons.find((lesson) => lesson.status === "in-progress");
  const upNext = startWhere?.signs.find(
    (letter) => !completedLettersData?.[startWhere?.id]?.includes(letter)
  );
  const stats = [
    { value: formatPracticeTime(totalPracticeSeconds), label: "Practice Time" },
    {
      value: `${streakCount} Day${streakCount === 1 ? "" : "s"}`,
      label: "Active Streak",
    },
  ];
  if (upNext && startWhere) {
    stats.push({
      value: `Letter '${upNext}'`,
      label: "Up Next",
      onPress: () => router.navigate(`./lesson/lessonGroup/${startWhere.id}`),
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.nameText}>Loren Ipsum</Text>
          </View>
          {/* <View style={styles.profileSection}>
            <TouchableOpacity>
              <Ionicons
                name="notifications-sharp"
                size={24}
                color={COLORS.navy}
                style={styles.bellIcon}
              />
            </TouchableOpacity>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=47" }}
              style={styles.profilePic}
            />
          </View> */}
        </View>

        <Link href="/lesson" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Feather
              name="plus"
              size={20}
              color="#FFF"
              style={styles.btnIcon}
            />
            <Text style={styles.primaryButtonText}>Start New Lesson</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Task Overview</Text>
        </View>

        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          {filters.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pill,
                index === 0 ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                style={
                  index === 0 ? styles.pillActiveText : styles.pillInactiveText
                }
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

        {/* Main Learning Progress Card */}
        <View
          style={[styles.mainCard, { backgroundColor: COLORS.cardBgLight }]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Learning Progress</Text>
            <View style={styles.iconCircleLight}>
              <Ionicons name="caret-up" size={16} color={COLORS.navy} />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardPercentage}>
              {(
                (lessonsCompleted.length / lessons.length) *
                100
              ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              %
            </Text>
            <Text style={styles.cardSubtitle}>Lessons Completed</Text>
          </View>
        </View>

        <View style={styles.subCardsRow}>
          {/* Suggestion 1: Signs Mastered */}
          <View
            style={[styles.subCard, { backgroundColor: COLORS.cardBgLight }]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitleSmall}>Signs{"\n"}Mastered</Text>
              <View style={styles.iconCircleLight}>
                <Ionicons name="star" size={14} color={COLORS.navy} />
              </View>
            </View>
            <View style={styles.subCardContent}>
              <Text style={styles.cardPercentageSmall}>
                {alphabetCompleted}/26
              </Text>
              <Text style={styles.cardSubtitleSmall}>Alphabet Letters</Text>
            </View>
          </View>

          {/* Suggestion 2: Modules Unlocked */}
          <View
            style={[styles.subCard, { backgroundColor: COLORS.cardBgLight }]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitleSmall}>Modules{"\n"}Unlocked</Text>
              <View style={styles.iconCircleDark}>
                <Ionicons name="lock-open" size={14} color="#FFF" />
              </View>
            </View>
            <View style={styles.subCardContent}>
              <Text style={styles.cardPercentageSmall}>
                {lessonsUnlocked.length}/5
              </Text>
              <Text style={styles.cardSubtitleSmall}>Lesson Groups</Text>
            </View>
          </View>
        </View>

        {/* Learning Statistics Section */}
        <Text style={[styles.sectionTitle, styles.statsTitle]}>
          Learning Statistics
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
        >
          {stats.map((stat, index) =>
            stat?.onPress ? (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                onPress={stat.onPress}
              >
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ) : (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            )
          )}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 20,
    color: COLORS.textDark,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 2,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  bellIcon: {
    marginRight: 16,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  primaryButton: {
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 32,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  gridIconContainer: {
    backgroundColor: COLORS.navy,
    padding: 6,
    borderRadius: 12,
  },
  filtersScroll: {
    flexDirection: "row",
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  pillActive: {
    backgroundColor: COLORS.pillActiveBg,
  },
  pillInactive: {
    backgroundColor: COLORS.pillInactiveBg,
  },
  pillActiveText: {
    color: COLORS.pillActiveText,
    fontWeight: "500",
  },
  pillInactiveText: {
    color: COLORS.pillInactiveText,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    height: 200,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  iconCircleLight: {
    backgroundColor: COLORS.cardIconBgLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleDark: {
    backgroundColor: COLORS.navy,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    marginTop: "auto",
  },
  cardPercentage: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textDark,
    marginTop: 4,
  },
  subCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  subCard: {
    width: "48%",
    borderRadius: 24,
    padding: 16,
    height: 160,
    justifyContent: "space-between",
  },
  cardTitleSmall: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  subCardContent: {
    marginTop: "auto",
  },
  cardPercentageSmall: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  cardSubtitleSmall: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsScroll: {
    flexDirection: "row",
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: COLORS.cardBgLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginRight: 12,
    alignItems: "center",
    minWidth: 120,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  bottomButton: {
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    position: "relative",
  },
  bottomButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  bottomButtonIconWrapper: {
    backgroundColor: COLORS.pillActiveBg,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 8,
  },
});
