import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { MapPin, Target, TrendingUp, CheckCircle, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function InvestorCard({ investor, onViewProfile, onConnect, user }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const initial = (investor.name || 'I').charAt(0).toUpperCase();

  // Button Scale Animations
  const viewProfileScale = useRef(new Animated.Value(1)).current;
  const connectScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scaleVar) => {
    Animated.spring(scaleVar, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
  };

  const handlePressOut = (scaleVar) => {
    Animated.spring(scaleVar, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
        borderColor: colors.border
      }
    ]}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.avatar, { backgroundColor: colors.primary }]}
          onPress={() => onViewProfile?.(investor.id)}
        >
          {investor.avatar ? (
            <Image source={{ uri: investor.avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{investor.name}</Text>
            {investor.verified && (
              <CheckCircle size={16} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.typeLabel, { color: colors.secondaryText }]}>
            {investor.type || 'Nhà đầu tư'}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.secondaryText }]}>Mới</Text>
        </View>
      </View>

      {/* DESCRIPTION */}
      <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
        {investor.thesis || 'Chưa cập nhật khẩu vị đầu tư.'}
      </Text>

      {/* TAGS SECTION */}
      <View style={styles.tagsContainer}>
        {/* Industry Tags row */}
        {investor.industries && investor.industries.length > 0 && (
          <View style={styles.tagRow}>
            <Target size={14} color={colors.secondaryText} style={{ marginRight: 6 }} />
            <View style={styles.tagsWrapper}>
              {investor.industries.slice(0, 2).map((ind, idx) => (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.mutedBackground }]}>
                  <Text style={[styles.chipText, { color: colors.text }]}>{ind}</Text>
                </View>
              ))}
              {investor.industries.length > 2 && (
                <View style={[styles.chip, { backgroundColor: colors.mutedBackground }]}>
                  <Text style={[styles.chipText, { color: colors.secondaryText }]}>+{investor.industries.length - 2}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Stage Tags row */}
        {investor.stages && investor.stages.length > 0 && (
          <View style={[styles.tagRow, { marginTop: 6 }]}>
            <TrendingUp size={14} color={colors.secondaryText} style={{ marginRight: 6 }} />
            <View style={styles.tagsWrapper}>
              {investor.stages.slice(0, 2).map((stage, idx) => (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.mutedBackground }]}>
                  <Text style={[styles.chipText, { color: colors.text }]}>{stage}</Text>
                </View>
              ))}
              {investor.stages.length > 2 && (
                <View style={[styles.chip, { backgroundColor: colors.mutedBackground }]}>
                  <Text style={[styles.chipText, { color: colors.secondaryText }]}>+{investor.stages.length - 2}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* SEPARATOR */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MapPin size={14} color={colors.secondaryText} />
          <Text style={[styles.statText, { color: colors.secondaryText }]}>{investor.location || 'Chưa cập nhật'}</Text>
        </View>
        <Text style={[styles.ticketText, { color: colors.primary }]}>{investor.ticketSize || 'N/A'}</Text>
      </View>

      {/* ACTIONS */}
      {user ? (
        <View style={styles.actions}>
          <Animated.View style={[
            styles.actionBtn, 
            styles.outlinedBtn, 
            { borderColor: colors.border, transform: [{ scale: viewProfileScale }] }
          ]}>
            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={() => handlePressIn(viewProfileScale)}
              onPressOut={() => handlePressOut(viewProfileScale)}
              onPress={() => onViewProfile?.(investor.id)}
              style={styles.innerBtn}
            >
              <User size={16} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: colors.text, fontWeight: '600' }]}>Hồ sơ</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  typeLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  dateContainer: {
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginTop: 4,
    marginBottom: 12,
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  statText: {
    fontSize: 13,
  },
  ticketText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  outlinedBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  innerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
