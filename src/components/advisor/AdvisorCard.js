import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { MapPin, Star, DollarSign, CheckCircle, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AdvisorCard({ advisor, onViewProfile, onConnect, bookingStatus }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const expertises = advisor.expertise 
    ? advisor.expertise.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  const initial = (advisor.userName || 'A').charAt(0).toUpperCase();

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

  const renderStatusButton = () => {
    // 0 = Pending, 1 = Confirmed
    if (bookingStatus === 0 || bookingStatus === 'Pending') {
      return (
        <Animated.View style={[
          styles.actionBtn, 
          styles.outlinedBtn, 
          { borderColor: colors.border, transform: [{ scale: connectScale }] }
        ]}>
          <TouchableOpacity 
            activeOpacity={1}
            onPressIn={() => handlePressIn(connectScale)}
            onPressOut={() => handlePressOut(connectScale)}
            disabled={true}
            style={styles.innerBtn}
          >
            <Clock size={16} color={colors.secondaryText} style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: colors.secondaryText, fontWeight: '600' }]}>Đang chờ...</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }
    
    if (bookingStatus === 1 || bookingStatus === 'Confirmed' || bookingStatus === 'Accepted') {
      return (
        <Animated.View style={[
          styles.actionBtn, 
          { backgroundColor: '#10b981', transform: [{ scale: connectScale }] }
        ]}>
          <TouchableOpacity 
            activeOpacity={1}
            onPressIn={() => handlePressIn(connectScale)}
            onPressOut={() => handlePressOut(connectScale)}
            disabled={true}
            style={styles.innerBtn}
          >
            <CheckCircle size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={[styles.btnText, { color: '#fff' }]}>Đã kết nối</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }
    
    return (
      <Animated.View style={[
        styles.actionBtn, 
        { backgroundColor: colors.primary, transform: [{ scale: connectScale }] }
      ]}>
        <TouchableOpacity 
          activeOpacity={1}
          onPressIn={() => handlePressIn(connectScale)}
          onPressOut={() => handlePressOut(connectScale)}
          onPress={() => onConnect?.(advisor)}
          style={styles.innerBtn}
        >
          <Text style={[styles.btnText, { color: '#fff' }]}>Kết nối</Text>
        </TouchableOpacity>
      </Animated.View>
    );
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
          onPress={() => onViewProfile?.(advisor.advisorId)}
        >
          {advisor.profileImage ? (
            <Image source={{ uri: advisor.profileImage }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{advisor.userName}</Text>
            {advisor.approvalStatus === 'Approved' && (
              <CheckCircle size={16} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.handle, { color: colors.secondaryText }]}>
            @{advisor.userName?.toLowerCase().replace(/\s/g, '')}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.secondaryText }]}>Mới</Text>
        </View>
      </View>

      {/* TOP TAGS SECTION - Unified style */}
      <View style={styles.tagsWrapper}>
        {expertises.slice(0, 2).map((exp, idx) => (
          <View key={idx} style={[styles.chip, { backgroundColor: colors.mutedBackground }]}>
            <Text style={[styles.chipText, { color: colors.text }]}>{exp}</Text>
          </View>
        ))}
        {expertises.length > 2 && (
          <View style={[styles.chip, { backgroundColor: colors.mutedBackground }]}>
            <Text style={[styles.chipText, { color: colors.secondaryText }]}>+{expertises.length - 2}</Text>
          </View>
        )}
      </View>

      {/* DESCRIPTION */}
      <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
        {advisor.bio || 'Chuyên gia tư vấn startup với nhiều năm kinh nghiệm.'}
      </Text>

      {/* SEPARATOR */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MapPin size={14} color={colors.secondaryText} />
          <Text style={[styles.statText, { color: colors.secondaryText }]}>{advisor.location || 'Nghề nghiệp tự do'}</Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={14} color={colors.secondaryText} />
          <Text style={[styles.statText, { color: colors.secondaryText }]}>
            {advisor.hourlyRate?.toLocaleString('vi-VN')} đ/h
          </Text>
        </View>
        <View style={styles.statItem}>
          <Star size={14} color={colors.warning} fill={colors.warning} />
          <Text style={[styles.statText, { color: colors.secondaryText }]}>{advisor.rating || '0'}</Text>
        </View>
      </View>

      {/* ACTIONS */}
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
            onPress={() => onViewProfile?.(advisor.advisorId)}
            style={styles.innerBtn}
          >
            <Text style={[styles.btnText, { color: colors.text, fontWeight: '600' }]}>Xem hồ sơ</Text>
          </TouchableOpacity>
        </Animated.View>

        {renderStatusButton()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1, // Matching StartupCard's treatment
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  handle: {
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
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
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
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  separator: {
    height: 1,
    marginTop: 12,
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
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
    paddingHorizontal: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
