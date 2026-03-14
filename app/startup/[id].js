import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Globe, Phone, Building2, CheckCircle, Users, Calendar, AlertCircle, Mail, User, Briefcase, Target } from 'lucide-react-native';
import startupProfileService from '../../src/services/startupProfileService';
import THEME from '../../src/constants/Theme';

const DISPLAY = (val, fallback = 'Đang cập nhật') =>
  val && String(val).trim() ? val : fallback;

export default function StartupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [startup, setStartup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !startup) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Lỗi</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtnLarge} onPress={() => router.back()}>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{startup.companyName}</Text>
          <Text style={styles.headerSubtitle}>Startup Profile</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* BANNER */}
        <View style={styles.banner} />

        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              {startup.logoUrl ? (
                <Image source={{ uri: startup.logoUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
            </View>
            <View style={styles.headerActionRow}>
              {isApproved && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={14} color="#10B981" />
                  <Text style={styles.verifiedText}>Đã xác minh</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.mainName}>{startup.companyName}</Text>
          {startup.founder && (
            <View style={styles.founderRow}>
              <User size={14} color={THEME.colors.secondaryText} />
              <Text style={styles.founderText}>Sáng lập bởi <Text style={{fontWeight: '700', color: THEME.colors.text}}>{startup.founder}</Text></Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={THEME.colors.secondaryText} />
              <Text style={styles.metaText}>{DISPLAY(startup.countryCity)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={14} color={THEME.colors.secondaryText} />
              <Text style={styles.metaText}>Tham gia {formatDate(startup.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{startup.followerCount ?? 0}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            {startup.aiScore && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: THEME.colors.primary}]}>{startup.aiScore}</Text>
                <Text style={styles.statLabel}>AI Score</Text>
              </View>
            )}
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]} 
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Tổng quan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'contact' && styles.activeTab]} 
            onPress={() => setActiveTab('contact')}
          >
            <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>Liên hệ</Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT */}
        <View style={styles.content}>
          {activeTab === 'overview' ? (
            <View>
              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Briefcase size={20} color={THEME.colors.primary} />
                  <Text style={styles.infoLabel}>Ngành nghề</Text>
                  <Text style={styles.infoValue}>{DISPLAY(startup.industry)}</Text>
                </View>
                <View style={styles.infoCard}>
                  <MapPin size={20} color={THEME.colors.primary} />
                  <Text style={styles.infoLabel}>Khu vực</Text>
                  <Text style={styles.infoValue}>{DISPLAY(startup.countryCity)}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Target size={20} color={THEME.colors.primary} />
                  <Text style={styles.infoLabel}>Trạng thái</Text>
                  <Text style={[styles.infoValue, {color: isApproved ? '#10B981' : '#64748B'}]}>
                    {isApproved ? 'Đã xác minh' : 'Chờ duyệt'}
                  </Text>
                </View>
                <View style={styles.infoCard}>
                  <Users size={20} color={THEME.colors.primary} />
                  <Text style={styles.infoLabel}>Quy mô</Text>
                  <Text style={styles.infoValue}>Đang cập nhật</Text>
                </View>
              </View>

              <View style={styles.descriptionCard}>
                <Text style={styles.sectionTitle}>Mô tả</Text>
                <Text style={styles.descriptionText}>
                  {startup.description || 'Chưa có mô tả chi tiết cho startup này.'}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.descriptionCard}>
                <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                {startup.contactInfo ? (
                  startup.contactInfo.split('|').map((info, i) => {
                    const trimmed = info.trim();
                    const isEmail = trimmed.includes('@');
                    return (
                      <View key={i} style={styles.contactItem}>
                        {isEmail ? <Mail size={18} color="#64748B" /> : <Phone size={18} color="#64748B" />}
                        <Text style={styles.contactText}>{trimmed}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.contactText}>Đang cập nhật</Text>
                )}
              </View>

              {startup.website && (
                <View style={styles.descriptionCard}>
                  <Text style={styles.sectionTitle}>Website</Text>
                  <TouchableOpacity style={styles.contactItem}>
                    <Globe size={18} color={THEME.colors.primary} />
                    <Text style={[styles.contactText, {color: THEME.colors.primary}]}>{startup.website}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  banner: {
    height: 120,
    backgroundColor: '#F1F5F9',
  },
  profileSection: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  headerActionRow: {
    paddingBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  mainName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  founderText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    marginRight: 32,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: THEME.colors.primary,
  },
  content: {
    padding: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#475569',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backBtnLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
  },
  backBtnTextLarge: {
    color: '#fff',
    fontWeight: '700',
  },
});
