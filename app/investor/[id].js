import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, CheckCircle, DollarSign, TrendingUp, Info, Briefcase, Globe, Target, ShieldCheck, Building2 } from 'lucide-react-native';
import investorService from '../../src/services/investorService';
import { useTheme } from '../../src/context/ThemeContext';

const DISPLAY = (val, fallback = 'Đang cập nhật') =>
  val && String(val).trim() ? val : fallback;

export default function InvestorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  
  const [investor, setInvestor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvestorDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await investorService.getInvestorById(id);
        if (data) {
          setInvestor(data);
        } else {
          setError('Không tìm thấy thông tin nhà đầu tư.');
        }
      } catch (err) {
        console.error('Investor fetch error:', err);
        setError('Lỗi khi tải thông tin nhà đầu tư.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchInvestorDetails();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !investor) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Info size={48} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Lỗi</Text>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>{error}</Text>
        <TouchableOpacity style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnTextLarge}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const industries = investor.focusIndustry ? investor.focusIndustry.split(',').map(s => s.trim()) : [];
  const stages = investor.preferredStage ? [investor.preferredStage] : ['Chưa cập nhật'];
  const name = investor.organizationName || investor.userName;
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hồ Sơ Nhà Đầu Tư</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <CheckCircle size={16} color="#fff" />
            </View>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.handle, { color: colors.secondaryText }]}>@{investor.userName?.toLowerCase().replace(/\s/g, '')}</Text>
          
          <View style={styles.industryTags}>
            {industries.map((ind, idx) => (
              <View key={idx} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{ind}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.statsBar, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{DISPLAY(investor.preferredStage, 'Giai đoạn sớm')}</Text>
            <View style={styles.statLabelRow}>
              <TrendingUp size={12} color={colors.secondaryText} />
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Giai đoạn</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {investor.investmentAmount ? `${investor.investmentAmount.toLocaleString()} đ` : 'N/A'}
            </Text>
            <View style={styles.statLabelRow}>
              <DollarSign size={12} color={colors.secondaryText} />
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Quy mô</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Triết lý đầu tư</Text>
          <Text style={[styles.bioText, { color: colors.text }]}>
            {investor.investmentTaste || 'Chưa cập nhật triết lý đầu tư.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin giới thiệu</Text>
          <Text style={[styles.bioText, { color: colors.text }]}>
            {investor.bio || 'Chưa có thông tin giới thiệu chi tiết.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin chi tiết</Text>
          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.secondaryText} />
            <Text style={[styles.infoText, { color: colors.text }]}>{DISPLAY(investor.investmentRegion, 'Đang cập nhật')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Building2 size={18} color={colors.secondaryText} />
            <Text style={[styles.infoText, { color: colors.text }]}>Nhà đầu tư quỹ</Text>
          </View>
          {investor.website && (
            <View style={styles.infoRow}>
              <Globe size={18} color={colors.secondaryText} />
              <Text style={[styles.infoText, { color: colors.primary }]}>{investor.website}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.mainConnectBtn, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Thông báo', 'Tính năng kết nối đang được phát triển.')}
        >
          <ShieldCheck size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.mainConnectText}>Gửi yêu cầu hợp tác</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  errorText: { fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  backBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnTextLarge: { color: '#fff', fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 24, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 },
  handle: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  industryTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  tag: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, margin: 4 },
  tagText: { fontSize: 13, fontWeight: '600' },
  statsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statLabel: { fontSize: 12, marginLeft: 4 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  bioText: { fontSize: 15, lineHeight: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { marginLeft: 12, fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  mainConnectBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainConnectText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
