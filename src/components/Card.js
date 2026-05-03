import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Card = ({ children, style, variant = 'default', onPress }) => {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const radius = activeTheme.radius;
  const shadows = activeTheme.shadows;

  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: activeTheme.spacing.md,
      ...shadows.sm,
    },
    default: {
      borderWidth: activeTheme.isDark ? 1 : 0.5,
      borderColor: activeTheme.isDark ? colors.border : colors.border + '40',
    },
    elevated: {
      ...shadows.md,
      borderWidth: 0,
    },
    flat: {
      borderWidth: 0,
      backgroundColor: activeTheme.isDark ? colors.mutedBackground : colors.secondaryBackground,
      ...shadows.sm,
      shadowOpacity: activeTheme.isDark ? 0 : 0.05,
    }
  });

  const content = (
    <View style={[
      cardStyles.card, 
      cardStyles[variant],
      style
    ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default Card;
