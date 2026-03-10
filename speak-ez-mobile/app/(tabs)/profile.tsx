import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { colors, fontSize, spacing } from '@/constants/theme';
import { getLevelInfo, LEVELS } from '@/utils/xp';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

const MOCK_USER = { xp: 0, streak: 0 };

export default function ProfileScreen() {
  const level = getLevelInfo(MOCK_USER.xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.levelTitle}>{level.title}</Text>
        <Text style={styles.xpText}>Level {level.level} · {MOCK_USER.xp} XP</Text>

        <Card style={styles.progressCard}>
          <ProgressBar progress={level.progress} />
          <Text style={styles.progressText}>
            {level.next
              ? `${level.next.xp - MOCK_USER.xp} XP to ${level.next.title}`
              : 'Max level reached!'}
          </Text>
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{MOCK_USER.streak} days</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>{MOCK_USER.xp}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{level.level} / {LEVELS.length}</Text>
          </View>
        </Card>

        <Text style={styles.version}>Speak-EZ v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 36 },
  levelTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  xpText: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xxl },
  progressCard: { width: '100%', marginBottom: spacing.lg },
  progressText: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm },
  statsCard: { width: '100%', marginBottom: spacing.xxl },
  statsTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.bgInput },
  statLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  statValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  version: { fontSize: fontSize.xs, color: colors.textTertiary },
});
