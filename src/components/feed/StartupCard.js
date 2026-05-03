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
    <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text allowFontScaling={false} style={{ fontSize: 10, fontWeight: '800', color: colors.text, textTransform: 'uppercase' }}>{stage}</Text>
    </View>
  );
});

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const PremiumLock = React.memo(({ colors, canUnlock, isUnlocked, isOwner }) => {
  if (isOwner || isUnlocked) {
    return (
      <View style={[styles.premiumLock, { backgroundColor: '#10b98115' }]}>
        <Text allowFontScaling={false} style={[styles.premiumLockText, { color: '#10b981' }]}>Xem chi tiết</Text>
      </View>
    );
  }
  return (
    <View style={[styles.premiumLock, { backgroundColor: colors.accentOrange + '15' }]}>
      <Lock size={10} color={colors.accentOrange} strokeWidth={3} />
      <Text allowFontScaling={false} style={[styles.premiumLockText, { color: colors.accentOrange }]}>{canUnlock ? 'Mở khóa ngay' : 'Premium'}</Text>
    </View>
  );
});

const PremiumLockText = ({ colors, canUnlock }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Lock size={12} color={colors.accentOrange} strokeWidth={2.5} />
    <Text allowFontScaling={false} style={{ fontSize: 13, color: colors.accentOrange, fontWeight: '700' }}>
      {canUnlock ? 'Mở khóa ngay' : 'Yêu cầu Premium'}
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
      paddingHorizontal: 8, 
      paddingVertical: 4, 
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      gap: 6
    }}>
      <Sparkles size={11} color={textColor} fill={textColor} />
      <Text allowFontScaling={false} style={{ 
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

const DetailRows = React.memo(({ project, colors, isUnlocked, isPremium: hasSub }) => {
  const DETAIL_ROWS = [
    { label: 'Mô hình KD', field: 'businessModel',    isPremium: true  },
    { label: 'Khách hàng', field: 'targetCustomers',  isPremium: false },
    { label: 'Giá trị',    field: 'uniqueValueProposition', isPremium: false },
  ];

  return (
    <View style={{ gap: 12 }}>
      {DETAIL_ROWS.map(({ label, field, isPremium }) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text allowFontScaling={false} style={{ width: 100, flexShrink: 0, color: colors.secondaryText, fontSize: 12, fontWeight: '600' }}>
            {label}:
          </Text>
          {isPremium && !isUnlocked ? (
            <PremiumLockText colors={colors} canUnlock={hasSub} />
          ) : (
            <Text
              allowFontScaling={false}
              numberOfLines={3}
              ellipsizeMode="tail"
              style={{ 
                flex: 1, 
                color: project[field] ? colors.text : colors.secondaryText + '90', 
                fontSize: 12, 
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
  onViewProject,
  isPremium: hasSub,
  startupProfileId
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
  const isStartup = user && (user.role === 'startup' || user.role === 'Startup' || String(user.role) === '0');

  const isOwner = startupProfileId && startup.startupId === startupProfileId;
  const isUnlocked = startup.isUnlockedByCurrentUser || isOwner;

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
        borderWidth: 1,
      }
    ]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleNavigateDetail} style={{ padding: 16 }}>
        
        {/* CARD HEADER */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(startupNameDisp) }]}>
            {startup.logo ? (
              <Image source={{ uri: startup.logo }} style={styles.avatarImg} />
            ) : (
              <Text allowFontScaling={false} style={styles.avatarTxt}>{startupNameDisp.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '800', color: colors.text }}>
                {startupNameDisp}
              </Text>
              <Text allowFontScaling={false} style={{ fontSize: 10, color: colors.secondaryText, fontWeight: '500' }}>
                {formatDate(startup.createdAt || startup.timestamp)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
              <AIScoreBadge score={scoreValue} colors={colors} />
              <StageBadge stage={startup.stage} />
              <Text allowFontScaling={false} style={{ fontSize: 12, color: colors.secondaryText, fontWeight: '600' }}>#{startup.industry || 'Khác'}</Text>
            </View>
          </View>
        </View>

        {/* PROJECT TITLE */}
        <Text allowFontScaling={false} style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 8, letterSpacing: -0.5 }}>
          {startup.name || startup.projectName}
        </Text>

        {/* DESCRIPTION */}
        <Text allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail" style={{ fontSize: 13, color: colors.secondaryText, lineHeight: 20, marginBottom: 14 }}>
          {startup.description}
        </Text>

        {/* INTEREST ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text allowFontScaling={false} style={{
            fontSize: 13,
            color: colors.primary,
            fontWeight: '800',
            marginLeft: 6,
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

        {/* HIGHLIGHT LIST */}
        <View style={{ gap: 6, marginBottom: 14 }}>
          {[
            { 
              label: 'Doanh thu', 
              value: startup.revenue, 
              color: colors.accentCyan,
              formatter: (v) => v > 0 ? `${(v / 1000000).toLocaleString('vi-VN')}M` : '0 đ'
            },
            { 
              label: 'Thị trường', 
              value: startup.marketSize, 
              color: colors.accentGreen,
              formatter: (v) => v > 0 ? `${(v / 1000000).toLocaleString('vi-VN')}VND` : '0 đ'
            },
            { 
              label: 'Đối thủ chính', 
              value: startup.competitors, 
              color: colors.text,
              formatter: (v) => v || '—'
            }
          ].map((item, idx) => (
            <View key={idx} style={{ 
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
              borderWidth: 1, borderColor: colors.border
            }}>
              <Text allowFontScaling={false} style={{ fontSize: 12, color: colors.secondaryText, fontWeight: '600' }}>{item.label}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {(isOwner || isUnlocked) && (item.value === undefined || item.value === null) ? (
                  <PremiumLock colors={colors} canUnlock={hasSub} isUnlocked={isUnlocked} isOwner={isOwner} />
                ) : item.value !== undefined && item.value !== null ? (
                  <Text allowFontScaling={false} style={{ fontSize: 14, fontWeight: '800', color: item.color }} numberOfLines={1}>
                    {item.formatter(item.value)}
                  </Text>
                ) : (
                  <PremiumLock colors={colors} canUnlock={hasSub} isUnlocked={isUnlocked} isOwner={isOwner} />
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16, opacity: 0.3 }} />

        {/* DETAIL ROWS */}
        <DetailRows project={startup} colors={colors} isUnlocked={isUnlocked} isPremium={hasSub} />

        {/* TEAM ROW */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <Text allowFontScaling={false} style={{ width: 100, flexShrink: 0, color: colors.secondaryText, fontSize: 12, fontWeight: '600' }}>
            Team:
          </Text>
          {isUnlocked || (startup.teamMembers !== undefined && startup.teamMembers !== null) ? (
            <Text allowFontScaling={false} style={{ flex: 1, color: colors.text, fontSize: 12 }}>{startup.teamMembers || 'Chưa cập nhật'}</Text>
          ) : (
            <PremiumLockText colors={colors} canUnlock={hasSub} />
          )}
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
            <Text allowFontScaling={false} style={styles.actionBtnText}>{hasRequested ? 'Đã yêu cầu' : 'Yêu cầu Info'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowInvestmentModal(true)}
          >
            <TrendingUp size={16} color="#fff" />
            <Text allowFontScaling={false} style={styles.actionBtnText}>Đầu tư</Text>
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
    borderRadius: 16, 
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      }
    }),
    marginBottom: 0,
  },
  avatar: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  projectImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, marginBottom: 16 },
  premiumLock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 2 },
  premiumLockText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
  gridRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  highlightBox: { flex: 1, borderWidth: 1.2, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  highlightValue: { fontSize: 14, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  highlightLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center', textTransform: 'uppercase' },
  actionsContainer: { flexDirection: 'row', padding: 16, paddingTop: 0, gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' }
});
