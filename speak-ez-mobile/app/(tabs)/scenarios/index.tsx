import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { colors, fontSize, spacing, radius } from '@/constants/theme';
import { SCENARIO_CATEGORY_INFO, getScenariosByCategory, type ScenarioCategory } from '@/data/scenarios';
import { Card } from '@/components/ui/Card';

export default function ScenariosScreen() {
  const categories = Object.entries(SCENARIO_CATEGORY_INFO) as [ScenarioCategory, typeof SCENARIO_CATEGORY_INFO[ScenarioCategory]][];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scenarios</Text>
        <Text style={styles.subtitle}>Practice real-world speaking situations with AI</Text>

        {categories.map(([key, info]) => {
          const scenariosInCategory = getScenariosByCategory(key);
          return (
            <View key={key} style={styles.section}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{info.icon}</Text>
                <View>
                  <Text style={styles.categoryLabel}>{info.label}</Text>
                  <Text style={styles.categoryDesc}>{info.description}</Text>
                </View>
              </View>
              {scenariosInCategory.map(scenario => (
                <Card key={scenario.id} onPress={() => {}} style={styles.scenarioCard}>
                  <View style={styles.scenarioRow}>
                    <View style={styles.scenarioInfo}>
                      <Text style={styles.scenarioName}>{scenario.name}</Text>
                      <Text style={styles.scenarioMeta} numberOfLines={1}>
                        {scenario.duration}s · {scenario.difficulty}
                      </Text>
                    </View>
                    {!scenario.unlocked && (
                      <Text style={styles.locked}>🔒</Text>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xxl },
  section: { marginBottom: spacing.xxl },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  categoryIcon: { fontSize: 28 },
  categoryLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  categoryDesc: { fontSize: fontSize.sm, color: colors.textSecondary },
  scenarioCard: { marginBottom: spacing.sm },
  scenarioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scenarioInfo: { flex: 1 },
  scenarioName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  scenarioMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  locked: { fontSize: 16 },
});
