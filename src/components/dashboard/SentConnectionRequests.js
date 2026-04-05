import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { MessageSquare, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import connectionService from '../../services/connectionService';

export default function SentConnectionRequests({ onChat, onRefreshDashboard }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const response = await connectionService.getMyConnectionRequests();
      const items = response?.data?.items || response?.data || [];
      
      const formatted = items.map(req => ({
        id: req.connectionRequestId || req.id,
        startupName: req.startupName || 'Startup',
        projectName: req.projectName || 'Dự án',
        status: req.status || 'Pending',
        message: req.message || '',
        responseDate: req.responseDate ? new Date(req.responseDate).toLocaleString('vi-VN') : null,
        chatSessionId: req.chatSessionId
      }));
      
      setRequests(formatted);
    } catch (error) {
      console.error('[SentConnectionRequests] fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return { label: 'Chấp nhận', color: colors.statusApprovedText, bg: colors.statusApprovedBg, icon: <CheckCircle size={14} color={colors.statusApprovedText} /> };
      case 'rejected':
      case 'declined':
        return { label: 'Từ chối', color: colors.statusRejectedText, bg: colors.statusRejectedBg, icon: <XCircle size={14} color={colors.statusRejectedText} /> };
      default:
        return { label: 'Đang chờ', color: colors.statusPendingText, bg: colors.statusPendingBg, icon: <Clock size={14} color={colors.statusPendingText} /> };
    }
  };

  const renderItem = ({ item, index }) => {
    const status = getStatusInfo(item.status);
    const canChat = (item.status?.toLowerCase() === 'accepted' || item.status?.toLowerCase() === 'approved') && item.chatSessionId;

    return (
      <FadeInView delay={index * 100}>
        <Card style={[styles.requestCard, { borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerMain}>
              <Text style={[styles.startupName, { color: colors.text }]} numberOfLines={1}>
                {item.startupName}
              </Text>
              <Text style={[styles.projectName, { color: colors.secondaryText }]} numberOfLines={1}>
                Dự án: {item.projectName}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              {status.icon}
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {item.message ? (
            <View style={[styles.messageBox, { backgroundColor: colors.mutedBackground }]}>
              <Text style={[styles.messageText, { color: colors.secondaryText }]} numberOfLines={2}>
                "{item.message}"
              </Text>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.cardFooter}>
            <Text style={[styles.dateText, { color: colors.secondaryText }]}>
              {item.responseDate ? `Phản hồi: ${item.responseDate}` : 'Chưa có phản hồi'}
            </Text>
            
            {canChat ? (
              <TouchableOpacity 
                style={[styles.chatBtn, { backgroundColor: colors.primary }]}
                onPress={() => onChat?.(item)}
              >
                <MessageSquare size={16} color="#fff" />
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
            ) : (
              <ChevronRight size={18} color={colors.border} />
            )}
          </View>
        </Card>
      </FadeInView>
    );
  };

  if (isLoading && !isRefreshing) {
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
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl 
          refreshing={isRefreshing} 
          onRefresh={() => { setIsRefreshing(true); fetchRequests(); }} 
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Bạn chưa có yêu cầu kết nối nào.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 20 },
  loadingContainer: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center' },
  requestCard: { padding: 18, marginBottom: 16, borderRadius: 24, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerMain: { flex: 1, marginRight: 10 },
  startupName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  projectName: { fontSize: 13, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  messageBox: { padding: 12, borderRadius: 16, marginBottom: 16 },
  messageText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  divider: { height: 1, width: '100%', marginBottom: 14, opacity: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 11, fontWeight: '600', flex: 1 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  chatBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 16 },
  emptyText: { fontSize: 15, fontWeight: '700' }
});
