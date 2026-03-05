/**
 * Home Screen — the main dashboard
 * Shows branding, streak, weekly progress, level bar, and workout cards
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radius, fontSize } from '@/constants/theme';
import { workoutTemplates } from '@/data/workouts';
import { getLevelInfo, getWeeklyCount, checkStreak } from '@/utils/xp';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

// Placeholder user data — will come from storage in Phase 1
const MOCK_USER = { xp: 0, streak: 0, lastPracticeDate: null, weeklyGoal: 5 };
const MOCK_HISTORY: Array<{ completedAt: string }> = [];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const user = MOCK_USER;
  const history = MOCK_HISTORY;
  const level = getLevelInfo(user.xp);
  const weeklyCount = getWeeklyCount(history);
  const streakInfo = checkStreak(user.lastPracticeDate, user.streak);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);

  const daysWithSessions = new Set<number>();
  history.forEach(s => {
    const d = new Date(s.completedAt);
    if (d >= monday) {
      const diff = Math.floor((d.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 7) daysWithSessions.add(diff);
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.brand}>
            Speak<Text style={styles.brandAccent}>-EZ</Text>
          </Text>
          <Text style={styles.tagline}>{getGreeting()}. Ready to train?</Text>
        </View>

        {/* Stat pills */}
        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{streakInfo.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>
              {weeklyCount}/{user.weeklyGoal}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>LVL {level.level}</Text>
            <Text style={styles.statLabel}>{user.xp} XP</Text>
          </View>
        </View>

        {/* Week dots */}
        <Card style={styles.weekCard}>
          <View style={styles.weekDots}>
            {weekDays.map((day, i) => {
              const completed = daysWithSessions.has(i);
              const isToday = i === dayOfWeek - 1;
              return (
                <View
                  key={i}
                  style={[
                    styles.weekDot,
                    completed && styles.weekDotCompleted,
                    isToday && styles.weekDotToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDotText,
                      completed && styles.weekDotTextCompleted,
                    ]}
                  >
                    {completed ? '✓' : day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Level bar */}
        <Card compact style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LVL {level.level}</Text>
            </View>
            <View style={styles.levelBarWrap}>
              <ProgressBar progress={level.progress} />
            </View>
          </View>
          <Text style={styles.levelText}>
            {level.title} — {user.xp} XP
            {level.next ? ` / ${level.next.xp} XP` : ''}
          </Text>
        </Card>

        {/* CTA */}
        <Button
          title="Start Training"
          onPress={() => {
            // Navigate to workouts tab — for now just switch tabs
            router.push('/(tabs)/history');
          }}
          style={styles.cta}
        />

        {/* Time picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick pick by time</Text>
          <View style={styles.timeChips}>
            {[5, 15, 20, 25].map(mins => (
              <Pressable key={mins} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{mins} min</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Popular workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Popular workouts</Text>
          {workoutTemplates.slice(0, 4).map(w => (
            <Card key={w.id} onPress={() => {}} style={styles.workoutCard}>
              <View style={styles.workoutRow}>
                <View style={[styles.workoutIcon, { backgroundColor: w.color + '20' }]}>
                  <Text style={styles.workoutIconText}>{w.icon}</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{w.name}</Text>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutMetaText}>{w.duration} min</Text>
                    <Text style={styles.workoutMetaDot}>·</Text>
                    <Text style={styles.workoutMetaText}>
                      {w.exercises.length} exercises
                    </Text>
                    <Text style={styles.workoutMetaDot}>·</Text>
                    <Text
                      style={[
                        styles.workoutMetaText,
                        w.difficulty === 'beginner' && { color: colors.success },
                        w.difficulty === 'intermediate' && { color: colors.warning },
                        w.difficulty === 'advanced' && { color: colors.danger },
                      ]}
                    >
                      {w.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  brand: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.text,
  },
  brandAccent: {
    color: colors.accent,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  weekCard: {
    marginBottom: spacing.md,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotCompleted: {
    backgroundColor: colors.success,
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  weekDotText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  weekDotTextCompleted: {
    color: colors.bg,
  },
  levelCard: {
    marginBottom: spacing.xl,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  levelBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  levelBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.accent,
  },
  levelBarWrap: {
    flex: 1,
  },
  levelText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  cta: {
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  timeChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeChip: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  timeChipText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  workoutCard: {
    marginBottom: spacing.sm,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  workoutIconText: {
    fontSize: 22,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutMetaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  workoutMetaDot: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginHorizontal: 4,
  },
  arrow: {
    fontSize: 24,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});
