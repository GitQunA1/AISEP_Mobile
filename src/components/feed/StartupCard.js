import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Lock, Heart, MessageSquare, TrendingUp, Star, Sparkles, User, Users } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import followerService from '../../services/followerService';

// Import modals
import InvestmentModal from '../common/InvestmentModal';
import RequestInfoModal from '../common/RequestInfoModal';

const AVATAR_PALETTE = [
  '#E05252', // coral red
  '#E07D52', // orange
  '#7B52E0', // purple
  '#52C07B', // green
  '#C05290', // pink
  '#4A90D9', // light blue
  '#D4A017', // amber
];

const getAvatarColor = (name) => {
  if (!name || name === 'Startup') return '#7B52E0';
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const STAGE_COLORS = {
  Idea:   { bg: 'rgba(245, 166, 35, 0.12)', text: '#F5A623' },
  MVP:    { bg: 'rgba(45, 126, 255, 0.12)', text: '#2D7EFF' },
  Growth: { bg: 'rgba(39, 174, 96, 0.12)', text: '#27AE60' },
};

const StageBadge = React.memo(({ stage }) => {
  const colors = STAGE_COLORS[stage] || { bg: 'rgba(255,255,255,0.08)', text: '#999' };
  return (
    <View style={{ backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.text, textTransform: 'uppercase' }}>{stage}</Text>
    </View>
  );
});

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const PremiumLock = React.memo(({ colors }) => (
  <View style={[styles.premiumLock, { backgroundColor: colors.accentOrange + '15' }]}>
    <Lock size={10} color={colors.accentOrange} strokeWidth={3} />
    <Text style={[styles.premiumLockText, { color: colors.accentOrange }]}>Premium</Text>
  </View>
));

const PremiumLockText = ({ colors }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Lock size={12} color={colors.accentOrange} strokeWidth={2.5} />
    <Text style={{ fontSize: 13, color: colors.accentOrange, fontWeight: '700' }}>
      Yêu cầu Premium
    </Text>
  </View>
);

const AIScoreBadge = React.memo(({ score, colors }) => {
  const isNull = score === null || score === undefined;
  
  // Default (Updating/Unknown)
  let bgColor = 'rgba(120, 120, 140, 0.12)';
  let textColor = colors.secondaryText;
  let label = !isNull ? String(score) : '__';
  let borderColor = 'rgba(120, 120, 140, 0.25)';

  if (!isNull) {
    if (score >= 80) {
      bgColor = 'rgba(0, 186, 124, 0.12)';
      textColor = '#00c98a';
      borderColor = 'rgba(0, 186, 124, 0.3)';
    } else if (score >= 50) {
      bgColor = 'rgba(255, 159, 67, 0.12)';
      textColor = '#ff9f43';
      borderColor = 'rgba(255, 159, 67, 0.3)';
    } else {
      bgColor = 'rgba(231, 76, 60, 0.12)';
      textColor = '#e74c3c';
      borderColor = 'rgba(231, 76, 60, 0.3)';
    }
  }

  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: bgColor, 
      paddingHorizontal: 10, 
      paddingVertical: 5, 
      borderRadius: 999,
      borderWidth: 1,
      borderColor: borderColor,
      gap: 6
    }}>
      <Sparkles size={11} color={textColor} fill={textColor} />
      <Text style={{ 
        fontSize: 11, 
        fontWeight: '900', 
        color: textColor,
        fontVariant: ['tabular-nums']
      }}>
        {label}
      </Text>
    </View>
  );
});

const DetailRows = React.memo(({ project, colors }) => {
  const DETAIL_ROWS = [
    { label: 'Mô hình KD', field: 'businessModel',    isPremium: true  },
    { label: 'Khách hàng', field: 'targetCustomers',  isPremium: false },
    { label: 'Giá trị',    field: 'uniqueValueProposition', isPremium: false },
  ];

  return (
    <View style={{ gap: 12 }}>
      {DETAIL_ROWS.map(({ label, field, isPremium }) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ width: 105, flexShrink: 0, color: colors.secondaryText, fontSize: 13, fontWeight: '600' }}>
            {label}:
          </Text>
          {isPremium ? (
            <PremiumLockText colors={colors} />
          ) : (
            <Text
              numberOfLines={3}
              ellipsizeMode="tail"
              style={{ 
                flex: 1, 
                color: project[field] ? colors.text : colors.secondaryText + '90', 
                fontSize: 13, 
                lineHeight: 18 
              }}
            >
              {project[field] || 'Chưa cập nhật'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
});

const StartupCard = React.memo(({
  startup,
  user,
  followedProjectIds,
  onInvestmentSuccess,
  onViewProfile,
  onViewProject
}) => {
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

  const handleNavigateDetail = () => {
    if (onViewProject) {
      onViewProject(startup.id);
    } else {
      router.push(`/startup/${startup.id}`);
    }
  };

  const startupNameDisp = startup.startupName || startup.organizationName || startup.companyName || 'Startup';
  const scoreValue = startup.aiScore; // Could be null

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.secondaryBackground || '#111', 
        borderColor: colors.border,
        borderWidth: 1.2,
        borderTopColor: colors.border + '60', // Bevel effect
      }
    ]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleNavigateDetail} style={{ padding: 20 }}>
        
        {/* CARD HEADER */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 }}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(startupNameDisp) }]}>
            {startup.logo ? (
              <Image source={{ uri: startup.logo }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarTxt}>{startupNameDisp.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 17, fontWeight: '900', color: colors.text }}>
                {startupNameDisp}
              </Text>
              <Text style={{ fontSize: 11, color: colors.secondaryText, fontWeight: '500' }}>
                {formatDate(startup.createdAt || startup.timestamp)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
              <AIScoreBadge score={scoreValue} colors={colors} />
              <StageBadge stage={startup.stage} />
              <Text style={{ fontSize: 13, color: colors.secondaryText, fontWeight: '600' }}>#{startup.industry || 'Khác'}</Text>
            </View>
          </View>
        </View>

        {/* PROJECT TITLE */}
        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 10, letterSpacing: -0.8 }}>
          {startup.name || startup.projectName}
        </Text>

        {/* DESCRIPTION */}
        <Text numberOfLines={2} ellipsizeMode="tail" style={{ fontSize: 14, color: colors.secondaryText, lineHeight: 22, marginBottom: 18 }}>
          {startup.description}
        </Text>

        {/* INTEREST ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Star size={16} color="#FFD700" fill="#FFD700" />
          <Text style={{
            fontSize: 14,
            color: colors.primary,
            fontWeight: '800',
            marginLeft: 8,
          }}>
            {startup.interestedCount || 0} người quan tâm
          </Text>
        </View>

        {/* IMAGE */}
        {startup.imageUrl ? (
          <Image
            source={{ uri: startup.imageUrl }}
            style={styles.projectImage}
            resizeMode="cover"
          />
        ) : null}

        {/* HIGHLIGHT BOXES */}
        <View style={styles.gridRow}>
          <View style={[styles.highlightBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {startup.revenue !== undefined && startup.revenue !== null ? (
              <Text style={[styles.highlightValue, { color: colors.accentCyan }]} numberOfLines={1}>
                {startup.revenue > 0 ? `${(startup.revenue / 1000000).toLocaleString('vi-VN')}M` : '0 đ'}
              </Text>
            ) : <PremiumLock colors={colors} />}
            <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>Doanh thu</Text>
          </View>
          <View style={[styles.highlightBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {startup.marketSize !== undefined && startup.marketSize !== null ? (
              <Text style={[styles.highlightValue, { color: colors.accentGreen }]} numberOfLines={1}>
                {startup.marketSize > 0 ? `${(startup.marketSize / 1000000).toLocaleString('vi-VN')}VND` : '0 đ'}
              </Text>
            ) : <PremiumLock colors={colors} />}
            <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>Thị trường</Text>
          </View>
          <View style={[styles.highlightBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {startup.competitors !== undefined && startup.competitors !== null ? (
              <Text style={[styles.highlightValue, { color: colors.text }]} numberOfLines={1}>
                {startup.competitors || '—'}
              </Text>
            ) : <PremiumLock colors={colors} />}
            <Text style={[styles.highlightLabel, { color: colors.secondaryText }]}>Đối thủ chính</Text>
          </View>
        </View>

        <View style={{ height: 1.5, backgroundColor: colors.border, marginVertical: 24, opacity: 0.3 }} />

        {/* DETAIL ROWS */}
        <DetailRows project={startup} colors={colors} />

        {/* TEAM ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
          <Text style={{ width: 105, flexShrink: 0, color: colors.secondaryText, fontSize: 13, fontWeight: '600' }}>
            Team:
          </Text>
          <PremiumLockText colors={colors} />
        </View>

      </TouchableOpacity>

      {/* ACTIONS */}
      {isInvestor && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
            onPress={() => setShowRequestModal(true)}
            disabled={hasRequested}
          >
            <MessageSquare size={16} color="#fff" />
            <Text style={styles.actionBtnText}>{hasRequested ? 'Đã yêu cầu' : 'Yêu cầu Info'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowInvestmentModal(true)}
          >
            <TrendingUp size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Đầu tư</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODALS */}
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
});

export default StartupCard;

const styles = StyleSheet.create({
  card: { 
    borderRadius: 32, 
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 20,
      }
    }),
    marginBottom: 20,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { color: '#fff', fontSize: 22, fontWeight: '900' },
  projectImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 24, marginBottom: 20 },
  premiumLock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  premiumLockText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
  gridRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  highlightBox: { flex: 1, borderWidth: 1.2, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center' },
  highlightValue: { fontSize: 15, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  highlightLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', textTransform: 'uppercase' },
  actionsContainer: { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20, gap: 10 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
