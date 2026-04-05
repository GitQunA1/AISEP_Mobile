import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Modal 
} from 'react-native';
import { Calendar, Clock, Plus, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import advisorAvailabilityService from '../../services/advisorAvailabilityService';

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour}:${minute}:00`;
});

export default function AdvisorAvailability() {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('10:00:00');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAvailabilities = useCallback(async () => {
    try {
      const data = await advisorAvailabilityService.getMyAvailabilities();
      setAvailabilities(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('[AdvisorAvailability] fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailabilities();
  }, [fetchAvailabilities]);

  const handleCreate = async () => {
    if (startTime >= endTime) {
      Alert.alert('Lỗi', 'Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        slotDate: selectedDate,
        startTime,
        endTime
      };
      await advisorAvailabilityService.createMyAvailability(payload);
      setShowAddModal(false);
      fetchAvailabilities();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo lịch rảnh. Có thể trùng với lịch đã có.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = (id, isBooked) => {
    if (isBooked) {
      Alert.alert('Thông báo', 'Không thể xóa lịch đã được đặt.');
      return;
    }

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa lịch rảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await advisorAvailabilityService.deleteMyAvailability(id);
              fetchAvailabilities();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa lịch rảnh.');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  // Generate next 14 days for date selector
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayLabel = i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' });
    const dateLabel = d.getDate();
    return { iso, dayLabel, dateLabel };
  });

  const filteredSlots = availabilities
    .filter(s => s.slotDate?.split('T')[0] === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const renderSlot = (slot) => {
    const isBooked = slot.status === 1 || slot.status === 'Booked';
    const isDeleting = deletingId === slot.advisorAvailabilityId;

    return (
      <FadeInView key={slot.advisorAvailabilityId}>
        <View style={[styles.slotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.slotStatusStrip, { backgroundColor: isBooked ? colors.primary : colors.statusApprovedText }]} />
          <View style={styles.slotInfo}>
            <View style={styles.timeRow}>
              <Clock size={16} color={colors.secondaryText} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isBooked ? colors.primary + '15' : colors.statusApprovedBg }]}>
              <Text style={[styles.statusText, { color: isBooked ? colors.primary : colors.statusApprovedText }]}>
                {isBooked ? 'Đã được đặt' : 'Đang rảnh'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handleDelete(slot.advisorAvailabilityId, isBooked)}
            disabled={isBooked || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Trash2 size={20} color={isBooked ? colors.border : colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </FadeInView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <View style={[styles.dateSelector, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {dates.map((item) => {
            const isActive = selectedDate === item.iso;
            return (
              <TouchableOpacity 
                key={item.iso} 
                onPress={() => setSelectedDate(item.iso)}
                style={[styles.dateItem, isActive && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.dayLabel, { color: isActive ? '#fff' : colors.secondaryText }]}>{item.dayLabel}</Text>
                <Text style={[styles.dateLabel, { color: isActive ? '#fff' : colors.text }]}>{item.dateLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={styles.contentPadding}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchAvailabilities(); }} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lịch rảnh trong ngày</Text>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]} 
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addBtnText}>Thêm lịch</Text>
          </TouchableOpacity>
        </View>

        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredSlots.length > 0 ? (
          filteredSlots.map(renderSlot)
        ) : (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Không có lịch rảnh nào.</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Slot Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thêm khung giờ rảnh</Text>
            <Text style={[styles.modalSub, { color: colors.secondaryText }]}>
              {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>

            <View style={styles.timeDropdowns}>
              <View style={styles.dropdownGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Bắt đầu</Text>
                <ScrollView style={[styles.dropdown, { borderColor: colors.border }]} nestedScrollEnabled>
                  {TIME_OPTIONS.slice(0, -1).map(t => (
                    <TouchableOpacity key={`start-${t}`} onPress={() => setStartTime(t)} style={[styles.option, startTime === t && { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.optionText, { color: colors.text }]}>{t.slice(0, 5)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dropdownGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Kết thúc</Text>
                <ScrollView style={[styles.dropdown, { borderColor: colors.border }]} nestedScrollEnabled>
                  {TIME_OPTIONS.slice(1).map(t => (
                    <TouchableOpacity key={`end-${t}`} onPress={() => setEndTime(t)} style={[styles.option, endTime === t && { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.optionText, { color: colors.text }]}>{t.slice(0, 5)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.secondaryText }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleCreate} disabled={isCreating}>
                {isCreating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateSelector: { borderBottomWidth: 1, paddingVertical: 12 },
  dateScroll: { paddingHorizontal: 16, gap: 10 },
  dateItem: { width: 55, height: 75, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dayLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dateLabel: { fontSize: 18, fontWeight: '900' },
  contentScroll: { flex: 1 },
  contentPadding: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  slotCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  slotStatusStrip: { width: 4, height: '100%', position: 'absolute', left: 0 },
  slotInfo: { flex: 1, marginLeft: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  timeText: { fontSize: 17, fontWeight: '800' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  deleteBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 32, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  modalSub: { fontSize: 14, fontWeight: '600', marginBottom: 24 },
  timeDropdowns: { flexDirection: 'row', gap: 16, height: 250, marginBottom: 24 },
  dropdownGroup: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  dropdown: { flex: 1, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  option: { padding: 12, alignItems: 'center' },
  optionText: { fontSize: 15, fontWeight: '700' },
  modalFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '800' },
  confirmBtn: { flex: 2, padding: 16, borderRadius: 16, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '800' }
});
