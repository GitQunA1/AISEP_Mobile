import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  FlatList, ActivityIndicator, Dimensions 
} from 'react-native';
import { 
  Briefcase, CheckCircle, XCircle, Clock, 
  ChevronRight, ShieldCheck, FileSignature, DollarSign, ArrowRight, FileText, User
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEAL_STATUS_MAP = {
  0: { label: 'Chờ xác nhận', color: '#f59e0b', icon: Clock },
  'PENDING': { label: 'Chờ xác nhận', color: '#f59e0b', icon: Clock },
  1: { label: 'Đã xác nhận', color: '#10b981', icon: CheckCircle },
  'CONFIRMED': { label: 'Đã xác nhận', color: '#10b981', icon: CheckCircle },
  'ACCEPTED': { label: 'Đã xác nhận', color: '#10b981', icon: CheckCircle },
  2: { label: 'Chờ ký', color: '#f97316', icon: FileSignature },
  'WAITING_FOR_STARTUP_SIGNATURE': { label: 'Chờ ký', color: '#f97316', icon: FileSignature },
  3: { label: 'Đã ký kết', color: '#667eea', icon: FileSignature },
  'CONTRACT_SIGNED': { label: 'Đã ký kết', color: '#667eea', icon: FileSignature },
  'SIGNED': { label: 'Đã ký kết', color: '#667eea', icon: FileSignature },
  4: { label: 'Minted NFT', color: '#8b5cf6', icon: ShieldCheck },
  'MINTED_NFT': { label: 'Minted NFT', color: '#8b5cf6', icon: ShieldCheck },
  5: { label: 'Bị từ chối', color: '#ef4444', icon: XCircle },
  'REJECTED': { label: 'Bị từ chối', color: '#ef4444', icon: XCircle },
  6: { label: 'Thất bại', color: '#dc2626', icon: XCircle },
  'FAILED': { label: 'Thất bại', color: '#dc2626', icon: XCircle },
  7: { label: 'Hoàn tất', color: '#10b981', icon: CheckCircle },
  'COMPLETED': { label: 'Hoàn tất', color: '#10b981', icon: CheckCircle },
};

export default function InvestmentDeals({ 
  deals, 
  isLoading, 
  onApprove, 
  onReject, 
  onSign, 
  onVerifyOnchain,
  onViewProfile,
  onRefresh,
  isRespondingId 
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const renderHeader = () => {
    const stats = {
      total: deals.length,
      pending: deals.filter(d => ['PENDING', 'WAITING_FOR_STARTUP_SIGNATURE'].includes(d.statusStr) || [0, 2].includes(d.status)).length,
      completed: deals.filter(d => ['CONTRACT_SIGNED', 'COMPLETED', 'MINTED_NFT'].includes(d.statusStr) || [3, 4, 7].includes(d.status)).length,
    };

    const CARD_WIDTH = (SCREEN_WIDTH - 40 - 20) / 3;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatItem label="Tổng" value={stats.total} color={colors.text} colors={colors} width={CARD_WIDTH} />
          <StatItem label="Đang chờ" value={stats.pending} color="#f59e0b" colors={colors} width={CARD_WIDTH} />
          <StatItem label="Hoàn tất" value={stats.completed} color="#10b981" colors={colors} width={CARD_WIDTH} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const status = DEAL_STATUS_MAP[item.statusStr] || DEAL_STATUS_MAP[item.status] || { label: String(item.status), color: colors.primary, icon: Briefcase };
    const isResponding = isRespondingId === item.dealId;
    
    const canVerify = ['CONFIRMED', 'ACCEPTED', 'WAITING_FOR_STARTUP_SIGNATURE'].includes(item.statusStr) || [1, 2].includes(item.status);
    const isProcessed = ['CONTRACT_SIGNED', 'MINTED_NFT', 'COMPLETED'].includes(item.statusStr) || [3, 4, 7].includes(item.status);
    const hasBlockchain = item.statusStr === 'MINTED_NFT' || item.statusStr === 'COMPLETED' || [4, 7].includes(item.status);

    const formatCurrency = (amount) => {
      if (!amount) return '0 đ';
      return amount.toLocaleString('vi-VN') + ' đ';
    };

    return (
      <FadeInView>
        <Card style={styles.dealCard}>
          <TouchableOpacity 
            style={styles.cardHeader} 
            onPress={() => onViewProfile(item.investorId)}
            activeOpacity={0.7}
          >
            <View style={styles.investorInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.accentCyan + '20' }]}>
                <DollarSign size={20} color={colors.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.investorName, { color: colors.text }]} numberOfLines={1}>
                    {item.investorName || 'Nhà đầu tư'}
                  </Text>
                  <ChevronRight size={14} color={colors.border} />
                </View>
                <Text style={[styles.projectName, { color: colors.secondaryText }]} numberOfLines={1}>
                  Dự án: {item.projectName || 'Dự án'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { borderColor: status.color, backgroundColor: status.color + '10' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.secondaryText }]}>Số vốn đề nghị</Text>
              <Text style={[styles.amountValue, { color: colors.accentCyan }]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <ArrowRight size={16} color={colors.border} />
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.secondaryText }]}>Cổ phần</Text>
              <Text style={[styles.amountValue, { color: colors.text }]}>
                {item.equityOffer}%
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Clock size={14} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <View style={styles.cardActions}>
            {(item.statusStr === 'PENDING' || item.status === 0) && (
              <>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.accentCyan }]}
                  onPress={() => onApprove(item.dealId)}
                  disabled={isResponding}
                >
                  {isResponding ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle size={20} color="#fff" />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
                  onPress={() => onReject(item.dealId)}
                  disabled={isResponding}
                >
                  <XCircle size={20} color={colors.error} />
                </TouchableOpacity>
              </>
            )}

            {(canVerify || isProcessed) && (
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  styles.primaryBtn, 
                  { backgroundColor: colors.primary }
                ]}
                onPress={() => onSign(item)}
              >
                <FileText size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {hasBlockchain && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: '#2563eb', flex: 1 }]}
                onPress={() => onVerifyOnchain(item)}
              >
                <ShieldCheck size={20} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.mutedBackground }]}
              onPress={() => onViewProfile(item.investorId)}
            >
              <User size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <FlatList
      data={deals}
      renderItem={renderItem}
      keyExtractor={item => item.dealId.toString()}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isLoading}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.accentCyan + '10' }]}>
            <Briefcase size={48} color={colors.accentCyan} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Không có thỏa thuận</Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Các đề xuất đầu tư và thỏa thuận góp vốn sẽ hiển thị tại đây để bạn xử lý.
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
  dealCard: { padding: 16, marginBottom: 16, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  investorInfo: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  investorName: { fontSize: 16, fontWeight: '800' },
  projectName: { fontSize: 13, fontWeight: '600' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 12, opacity: 0.5 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  amountItem: { flex: 1 },
  amountLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  amountValue: { fontSize: 17, fontWeight: '900' },
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
  primaryBtn: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
