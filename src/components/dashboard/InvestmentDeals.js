import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Briefcase, Clock, User, Check, X, FileSignature } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import dealsService from '../../services/dealsService';

/**
 * InvestmentDeals - Displays investment offers from investors for Startups
 * Ported from Web version for feature parity
 */
export default function InvestmentDeals({ 
  deals = [], 
  onApprove, 
  onReject, 
  onSign,
  isLoading,
  onRefresh,
  isRespondingId,
  isInvestor = false
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const renderItem = ({ item }) => {
    // Web status mapping: 0=Pending, 1=Confirmed, 2=Waiting_For_Startup_Signature, 3=Contract_Signed, 4=Minted_NFT, 5=Rejected, 6=Failed
    const statusInfo = dealsService.getStatusInfo(item.status);
    const isPending = item.status === 'Pending' || item.status === 0;
    const isConfirmed = item.status === 'Confirmed' || item.status === 1;
    const isWaitingSignature = item.status === 'Waiting_For_Startup_Signature' || item.status === 2;
    const isSigned = (item.status === 'Contract_Signed' || item.status === 3) || (item.status === 'Minted_NFT' || item.status === 4);
    const isProcessing = isRespondingId === item.dealId;

    return (
      <FadeInView>
        <Card style={[styles.card, { borderTopColor: statusInfo.color }]}>
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.labelVi || statusInfo.label}
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <Clock size={12} color={colors.secondaryText} />
              <Text style={[styles.dateText, { color: colors.secondaryText }]}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
              </Text>
            </View>
          </View>

          <View style={styles.dealInfo}>
            <View style={styles.infoRow}>
              <User size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {isInvestor ? 'Startup: ' : 'NĐT: '}
                <Text style={{ fontWeight: '800' }}>
                  {isInvestor ? (item.startupName || item.projectName) : (item.investorName || 'Nhà đầu tư')}
                </Text>
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Briefcase size={16} color={colors.accentCyan} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Dự án: <Text style={{ fontWeight: '800' }}>{item.projectName || 'Tên dự án'}</Text>
              </Text>
            </View>

            {item.investmentAmount && (
              <View style={[styles.amountBadge, { backgroundColor: colors.accentGreen + '10' }]}>
                <Text style={[styles.amountText, { color: colors.accentGreen }]}>
                  💰 {item.investmentAmount.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {isPending && (
              <>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.accentGreen }]}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onApprove(item.dealId);
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Check size={16} color="#fff" />
                      <Text style={styles.btnText}>Chấp nhận</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.error }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onReject(item.dealId);
                  }}
                  disabled={isProcessing}
                >
                  <Text style={styles.btnText}>Từ chối</Text>
                </TouchableOpacity>
              </>
            )}

            {(isConfirmed || isWaitingSignature) && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSign(item);
                }}
              >
                <FileSignature size={18} color="#fff" />
                <Text style={styles.btnText}>
                  {isWaitingSignature ? 'Xem & Ký hợp đồng' : 'Ký hợp đồng'}
                </Text>
              </TouchableOpacity>
            )}

            {isSigned && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.accentCyan }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSign(item);
                }}
              >
                <Check size={18} color="#fff" />
                <Text style={styles.btnText}>Xem hợp đồng đã ký</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </FadeInView>
    );
  };

  return (
    <FlatList
      data={deals}
      keyExtractor={(item) => item.dealId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isLoading}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Briefcase size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Không có ưu đãi đầu tư nào cần xử lý.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderTopWidth: 3,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  dealInfo: {
    gap: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
  },
  amountBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
