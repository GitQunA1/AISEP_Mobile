import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Animated, Easing, Platform, Linking, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, MapPin, Globe, Phone, Building2, CheckCircle, 
  Users, Calendar, AlertCircle, Mail, User, Briefcase, 
  Target, Info, ExternalLink, Eye
} from 'lucide-react-native';
import startupProfileService from '../../src/services/startupProfileService';
import { useTheme } from '../../src/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DISPLAY = (val, fallback = 'Đang cập nhật') =>
  val && String(val).trim() ? val : fallback;

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [startup, setStartup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tab Animation
  const tabUnderlineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && !error && startup) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, error, startup]);

  useEffect(() => {
    const fetchStartup = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await startupProfileService.getStartupById(id);
        if (data) {
          setStartup(data);
        } else {
          setError('Không tìm thấy thông tin startup.');
        }
      } catch (err) {
        setError(err?.message || 'Lỗi khi tải thông tin startup.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStartup();
  }, [id]);

  useEffect(() => {
    const targetValue = activeTab === 'overview' ? 0 : 1;
    Animated.timing(tabUnderlineAnim, {
      toValue: targetValue,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !startup) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.error }]}>Lỗi</Text>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnTextLarge}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initial = (startup.companyName || 'S').charAt(0).toUpperCase();
  const isApproved = startup.approvalStatus === 'Approved';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Đang cập nhật';
    const d = new Date(dateStr);
    return `Tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
  };

  const handleOpenURL = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error("Couldn't open URL", err);
    }
  };

  const underlineScaleX = (SCREEN_WIDTH - 40) / 2; // Approximate width of one tab
  const translateX = tabUnderlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, underlineScaleX],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {/* HEADER */}
      <View style={[styles.header, { 
        paddingTop: insets.top + 8, 
        backgroundColor: colors.background,
        borderBottomColor: colors.border
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{startup.companyName}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>Lĩnh vực: {DISPLAY(startup.industry)}</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* BANNER SECTION */}
        <View style={[styles.banner, { backgroundColor: colors.profileGradient[0] }]}>
            {/* Pseudo-gradient effects */}
            <View style={[styles.bannerOverlay, { backgroundColor: colors.profileGradient[1], opacity: 0.3 }]} />
            <View style={styles.bannerPattern}>
                <View style={[styles.stripe, { opacity: 0.1 }]} />
                <View style={[styles.stripe, { opacity: 0.05, top: 40, left: -20 }]} />
            </View>
        </View>

        {/* PROFILE INFO SECTION */}
        <View style={styles.profileContent}>
            <View style={[styles.avatarContainer, { marginTop: -44 }]}>
                <View style={[styles.avatar, { 
                    borderColor: activeTheme.isDark ? colors.background : colors.white,
                    backgroundColor: colors.primary
                }]}>
                    {startup.logoUrl ? (
                        <Image source={{ uri: startup.logoUrl }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarInitial}>{initial}</Text>
                    )}
                </View>
                {isApproved && (
                    <View style={[styles.verifiedFloat, { backgroundColor: colors.background }]}>
                        <CheckCircle size={18} color={colors.success} fill={colors.background} />
                    </View>
                )}
            </View>

            <View style={styles.infoBlock}>
                <Text style={[styles.startupName, { color: colors.text }]}>{startup.companyName}</Text>
                
                {startup.founder && (
                    <View style={styles.founderRow}>
                        <User size={14} color={colors.secondaryText} />
                        <Text style={[styles.founderText, { color: colors.secondaryText }]}>
                            Sáng lập bởi <Text style={{ fontWeight: '700', color: colors.text }}>{startup.founder}</Text>
                        </Text>
                    </View>
                )}

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <MapPin size={13} color={colors.secondaryText} />
                        <Text style={[styles.metaText, { color: colors.secondaryText }]}>{DISPLAY(startup.countryCity)}</Text>
                    </View>
                    <View style={[styles.dividerDot, { backgroundColor: colors.secondaryText }]} />
                    <View style={styles.metaItem}>
                        <Calendar size={13} color={colors.secondaryText} />
                        <Text style={[styles.metaText, { color: colors.secondaryText }]}>Tham gia {formatDate(startup.createdAt)}</Text>
                    </View>
                </View>
            </View>

            {/* STATS CARD */}
            <View style={[styles.statsCard, { 
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...activeTheme.shadows.sm
            }]}>
                <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.text }]}>{startup.followerCount ?? 0}</Text>
                    <Text style={[styles.statLab, { color: colors.secondaryText }]}>Người theo dõi</Text>
                </View>
                <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.text }]}>0</Text>
                    <Text style={[styles.statLab, { color: colors.secondaryText }]}>Dự án</Text>
                </View>
                <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.text }]}>0</Text>
                    <Text style={[styles.statLab, { color: colors.secondaryText }]}>Lượt xem</Text>
                </View>
            </View>

            {/* TAB BAR */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                    style={styles.tabItem} 
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[
                        styles.tabLabel, 
                        { color: activeTab === 'overview' ? colors.primary : colors.secondaryText }
                    ]}>Tổng quan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.tabItem} 
                    onPress={() => setActiveTab('contact')}
                >
                    <Text style={[
                        styles.tabLabel, 
                        { color: activeTab === 'contact' ? colors.primary : colors.secondaryText }
                    ]}>Liên hệ</Text>
                </TouchableOpacity>
                <Animated.View style={[
                    styles.tabUnderline, 
                    { 
                        backgroundColor: colors.primary,
                        transform: [{ translateX }]
                    }
                ]} />
            </View>

            {/* TAB CONTENT */}
            <View style={styles.tabContent}>
                {activeTab === 'overview' ? (
                    <View>
                        <View style={styles.infoGrid}>
                            <GridItem 
                                icon={<Briefcase size={22} color={colors.primary} />}
                                label="Ngành nghề"
                                value={DISPLAY(startup.industry)}
                                colors={colors}
                                shadows={activeTheme.shadows}
                            />
                            <GridItem 
                                icon={<MapPin size={22} color={colors.primary} />}
                                label="Khu vực"
                                value={DISPLAY(startup.countryCity)}
                                colors={colors}
                                shadows={activeTheme.shadows}
                            />
                            <GridItem 
                                icon={<Target size={22} color={colors.primary} />}
                                label="Trạng thái"
                                value={isApproved ? 'Đã xác minh' : 'Chờ duyệt'}
                                colors={colors}
                                shadows={activeTheme.shadows}
                                valueColor={isApproved ? colors.success : colors.secondaryText}
                            />
                            <GridItem 
                                icon={<Users size={22} color={colors.primary} />}
                                label="Quy mô"
                                value="Đang cập nhật"
                                colors={colors}
                                shadows={activeTheme.shadows}
                            />
                        </View>

                        <View style={[styles.descriptionCard, { 
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            ...activeTheme.shadows.sm
                        }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
                            <Text style={[styles.descriptionText, { color: startup.description ? colors.text : colors.secondaryText }]}>
                                {startup.description || 'Chưa có mô tả chi tiết cho startup này.'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View>
                        <View style={[styles.contactCard, { 
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            ...activeTheme.shadows.sm
                        }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin liên hệ</Text>
                            {startup.contactInfo ? (
                                startup.contactInfo.split('|').map((info, i) => {
                                    const trimmed = info.trim();
                                    if (!trimmed) return null;
                                    const isEmail = trimmed.includes('@');
                                    return (
                                        <View key={i} style={styles.contactRow}>
                                            <View style={[styles.iconCircle, { backgroundColor: colors.mutedBackground }]}>
                                                {isEmail ? <Mail size={16} color={colors.secondaryText} /> : <Phone size={16} color={colors.secondaryText} />}
                                            </View>
                                            <Text style={[styles.contactVal, { color: colors.text }]}>{trimmed}</Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={[styles.contactVal, { color: colors.secondaryText, marginLeft: 0 }]}>Đang cập nhật</Text>
                            )}
                        </View>

                        {startup.website && (
                            <TouchableOpacity 
                                style={[styles.contactCard, { 
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    ...activeTheme.shadows.sm
                                }]}
                                onPress={() => handleOpenURL(startup.website)}
                            >
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Website</Text>
                                <View style={styles.contactRow}>
                                    <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                                        <Globe size={16} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.contactVal, { color: colors.primary, fontWeight: '600' }]}>{startup.website}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
      </ScrollView>
      </Animated.View>
    </View>
  );
}

const GridItem = ({ icon, label, value, colors, shadows, valueColor }) => (
    <View style={[styles.gridCell, { 
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...shadows.sm
    }]}>
        {icon}
        <Text style={[styles.cellLabel, { color: colors.secondaryText }]}>{label}</Text>
        <Text 
            style={[styles.cellValue, { color: valueColor || colors.text }]} 
            numberOfLines={1}
        >
            {value}
        </Text>
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
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
  profileContent: {
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 88 + 6,
    height: 88 + 6,
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
  verifiedFloat: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    paddingTop: 12,
    marginBottom: 16,
  },
  startupName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  founderText: {
    marginLeft: 6,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 10,
    opacity: 0.5,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
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
    width: '50%',
    height: 2,
    borderRadius: 1,
  },
  tabContent: {
    // padding is handled above
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridCell: {
    width: (SCREEN_WIDTH - 40 - 10) / 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        android: {
            elevation: 2,
        }
    })
  },
  cellLabel: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactVal: {
    fontSize: 14,
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backBtnLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnTextLarge: {
    color: '#fff',
    fontWeight: '700',
  },
});
