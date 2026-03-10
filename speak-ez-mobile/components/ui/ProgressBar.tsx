import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = colors.accent,
  height = 6,
  style,
}: ProgressBarProps) {
  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.min(Math.max(progress, 0), 1) * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
