import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, RefreshControl 
} from 'react-native';
import { Bell, CheckCircle2, Trash2, BellOff, ChevronRight } from 'lucide-react-native';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import notificationService from '../../src/services/notificationService';
import Card from '../../src/components/Card';

export default function NotificationsScreen() {
  const { 
    notifications, unreadCount, markAsRead, markAllAsRead, 
    loading, fetchNotifications, handleNotificationAction 
  } = useNotifications();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const renderItem = ({ item }) => {
    const style = notificationService.getNotificationStyle(item);
    
    const handlePress = () => {
      markAsRead(item.notificationId);
      handleNotificationAction(item);
    };

    return (
      <TouchableOpacity 
        style={[
          styles.notifItem, 
          { borderBottomColor: colors.border },
          !item.isRead && { backgroundColor: colors.primary + '08' }
        ]}
        onPress={handlePress}
      >
        <View style={[styles.iconContainer, { backgroundColor: style.bgColor }]}>
          <Text style={{ fontSize: 24 }}>{style.icon}</Text>
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, { color: colors.text }, !item.isRead && { fontWeight: '800' }]}>
              {item.title}
            </Text>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </View>
          <Text style={[styles.notifMessage, { color: colors.secondaryText }]} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.notifFooter}>
            <Text style={[styles.notifTime, { color: colors.secondaryText }]}>
              {formatDate(item.createdAt)}
            </Text>
            <ChevronRight size={16} color={colors.border} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Thông báo</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo mới` : 'Xem lại các cập nhật gần đây'}
            </Text>
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity 
              style={[styles.markAllBtn, { backgroundColor: colors.primary + '15' }]} 
              onPress={markAllAsRead}
            >
              <CheckCircle2 size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.notificationId.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={colors.primary} />
            }
          />
        ) : loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.centered}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.mutedBackground }]}>
              <BellOff size={48} color={colors.secondaryText} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Trống trơn</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
              Bạn không có thông báo nào vào lúc này.
            </Text>
            <TouchableOpacity 
              style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
              onPress={fetchNotifications}
            >
              <Text style={styles.refreshBtnText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  markAllBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  listContent: { paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  notifMessage: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTime: { fontSize: 12, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  refreshBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  refreshBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
