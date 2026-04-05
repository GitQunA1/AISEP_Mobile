import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { MessageSquare, Clock, User, Check, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';

/**
 * InvestorConnectionRequests - Displays inquires from investors for Startups
 * Ported from Web version for feature parity
 */
export default function InvestorConnectionRequests({ 
  requests = [], 
  onApprove, 
  onReject, 
  onChat,
  isLoading,
  onRefresh
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const [processingId, setProcessingId] = useState(null);

  const handleAction = async (requestId, action) => {
    setProcessingId(requestId);
    if (action === 'approve') {
      await onApprove(requestId);
    } else {
      await onReject(requestId);
    }
    setProcessingId(null);
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === 'pending';
    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';
    const isProcessing = processingId === item.connectionRequestId;

    let statusLabel = 'Đang chờ';
    let statusColor = colors.accentOrange;
    let statusBg = colors.accentOrange + '15';

    if (isAccepted) {
      statusLabel = 'Đã chấp nhận';
      statusColor = colors.accentGreen;
      statusBg = colors.accentGreen + '15';
    } else if (isRejected) {
      statusLabel = 'Đã từ chối';
      statusColor = colors.error;
      statusBg = colors.error + '15';
    }

    return (
      <FadeInView>
        <Card style={[styles.card, { borderTopColor: statusColor }]}>
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Clock size={12} color={colors.secondaryText} />
              <Text style={[styles.dateText, { color: colors.secondaryText }]}>{item.sentDate}</Text>
            </View>
          </View>

          <View style={styles.investorInfo}>
            <User size={16} color={colors.primary} />
            <Text style={[styles.investorName, { color: colors.text }]}>
              Nhà đầu tư: <Text style={{ fontWeight: '800' }}>{item.investorName}</Text>
            </Text>
          </View>

          {item.message ? (
            <Text style={[styles.message, { color: colors.secondaryText }]} numberOfLines={3}>
              "{item.message}"
            </Text>
          ) : null}

          <View style={styles.actions}>
            {isPending && (
              <>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.accentGreen }]}
                  onPress={() => handleAction(item.connectionRequestId, 'approve')}
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
                  style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleAction(item.connectionRequestId, 'reject')}
                  disabled={isProcessing}
                >
                  <Text style={styles.btnText}>Từ chối</Text>
                </TouchableOpacity>
              </>
            )}

            {isAccepted && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.chatBtn, { backgroundColor: colors.primary }]}
                onPress={() => onChat(item)}
              >
                <MessageSquare size={16} color="#fff" />
                <Text style={styles.btnText}>Bắt đầu chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </FadeInView>
    );
  };

  if (isLoading && requests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải yêu cầu...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.connectionRequestId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isLoading}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Chưa có yêu cầu thông tin nào từ nhà đầu tư.
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
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  investorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  investorName: {
    fontSize: 14,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 16,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
  },
  approveBtn: {},
  rejectBtn: {
    flex: 0.5,
  },
  chatBtn: {
    width: '100%',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  }
});
