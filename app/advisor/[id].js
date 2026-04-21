import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import advisorService from '../../src/services/advisorService';
import { useTheme } from '../../src/context/ThemeContext';
import AdvisorBookingModal from '../../src/components/AdvisorBookingModal';
import { useAuth } from '../../src/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdvisorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();

  const [advisor, setAdvisor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Hide tab bar and default header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parentNav) {
        parentNav.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

  useEffect(() => {
    const fetchAdvisor = async () => {
      setIsLoading(true);
      try {
        const data = await advisorService.getAdvisorById(id);
        if (data) {
          setAdvisor(data);
        } else {
          setError('Không tìm thấy thông tin cố vấn');
        }
      } catch (err) {
        console.error('AdvisorDetail fetch error:', err);
        setError('Lỗi tải dữ liệu cố vấn');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdvisor();
  }, [id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !advisor) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={{ color: colors.text, fontSize: 16, marginTop: 12, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const AVATAR_COLOR = '#7B52E0';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Thông tin cố vấn</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* HERO */}
        <LinearGradient
          colors={isDark ? ['#1e1b4b', '#0a0a0a'] : ['#eef2ff', colors.background]}
          style={styles.hero}
        >
          <View style={[styles.avatarContainer, { backgroundColor: AVATAR_COLOR }]}>
             {advisor.profileImage || advisor.avatarUrl ? (
               <Image source={{ uri: advisor.profileImage || advisor.avatarUrl }} style={styles.avatarImage} />
             ) : (
               <Text style={styles.avatarText}>{(advisor.userName || 'A').charAt(0).toUpperCase()}</Text>
             )}
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{advisor.userName}</Text>
          <Text style={[styles.expertise, { color: colors.primary }]}>{advisor.expertise || 'Chưa định nghĩa chuyên môn'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{advisor.hourlyRate?.toLocaleString()}đ</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Theo giờ</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{advisor.bookingCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Lượt tư vấn</Text>
            </View>
          </View>
        </LinearGradient>

        {/* INFO SECTIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Giới thiệu</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {advisor.biography || advisor.bio || 'Cố vấn này chưa cập nhật thông tin giới thiệu.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ngành nghề & Kỹ năng</Text>
          <View style={styles.chipContainer}>
            {(Array.isArray(advisor.industries) ? advisor.industries : (typeof advisor.industries === 'string' ? advisor.industries.split(',') : [])).map((ind, idx) => {
              const text = typeof ind === 'string' ? ind.trim() : ind;
              if (!text) return null;
              return (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                  <Text style={[styles.chipText, { color: colors.primary }]}>{text}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.chipContainer, { marginTop: 10 }]}>
            {(Array.isArray(advisor.skills) ? advisor.skills : (typeof advisor.skills === 'string' ? advisor.skills.split(',') : [])).map((skill, idx) => {
              const text = typeof skill === 'string' ? skill.trim() : skill;
              if (!text) return null;
              return (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, { color: colors.secondaryText }]}>{text}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* EXPERIENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kinh nghiệm làm việc</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
             {advisor.experience || 'Chưa cập nhật thông tin kinh nghiệm chi tiết.'}
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER ACTION */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity 
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowBookingModal(true)}
        >
          <Text style={styles.bookButtonText}>Đặt lịch tư vấn</Text>
        </TouchableOpacity>
      </View>

      <AdvisorBookingModal
        isVisible={showBookingModal}
        advisor={advisor}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => {
           Alert.alert('Thành công', 'Yêu cầu tư vấn của bạn đã được gửi đi.');
           setShowBookingModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  expertise: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#ccc',
    opacity: 0.3,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  bookButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
