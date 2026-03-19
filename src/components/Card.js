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
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      padding: activeTheme.spacing.md,
      ...shadows.sm,
    },
    default: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevated: {
      ...shadows.md,
    },
    flat: {
      borderWidth: 0,
      backgroundColor: colors.secondaryBackground,
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
