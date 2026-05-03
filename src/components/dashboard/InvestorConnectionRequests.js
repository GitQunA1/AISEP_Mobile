import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  FlatList, ActivityIndicator, Dimensions 
} from 'react-native';
import { 
  MessageCircle, User as UserIcon, CheckCircle2, XCircle as XCircleIcon, 
  Clock as ClockIcon, ChevronRight as ChevronIcon, Search as SearchIcon, Briefcase as BriefcaseIcon 
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b', icon: ClockIcon },
  approved: { label: 'Đã kết nối', color: '#10b981', icon: CheckCircle2 },
  accepted: { label: 'Đã kết nối', color: '#10b981', icon: CheckCircle2 },
  rejected: { label: 'Từ chối', color: '#ef4444', icon: XCircleIcon },
};

export default function InvestorConnectionRequests({ 
  requests, 
  isLoading, 
  onApprove, 
  onReject, 
  onChat, 
  onViewProfile,
  onRefresh 
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const renderHeader = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved' || r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };

    const CARD_WIDTH = (SCREEN_WIDTH - 40 - 30) / 4;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatItem label="Tổng" value={stats.total} color={colors.text} colors={colors} width={CARD_WIDTH} />
          <StatItem label="Chờ" value={stats.pending} color="#f59e0b" colors={colors} width={CARD_WIDTH} />
          <StatItem label="Đã nối" value={stats.approved} color="#10b981" colors={colors} width={CARD_WIDTH} />
          <StatItem label="Từ chối" value={stats.rejected} color="#ef4444" colors={colors} width={CARD_WIDTH} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || { label: item.status, color: colors.primary, icon: BriefcaseIcon };

    return (
      <FadeInView>
        <Card style={styles.requestCard}>
          <TouchableOpacity 
            style={styles.cardHeader} 
            onPress={() => onViewProfile(item.investorId)}
            activeOpacity={0.7}
          >
            <View style={styles.investorInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.investorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.investorName, { color: colors.text }]} numberOfLines={1}>
                    {item.investorName}
                  </Text>
                  <ChevronIcon size={14} color={colors.border} />
                </View>
                <Text style={[styles.roleText, { color: colors.secondaryText }]}>Nhà đầu tư</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { borderColor: status.color, backgroundColor: status.color + '10' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.messageRow}>
            <Text style={[styles.messageLabel, { color: colors.secondaryText }]}>Lời nhắn:</Text>
            <Text style={[styles.messageText, { color: colors.text }]} numberOfLines={3}>
              {item.message || 'Không có lời nhắn đi kèm.'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <ClockIcon size={14} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {item.sentDate}
            </Text>
          </View>

          <View style={styles.cardActions}>
            {item.status === 'pending' ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => onApprove(item.connectionRequestId)}
                >
                  <CheckCircle2 size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
                  onPress={() => onReject(item.connectionRequestId)}
                >
                  <XCircleIcon size={22} color={colors.error} />
                </TouchableOpacity>
              </>
            ) : (item.status === 'approved' || item.status === 'accepted') ? (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => onChat(item)}
              >
                <MessageCircle size={22} color="#fff" />
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
              onPress={() => onViewProfile(item.investorId)}
            >
              <UserIcon size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Card>
      </FadeInView>
    );
  };

  if (isLoading && requests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      renderItem={renderItem}
      keyExtractor={item => item.connectionRequestId.toString()}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isLoading}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
            <MessageCircle size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có kết nối</Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Khi các nhà đầu tư quan tâm đến dự án của bạn, các yêu cầu kết nối sẽ xuất hiện tại đây.
          </Text>
        </View>
      }
    />
  );
}

function StatItem({ label, value, color, colors, width }) {
  return (
    <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border, width }]}>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statsContainer: { paddingVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: {
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statLabel: { fontSize: 9, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '900' },
  requestCard: { padding: 16, marginBottom: 16, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  investorInfo: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  investorName: { fontSize: 16, fontWeight: '800' },
  roleText: { fontSize: 13, fontWeight: '600' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 12, opacity: 0.5 },
  messageRow: { marginBottom: 16 },
  messageLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { fontSize: 12, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  actionBtn: { 
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
