import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, ActivityIndicator, Alert, Dimensions, Animated, 
  Platform, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, MapPin, Star, CheckCircle, DollarSign, 
  Globe, Briefcase, Mail, Phone, Calendar, Clock, 
  Award, Heart, Share2 
} from 'lucide-react-native';

import advisorService from '../../src/services/advisorService';
import bookingService from '../../src/services/bookingService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import AdvisorBookingModal from '../../src/components/AdvisorBookingModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdvisorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [advisor, setAdvisor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'experience', 'contact'
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Tab animation
  const tabUnderlineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const roleValue = user?.role;
  const roleStr = typeof roleValue === 'string' ? roleValue.toLowerCase() : '';
  const canConnect = roleStr === 'startup' || roleStr === 'investor' || roleValue === 0 || roleValue === 1;

  useEffect(() => {
    if (!isLoading && !error && advisor) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, error, advisor]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [advisorData, bookingsData] = await Promise.all([
          advisorService.getAdvisorById(id),
          user?.userId ? bookingService.getMyCustomerBookings(user.userId) : Promise.resolve([])
        ]);

        if (advisorData) {
          setAdvisor(advisorData);
        } else {
          setError('Không tìm thấy thông tin cố vấn.');
        }

        const items = bookingsData?.items || bookingsData?.data?.items || bookingsData || [];
        if (Array.isArray(items)) {
          const booking = items.find(b => String(b.advisorId) === String(id));
          if (booking) setBookingStatus(booking.status);
        }

      } catch (err) {
        console.error('Data fetch error:', err);
        setError('Lỗi khi tải thông tin.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user]);

  useEffect(() => {
    const index = activeTab === 'overview' ? 0 : activeTab === 'experience' ? 1 : 2;
    Animated.spring(tabUnderlineAnim, {
      toValue: index * (SCREEN_WIDTH / 3),
      useNativeDriver: true,
      tension: 50,
      friction: 10
    }).start();
  }, [activeTab]);

  const handleConnect = () => {
    if (!canConnect) {
      Alert.alert('Hạn chế', 'Chỉ Startup hoặc Investor mới có thể kết nối với cố vấn.');
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (advisorId) => {
    setBookingStatus(0); // Pending
  };

  const handleShare = () => {
    Alert.alert('Chia sẻ', 'Tính năng đang phát triển.');
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !advisor) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnTextLarge}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = (advisor.userName || 'A').charAt(0).toUpperCase();
  const handle = `@${advisor.userName?.toLowerCase().replace(/\s/g, '')}`;
  const isApproved = advisor.approvalStatus === 'Approved';
  const expertises = advisor.expertise 
    ? advisor.expertise.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const renderStatusButton = () => {
    if (!canConnect) return null;

    if (bookingStatus === 0 || bookingStatus === 'Pending') {
      return (
        <View style={[styles.mainActionBtn, { backgroundColor: colors.secondaryText }]}>
          <Text style={styles.mainActionText}>Đang chờ duyệt</Text>
        </View>
      );
    }
    if (bookingStatus === 1 || bookingStatus === 'Confirmed' || bookingStatus === 'Accepted') {
      return (
        <View style={[styles.mainActionBtn, { backgroundColor: '#10b981' }]}>
          <Text style={styles.mainActionText}>Đã kết nối</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[styles.mainActionBtn, { backgroundColor: colors.primary }]} 
        onPress={handleConnect}
        activeOpacity={0.8}
      >
        <Text style={[styles.mainActionText, { color: '#fff' }]}>Kết nối ngay</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {/* STICKY HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={20}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{advisor.userName}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>Cố vấn chuyên gia</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn} hitSlop={20}>
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[3]}>
        {/* BANNER SECTION - Matching Startup Profile pattern */}
        <View style={[styles.banner, { backgroundColor: colors.profileGradient[0] }]}>
            <View style={[styles.bannerOverlay, { backgroundColor: colors.profileGradient[1], opacity: 0.3 }]} />
            <View style={styles.bannerPattern}>
                <View style={[styles.stripe, { opacity: 0.1 }]} />
                <View style={[styles.stripe, { opacity: 0.05, top: 40, left: -20 }]} />
            </View>
        </View>

        {/* PROFILE INFO SECTION */}
        <View style={styles.profileSection}>
            <View style={[styles.avatarContainer, { marginTop: -44 }]}>
                <View style={[styles.avatar, { 
                    borderColor: activeTheme.isDark ? colors.background : colors.white,
                    backgroundColor: colors.primary
                }]}>
                    {advisor.profileImage ? (
                        <Image source={{ uri: advisor.profileImage }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarInitial}>{initial}</Text>
                    )}
                </View>
            </View>

            <View style={styles.infoContent}>
                <View style={styles.nameRow}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Text style={[styles.name, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>{advisor.userName}</Text>
                            {isApproved && (
                                <View style={[styles.verifiedChip, { backgroundColor: colors.primary + '22' }]}>
                                    <CheckCircle size={14} color={colors.primary} />
                                    <Text style={[styles.verifiedText, { color: colors.primary }]}>Đã xác minh</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.handle, { color: colors.secondaryText }]}>{handle}</Text>
                    </View>
                    <View style={{ zIndex: 5 }}>
                        {renderStatusButton()}
                    </View>
                </View>

                <View style={styles.bioContainer}>
                    <Text style={[styles.bio, { color: colors.text }]}>{advisor.bio || 'Chưa có thông tin giới thiệu.'}</Text>
                    
                    {expertises.length > 0 && (
                        <View style={styles.expertiseWrapper}>
                            {expertises.map((exp, idx) => (
                                <View key={idx} style={[styles.expertiseChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '33' }]}>
                                    <Text style={[styles.expertiseText, { color: colors.primary }]}>{exp}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <MapPin size={13} color={colors.secondaryText} />
                        <Text style={[styles.metaText, { color: colors.secondaryText }]}>{advisor.location || 'Nghề nghiệp tự do'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Calendar size={13} color={colors.secondaryText} />
                        <Text style={[styles.metaText, { color: colors.secondaryText }]}>Tham gia Tháng 3 2024</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* STATS STRIP */}
        <View style={[styles.statsCard, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...activeTheme.shadows.sm
        }]}>
            <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.text }]}>{advisor.rating || 'N/A'}</Text>
                <Text style={[styles.statLab, { color: colors.secondaryText }]}>Đánh giá</Text>
            </View>
            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.text }]}>100%</Text>
                <Text style={[styles.statLab, { color: colors.secondaryText }]}>Phản hồi</Text>
            </View>
            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.text }]}>50+</Text>
                <Text style={[styles.statLab, { color: colors.secondaryText }]}>Kết nối</Text>
            </View>
        </View>

        {/* TABS HEADER - Matching startup style horizontal block */}
        <View style={{ backgroundColor: colors.background }}>
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('overview')}>
                    <Text style={[styles.tabLabel, { color: activeTab === 'overview' ? colors.primary : colors.secondaryText }]}>Tổng quan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('experience')}>
                    <Text style={[styles.tabLabel, { color: activeTab === 'experience' ? colors.primary : colors.secondaryText }]}>Kinh nghiệm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('contact')}>
                    <Text style={[styles.tabLabel, { color: activeTab === 'contact' ? colors.primary : colors.secondaryText }]}>Liên hệ</Text>
                </TouchableOpacity>
                <Animated.View style={[styles.tabUnderline, { backgroundColor: colors.primary, transform: [{ translateX: tabUnderlineAnim }] }]} />
            </View>
        </View>


        {/* TAB CONTENT */}
        <View style={styles.tabContainer}>
            {activeTab === 'overview' && (
                <View style={styles.tabPane}>
                    {/* 2X2 GRID */}
                    <View style={styles.grid}>
                        <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <DollarSign size={24} color={colors.primary} />
                            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Mức phí</Text>
                            <Text style={[styles.gridValue, { color: colors.text }]}>
                                {advisor.hourlyRate?.toLocaleString('vi-VN')} đ/h
                            </Text>
                        </View>
                        <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Star size={24} color={colors.warning} />
                            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Đánh giá</Text>
                            <Text style={[styles.gridValue, { color: colors.text }]}>{advisor.rating || 'Chưa có'}</Text>
                        </View>
                        <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Globe size={24} color={colors.primary} />
                            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Ngôn ngữ</Text>
                            <Text style={[styles.gridValue, { color: colors.text }]}>Tiếng Việt, Anh</Text>
                        </View>
                        <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Clock size={24} color={colors.primary} />
                            <Text style={[styles.gridLabel, { color: colors.secondaryText }]}>Phản hồi</Text>
                            <Text style={[styles.gridValue, { color: colors.text }]}>Trong 24h</Text>
                        </View>
                    </View>

                    <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Giới thiệu chuyên môn</Text>
                        <Text style={[styles.cardDesc, { color: colors.text }]}>
                            {advisor.bio || 'Chưa có thông tin giới thiệu chi tiết cho cố vấn này.'}
                        </Text>
                    </View>
                </View>
            )}

            {activeTab === 'experience' && (
                <View style={styles.tabPane}>
                    <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Lịch sử làm việc</Text>
                        <Text style={[styles.cardDesc, { color: colors.text }]}>
                            {advisor.previousExperience || 'Thông tin kinh nghiệm thực tế đang được cập nhật.'}
                        </Text>
                    </View>
                    <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Chứng chỉ & Bằng cấp</Text>
                        {advisor.certifications ? (
                            <View style={styles.certList}>
                                {advisor.certifications.split('|').map((cert, i) => (
                                    <View key={i} style={styles.certItem}>
                                        <Award size={16} color={colors.primary} style={{ marginTop: 2 }} />
                                        <Text style={[styles.certText, { color: colors.text }]}>{cert.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={[styles.cardDesc, { color: colors.text }]}>Đang cập nhật chứng chỉ chuyên môn.</Text>
                        )}
                    </View>
                </View>
            )}

            {activeTab === 'contact' && (
                <View style={styles.tabPane}>
                    <View style={[styles.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Thông tin liên hệ</Text>
                        <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`mailto:${advisor.email}`)}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                                <Mail size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.contactText, { color: colors.text }]}>{advisor.email || 'Email chưa công khai'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactItem}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                                <Phone size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.contactText, { color: colors.text }]}>09x xxx xxxx</Text>
                        </TouchableOpacity>
                        <View style={styles.contactItem}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                                <MapPin size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.contactText, { color: colors.text }]}>{advisor.location || 'Nghề nghiệp tự do'}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </Animated.View>

      {showBookingModal && (
        <AdvisorBookingModal
          isVisible={showBookingModal}
          advisor={advisor}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
  errorText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  backBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnTextLarge: { color: '#fff', fontSize: 16, fontWeight: '700' },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },

  banner: {
    height: 140,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  stripe: {
    position: 'absolute',
    width: '150%',
    height: 60,
    backgroundColor: '#fff',
    transform: [{ rotate: '-15deg' }],
    top: -20,
    left: -20,
  },

  profileSection: {
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 94,
    height: 94,
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      }
    })
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  headerActionButton: {
    marginLeft: 12,
  },
  mainActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  infoContent: {
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  handle: {
    fontSize: 15,
    marginTop: 2,
  },
  bioContainer: {
    marginTop: 16,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  expertiseWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  expertiseChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  expertiseText: {
    fontSize: 12,
    fontWeight: '600',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },

  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLab: {
    fontSize: 12,
    marginTop: 2,
  },
  vDivider: {
    width: 1,
    height: '60%',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    width: SCREEN_WIDTH / 3,
    height: 2,
    borderRadius: 1,
  },

  tabContainer: {
    paddingTop: 24,
  },
  tabPane: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },

  contentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 24,
  },

  certList: {
    gap: 12,
  },
  certItem: {
    flexDirection: 'row',
    gap: 12,
  },
  certText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
