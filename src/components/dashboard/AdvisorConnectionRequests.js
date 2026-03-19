import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';

export default function AdvisorConnectionRequests({ requests = [], onAccept, onReject, style }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const [processingId, setProcessingId] = useState(null);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    if (action === 'accept') {
      await onAccept(id);
    } else {
      await onReject(id);
    }
    setProcessingId(null);
  };

  if (!requests || requests.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Yêu cầu tư vấn từ cố vấn</Text>
        </View>
        <Card style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Chưa có yêu cầu tư vấn nào.</Text>
        </Card>
      </View>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Yêu cầu tư vấn từ cố vấn
        </Text>
        {pendingRequests.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.warning }]}>
            <Text style={[styles.badgeText, { color: '#fff' }]}>{pendingRequests.length} Chờ xử lý</Text>
          </View>
        )}
      </View>

      {requests.map((request) => {
        const isPending = request.status === 'pending';
        const isAccepted = request.status === 'accepted';
        const isProcessing = processingId === request.id;
        
        let badgeText = 'Đang chờ';
        let badgeColor = colors.secondaryText;
        let badgeBg = colors.secondaryText + '15';

        if (isAccepted) {
          badgeText = 'Đã kết nối';
          badgeColor = colors.statusApprovedText;
          badgeBg = colors.statusApprovedBg;
        } else if (request.status === 'rejected') {
          badgeText = 'Từ chối';
          badgeColor = colors.statusRejectedText;
          badgeBg = colors.statusRejectedBg;
        }

        return (
          <Card key={request.id} style={styles.requestCard}>
            <View style={styles.cardHeader}>
              <View style={styles.advisorInfo}>
                <Text style={[styles.advisorName, { color: colors.text }]}>{request.advisorName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.statusText, { color: badgeColor }]}>{badgeText}</Text>
                </View>
              </View>
            </View>

            <View style={styles.expertiseContainer}>
              <View style={[styles.expertiseBadge, { backgroundColor: colors.mutedBackground }]}>
                <Text style={[styles.expertiseText, { color: colors.secondaryText }]}>{request.expertise}</Text>
              </View>
            </View>

            <Text style={[styles.message, { color: colors.secondaryText }]} numberOfLines={3}>
              {request.message}
            </Text>

            <View style={styles.metaData}>
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>Ngày yêu cầu: {request.requestDate}</Text>
              {request.appointmentDate && (
                <Text style={[styles.metaText, { color: colors.secondaryText }]}> • Cuộc hẹn: {request.appointmentDate}</Text>
              )}
            </View>

            {isPending && (
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAction(request.id, 'accept')}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Chấp nhận</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.secondaryBtn, { borderColor: colors.error }]}
                  onPress={() => handleAction(request.id, 'reject')}
                  disabled={isProcessing}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.error }]}>Từ chối</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  requestCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'transparent', // Card component might have default border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  advisorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  advisorName: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '65%',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expertiseContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  expertiseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expertiseText: {
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  metaData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
