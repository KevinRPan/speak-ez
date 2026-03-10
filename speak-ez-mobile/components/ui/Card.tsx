import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  compact?: boolean;
}

export function Card({ children, style, onPress, compact }: CardProps) {
  const cardStyle = [styles.card, compact && styles.compact, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  compact: {
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.bgCardHover,
  },
});
