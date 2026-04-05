import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Target, Heart, MessageSquare, TrendingUp, Lock, DollarSign, BarChart3, Swords } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import followerService from '../../services/followerService';

// Import modals created earlier
import InvestmentModal from '../common/InvestmentModal';
import RequestInfoModal from '../common/RequestInfoModal';

const PremiumLock = ({ colors }) => (
  <View style={[styles.premiumLock, { backgroundColor: colors.accentOrange + '15' }]}>
    <Lock size={12} color={colors.accentOrange} strokeWidth={2.5} />
    <Text style={[styles.premiumLockText, { color: colors.accentOrange }]}>Premium</Text>
  </View>
);

const PremiumLockTextInfo = ({ colors }) => (
  <View style={styles.premiumLockTextInfo}>
    <Lock size={12} color={colors.accentOrange} strokeWidth={2.5} />
    <Text style={[styles.premiumLockTextInfoLabel, { color: colors.accentOrange }]}> Yêu cầu Premium</Text>
  </View>
);

export default function StartupCard({
  startup,
  isPremium = false,
  user,
  followedProjectIds,
  sentConnectionIds,
  investedProjectIds = new Set(),
  investors = [],
  onInvestmentSuccess,
  onViewProfile,
  onViewProject
}) {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [isLoading, setIsLoading] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const isInvestor = user && (user.role === 'investor' || user.role === 'Investor' || String(user.role) === '1');

  useEffect(() => {
    if (isInvestor && startup.id && followedProjectIds) {
      setIsInterested(followedProjectIds.has(startup.id));
    }
  }, [isInvestor, startup.id, followedProjectIds]);

  useEffect(() => {
    if (isInvestor && startup.id && sentConnectionIds) {
      setHasRequested(sentConnectionIds.has(startup.id));
    }
  }, [isInvestor, startup.id, sentConnectionIds]);

  const handleInterestClick = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (isInterested) {
        const response = await followerService.unfollowProject(startup.id);
        if (response && (response.success || response.data)) {
          setIsInterested(false);
        } else {
          Alert.alert("Lỗi", response?.message || "Không thể xử lý yêu cầu");
        }
      } else {
        const response = await followerService.followProject(startup.id);
        if (response && (response.success || response.data)) {
          setIsInterested(true);
        } else {
          Alert.alert("Lỗi", response?.message || "Không thể xử lý yêu cầu");
        }
      }
    } catch (error) {
      Alert.alert("Lỗi", error?.message || "Kết nối thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarGradientBg = (mainTag) => {
    const t = (mainTag || '').toLowerCase();
    if (t.includes('fintech')) return colors.accentCyan;
    if (t.includes('agritech') || t.includes('nông')) return colors.accentGreen;
    if (t.includes('ai') || t.includes('saas')) return colors.accentPurple;
    if (t.includes('hardware') || t.includes('cứng')) return colors.accentOrange;
    return colors.primary;
  };

  const getStageColor = (stage) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('mvp')) return { bg: colors.accentCyan + '20', color: colors.accentCyan };
    if (s.includes('growth') || s.includes('vận hành')) return { bg: colors.accentGreen + '20', color: colors.accentGreen };
    if (s.includes('idea') || s.includes('ý tưởng')) return { bg: colors.accentOrange + '20', color: colors.accentOrange };
    return { bg: colors.mutedBackground, color: colors.secondaryText };
  };

  const mainTag = (startup.tags && startup.tags.length > 0) ? startup.tags[0] : (startup.industry || '');
  const stageStyles = getStageColor(startup.stage);
  const startupNameDisp = startup.startupName || startup.organizationName || startup.companyName || startup.name || 'Startup';
  const sid = startup.startupId || startup.userId || startup.id;

  const navigateToProject = () => {
    if (onViewProject) {
      onViewProject(startup.id);
    } else {
      router.push(`/startup/${startup.id}`);
    }
  };

  const navigateToProfile = () => {
    if (onViewProfile) {
      onViewProfile(sid);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={navigateToProject}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: getAvatarGradientBg(mainTag) }]}
            onPress={navigateToProfile}
          >
            {startup.logo ? (
              <Image source={{ uri: startup.logo }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarTxt}>{startupNameDisp.charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <TouchableOpacity onPress={navigateToProfile} style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{startupNameDisp}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgeRow}>
              {startup.stage && (
                <View style={[styles.badgePill, { backgroundColor: stageStyles.bg }]}>
                  <Text style={[styles.badgePillText, { color: stageStyles.color }]}>{startup.stage}</Text>
                </View>
              )}
              {((startup.tags && startup.tags.length > 0) ? startup.tags : (startup.industry ? [startup.industry] : [])).slice(0, 2).map(tag => (
                <Text key={tag} style={[styles.tagText, { color: colors.secondaryText }]}>#{tag}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Title, Description & Project Image */}
        <View style={styles.contentSection}>
          <Text style={[styles.projectName, { color: colors.text }]}>{startup.name}</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
            {startup.description}
          </Text>

          {startup.imageUrl && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: startup.imageUrl }} style={styles.projectImage} resizeMode="cover" />
            </View>
          )}
        </View>



        {/* Financial Highlights */}
        <View style={styles.gridRow}>
          <View style={[styles.highlightBox, { backgroundColor: colors.accentCyan + '10', borderColor: colors.accentCyan + '30' }]}>
            <DollarSign size={18} color={colors.accentCyan} style={{ marginBottom: 4 }} />
            {startup.revenue !== undefined ? (
              <Text style={[styles.highlightValue, { color: colors.accentCyan }]} numberOfLines={1}>
                {startup.revenue ? `${startup.revenue.toLocaleString('vi-VN')} đ` : '0 đ'}
              </Text>
            ) : <PremiumLock colors={colors} />}
            <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>Doanh thu</Text>
          </View>

          <View style={[styles.highlightBox, { backgroundColor: colors.accentGreen + '10', borderColor: colors.accentGreen + '30' }]}>
            <BarChart3 size={18} color={colors.accentGreen} style={{ marginBottom: 4 }} />
            {startup.marketSize !== undefined ? (
              <Text style={[styles.highlightValue, { color: colors.accentGreen }]} numberOfLines={1}>
                {startup.marketSize ? `${startup.marketSize.toLocaleString('vi-VN')} đ` : '0 đ'}
              </Text>
            ) : <PremiumLock colors={colors} />}
            <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>Thị trường</Text>
          </View>

          <View style={[styles.highlightBox, { backgroundColor: colors.secondaryText + '15', borderColor: colors.secondaryText + '30' }]}>
            <Swords size={18} color={colors.secondaryText} style={{ marginBottom: 4 }} />
            {startup.competitors !== undefined ? (
              <Text style={[styles.highlightValue, { color: colors.text }]} numberOfLines={1}>
                {startup.competitors || '—'}
              </Text>
            ) : <PremiumLock colors={colors} />}
            <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>Đối thủ chính</Text>
          </View>
        </View>

        {/* Additional Info Rows */}
        <View style={styles.detailRows}>
          {(startup.businessModel === undefined || startup.businessModel) && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Mô hình KD</Text>
              <View style={{ flex: 1 }}>
                {startup.businessModel !== undefined ? (
                  <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{startup.businessModel}</Text>
                ) : <PremiumLockTextInfo colors={colors} />}
              </View>
            </View>
          )}
          {startup.targetCustomers && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Khách hàng</Text>
              <Text style={[styles.detailValue, { flex: 1, color: colors.text }]} numberOfLines={1}>{startup.targetCustomers}</Text>
            </View>
          )}
        </View>

        {/* Team */}
        {(startup.teamMembers === undefined || startup.teamMembers) && (
          <View style={styles.teamLine}>
            <Text style={[styles.teamLabel, { color: colors.text }]}>Team: </Text>
            {startup.teamMembers !== undefined ? (
              <Text style={[styles.teamValue, { color: colors.secondaryText }]} numberOfLines={1}>{startup.teamMembers}</Text>
            ) : <PremiumLockTextInfo colors={colors} />}
          </View>
        )}
        {/* Follower / Investors count */}
        {((startup.followerCount !== undefined) || (investors && investors.length > 0)) && (
          <View style={styles.followerSection}>
            {startup.followerCount !== undefined && (
              <Text style={[styles.followerCount, { color: colors.accentCyan }]}>
                ⭐ {startup.followerCount} người quan tâm
              </Text>
            )}
            {investors && investors.length > 0 && (
              <View style={styles.investorsRow}>
                <Text style={[styles.investorsLabel, { color: colors.success }]}>💼 {investors.length} nhà đầu tư:</Text>
                <View style={styles.investorsAvatars}>
                  {investors.slice(0, 5).map((inv, idx) => (
                    <View key={inv.id || idx} style={[styles.miniAvatar, { backgroundColor: colors.accentCyan, borderColor: colors.card }]}>
                      {inv.avatar ? (
                        <Image source={{ uri: inv.avatar }} style={styles.miniAvatarImg} />
                      ) : (
                        <Text style={styles.miniAvatarTxt}>{inv.name?.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons for Investors */}
      {isInvestor && (
        <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isInterested ? colors.error : colors.primary }]}
            onPress={handleInterestClick}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Heart size={16} color="#fff" fill={isInterested ? "#fff" : "none"} />}
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>{isLoading ? '...' : (isInterested ? 'Hủy quan tâm' : 'Quan tâm')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: hasRequested ? colors.success : colors.accentPurple, opacity: hasRequested ? 0.8 : 1 }]}
            onPress={() => !hasRequested && setShowRequestModal(true)}
            disabled={hasRequested}
          >
            <MessageSquare size={16} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>{hasRequested ? 'Đã yêu cầu' : 'Yêu cầu Info'}</Text>
          </TouchableOpacity>

          {investedProjectIds.has(startup.id) ? (
            <View style={[styles.actionBtn, { backgroundColor: colors.success }]}>
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>✅ Đã đầu tư</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accentOrange }]}
              onPress={() => setShowInvestmentModal(true)}
            >
              <TrendingUp size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Đầu tư</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modals */}
      <RequestInfoModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        projectId={startup.id}
        projectName={startup.name}
        onSuccess={() => setHasRequested(true)}
      />

      <InvestmentModal
        isOpen={showInvestmentModal}
        projectId={startup.id}
        projectName={startup.name}
        startupName={startupNameDisp}
        onClose={() => setShowInvestmentModal(false)}
        onSuccess={() => onInvestmentSuccess?.()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgePillText: { fontSize: 11, fontWeight: '700' },
  tagText: { fontSize: 12 },
  menuIcon: { padding: 4 },
  contentSection: { paddingHorizontal: 16, marginBottom: 14 },
  projectName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  imageWrapper: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0', marginBottom: 8 },
  projectImage: { width: '100%', height: '100%' },
  followerSection: { paddingHorizontal: 16, paddingBottom: 16 },
  followerCount: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  investorsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  investorsLabel: { fontSize: 13, fontWeight: '600', marginRight: 8 },
  investorsAvatars: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, marginLeft: -6, alignItems: 'center', justifyContent: 'center' },
  miniAvatarImg: { width: '100%', height: '100%', borderRadius: 10 },
  miniAvatarTxt: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  highlightBox: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  highlightValue: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  highlightLabel: { fontSize: 11, fontWeight: '500' },
  premiumLock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  premiumLockText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  detailRows: { paddingHorizontal: 16, marginBottom: 8 },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: 90, fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '500' },
  premiumLockTextInfo: { flexDirection: 'row', alignItems: 'center' },
  premiumLockTextInfoLabel: { fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  teamLine: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', flexWrap: 'wrap' },
  teamLabel: { fontSize: 13, fontWeight: '700' },
  teamValue: { fontSize: 13 },
  actionsContainer: { flexDirection: 'row', padding: 16, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '700' }
});
