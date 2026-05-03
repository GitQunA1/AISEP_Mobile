import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  FlatList, ActivityIndicator, Platform 
} from 'react-native';
import { X, Trash2, CheckCircle2, BellOff, Info } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import notificationService from '../../services/notificationService';
import Card from '../Card';

export default function NotificationCenter({ visible, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, handleNotificationAction } = useNotifications();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();

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
      onClose();
    };

    return (
      <TouchableOpacity 
        style={[
          styles.notifItem, 
          { borderBottomColor: colors.border },
          !item.isRead && { backgroundColor: colors.primary + '05' }
        ]}
        onPress={handlePress}
      >
        <View style={[styles.iconContainer, { backgroundColor: style.bgColor }]}>
          <Text style={{ fontSize: 20 }}>{style.icon}</Text>
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
          <Text style={[styles.notifTime, { color: colors.secondaryText }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Thông báo</Text>
            {unreadCount > 0 && (
              <Text style={[styles.subtitle, { color: colors.primary }]}>
                Bạn có {unreadCount} thông báo mới
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.mutedBackground }]}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {notifications.length > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={markAllAsRead}
            >
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Đánh dấu tất cả đã đọc</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.notificationId.toString()}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.centered}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.mutedBackground }]}>
              <BellOff size={40} color={colors.secondaryText} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Không có thông báo nào</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
              Chúng tôi sẽ thông báo cho bạn khi có cập nhật mới
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20 },
  actionsBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  notifMessage: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  notifTime: { fontSize: 12, fontWeight: '500' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
