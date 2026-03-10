import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { colors, fontSize, spacing } from '@/constants/theme';
import { FIELDS } from '@/data/interview-questions';
import { Card } from '@/components/ui/Card';

export default function InterviewScreen() {
  const fields = Object.entries(FIELDS);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Interview Prep</Text>
        <Text style={styles.subtitle}>
          Practice with real interview questions for your field
        </Text>

        {fields.map(([key, field]) => (
          <Card key={key} onPress={() => {}} style={styles.fieldCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldIcon}>{field.icon}</Text>
              <View style={styles.fieldInfo}>
                <Text style={styles.fieldName}>{field.label}</Text>
                <Text style={styles.fieldMeta}>
                  {field.levels.join(', ')} · {Object.keys(field.rounds).length} rounds
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </Card>
        ))}
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
  fieldCard: { marginBottom: spacing.md },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { fontSize: 32, marginRight: spacing.md },
  fieldInfo: { flex: 1 },
  fieldName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  fieldMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 24, color: colors.textTertiary },
});
