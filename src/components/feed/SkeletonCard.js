import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SkeletonCard() {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: activeTheme.dark ? 1 : 0 }]}>
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { backgroundColor: colors.mutedBackground, opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.title, { backgroundColor: colors.mutedBackground, opacity }]} />
          <Animated.View style={[styles.subtitle, { backgroundColor: colors.mutedBackground, opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.line, { backgroundColor: colors.mutedBackground, opacity }]} />
      <Animated.View style={[styles.line, { backgroundColor: colors.mutedBackground, opacity, width: '70%' }]} />
      <Animated.View style={[styles.button, { backgroundColor: colors.mutedBackground, opacity }]} />
      <View style={styles.footer}>
        <Animated.View style={[styles.icon, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.icon, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.icon, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    height: 14,
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    height: 10,
    width: '40%',
    borderRadius: 4,
  },
  line: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginBottom: 10,
  },
  button: {
    height: 36,
    width: '100%',
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent', // just for spacing mapping
  },
  icon: {
    width: 40,
    height: 12,
    borderRadius: 4,
  },
});
