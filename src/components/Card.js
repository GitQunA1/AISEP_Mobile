import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
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

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const borderRadius = flattenedStyle.borderRadius || radius.lg;

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
      <View style={[
        { borderRadius, overflow: 'hidden' }, 
        flattenedStyle.margin && { margin: flattenedStyle.margin }, 
        flattenedStyle.marginBottom && { marginBottom: flattenedStyle.marginBottom }, 
        flattenedStyle.marginTop && { marginTop: flattenedStyle.marginTop }, 
        flattenedStyle.marginVertical && { marginVertical: flattenedStyle.marginVertical }, 
        flattenedStyle.marginHorizontal && { marginHorizontal: flattenedStyle.marginHorizontal }
      ]}>
        <Pressable
          onPress={onPress}
          android_ripple={{ color: colors.border + '40', borderless: false }}
          style={({ pressed }) => [
            { width: '100%', opacity: Platform.OS === 'ios' && pressed ? 0.7 : 1 },
            Platform.OS === 'ios' && pressed && { transform: [{ scale: 0.99 }] }
          ]}
        >
          {content}
        </Pressable>
      </View>
    );
  }

  return content;
};

export default Card;
