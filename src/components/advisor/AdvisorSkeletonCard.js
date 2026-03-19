import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AdvisorSkeletonCard() {
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
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { backgroundColor: colors.mutedBackground, opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.title, { backgroundColor: colors.mutedBackground, opacity }]} />
          <Animated.View style={[styles.handle, { backgroundColor: colors.mutedBackground, opacity }]} />
        </View>
        <Animated.View style={[styles.date, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
      
      <View style={styles.tagRow}>
        <Animated.View style={[styles.tag, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.tag, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
      
      <Animated.View style={[styles.line, { backgroundColor: colors.mutedBackground, opacity }]} />
      <Animated.View style={[styles.line, { backgroundColor: colors.mutedBackground, opacity, width: '70%' }]} />
      
      <View style={styles.statsRow}>
        <Animated.View style={[styles.stat, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.stat, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.stat, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
      
      <View style={styles.footer}>
        <Animated.View style={[styles.button, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.button, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    width: '50%',
    borderRadius: 4,
    marginBottom: 6,
  },
  handle: {
    height: 10,
    width: '30%',
    borderRadius: 4,
  },
  date: {
    height: 10,
    width: 30,
    borderRadius: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    height: 20,
    width: 60,
    borderRadius: 10,
  },
  line: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'transparent', // space holder
  },
  stat: {
    height: 12,
    width: 60,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
  },
});
