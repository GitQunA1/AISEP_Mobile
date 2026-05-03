import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import investorService from '../../src/services/investorService';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import connectionService from '../../src/services/connectionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InvestorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();

  const [investor, setInvestor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
    const fetchInvestor = async () => {
      setIsLoading(true);
      try {
        const data = await investorService.getInvestorById(id);
        if (data) {
          setInvestor(data);
        } else {
          setError('Không tìm thấy thông tin nhà đầu tư');
        }
      } catch (err) {
        console.error('InvestorDetail fetch error:', err);
        setError('Lỗi tải dữ liệu nhà đầu tư');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestor();
  }, [id]);

  const handleConnect = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    
    setIsConnecting(true);
    try {
      // Simulate/Implement connection request
      const res = await connectionService.sendConnectionRequest({ 
        receverId: investor.userId || investor.investorId,
        message: 'Tôi muốn kết nối để thảo luận về dự án của mình.'
      });
      
      if (res?.success) {
        alert('Yêu cầu kết nối đã được gửi!');
      } else {
        alert(res?.message || 'Không thể gửi yêu cầu kết nối.');
      }
    } catch (err) {
       console.error('Connect error:', err);
       alert('Yêu cầu đã tồn tại hoặc có lỗi xảy ra.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !investor) {
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

  const AVATAR_COLOR = '#17BF63';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Thông tin nhà đầu tư</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* HERO */}
        <LinearGradient
          colors={isDark ? ['#062016', '#0a0a0a'] : ['#e6fffa', colors.background]}
          style={styles.hero}
        >
          <View style={[styles.avatarContainer, { backgroundColor: AVATAR_COLOR }]}>
             {investor.profileImage || investor.avatarUrl ? (
               <Image source={{ uri: investor.profileImage || investor.avatarUrl }} style={styles.avatarImage} />
             ) : (
               <Text style={styles.avatarText}>{(investor.userName || 'I').charAt(0).toUpperCase()}</Text>
             )}
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{investor.userName}</Text>
          <Text style={[styles.organization, { color: colors.secondaryText }]}>{investor.organizationName || 'Nhà đầu tư cá nhân'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{investor.investedProjectsCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Dự án đã đầu tư</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {investor.investmentAmount ? `${investor.investmentAmount.toLocaleString()} đ` : 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Mức đầu tư</Text>
            </View>
          </View>
        </LinearGradient>

        {/* INFO SECTIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Chiến lược đầu tư</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {investor.investmentStrategy || 'Nhà đầu tư này chưa cập nhật chiến lược chi tiết.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lĩnh vực quan tâm</Text>
          <View style={styles.chipContainer}>
            {(Array.isArray(investor.focusIndustry) ? investor.focusIndustry : (typeof investor.focusIndustry === 'string' ? investor.focusIndustry.split(',') : [])).map((sector, idx) => {
              const text = typeof sector === 'string' ? sector.trim() : sector;
              if (!text) return null;
              return (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                  <Text style={[styles.chipText, { color: colors.primary }]}>{text}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Giai đoạn đầu tư</Text>
          <View style={styles.chipContainer}>
            {(Array.isArray(investor.preferredStage) ? investor.preferredStage : (typeof investor.preferredStage === 'string' ? investor.preferredStage.split(',') : [])).map((stage, idx) => {
              const text = typeof stage === 'string' ? stage.trim() : stage;
              if (!text) return null;
              return (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.mutedBackground || '#f0f0f0', borderColor: colors.border }]}>
                  <Text style={[styles.chipText, { color: colors.secondaryText }]}>{text}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* CONTACT / BIO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin thêm</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.secondaryText} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{investor.investmentRegion || 'Toàn cầu'}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <MaterialCommunityIcons name="office-building-outline" size={20} color={colors.secondaryText} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{investor.organizationName || 'Nhà đầu tư cá nhân'}</Text>
          </View>
        </View>
      </ScrollView>

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
    marginBottom: 4,
  },
  organization: {
    fontSize: 16,
    fontWeight: '500',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  connectButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
