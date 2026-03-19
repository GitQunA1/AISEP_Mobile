import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function InvestorSkeletonCard() {
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
      
      <Animated.View style={[styles.line, { backgroundColor: colors.mutedBackground, opacity, marginTop: 4 }]} />
      <Animated.View style={[styles.line, { backgroundColor: colors.mutedBackground, opacity, width: '70%', marginBottom: 12 }]} />
      
      <View style={styles.tagRow}>
        <Animated.View style={[styles.iconPlaceholder, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.tag, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.tag, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
      
      <View style={[styles.tagRow, { marginTop: 6 }]}>
        <Animated.View style={[styles.iconPlaceholder, { backgroundColor: colors.mutedBackground, opacity }]} />
        <Animated.View style={[styles.tag, { backgroundColor: colors.mutedBackground, opacity }]} />
      </View>
      
      <Animated.View style={[styles.separator, { backgroundColor: colors.mutedBackground, opacity }]} />
      
      <View style={styles.statsRow}>
        <Animated.View style={[styles.stat, { backgroundColor: colors.mutedBackground, opacity, flex: 1, marginRight: 20 }]} />
        <Animated.View style={[styles.stat, { backgroundColor: colors.mutedBackground, opacity, width: 80 }]} />
      </View>
      
      <View style={styles.footer}>
        <Animated.View style={[styles.button, { backgroundColor: colors.mutedBackground, opacity, flex: 1 }]} />
        <Animated.View style={[styles.button, { backgroundColor: colors.mutedBackground, opacity, flex: 2 }]} />
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
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stat: {
    height: 14,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    height: 44,
    borderRadius: 12,
  },
});
