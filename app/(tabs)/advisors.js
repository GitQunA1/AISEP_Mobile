import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Search, MapPin, Star, CheckCircle, DollarSign, Users } from 'lucide-react-native';
import advisorService from '../../src/services/advisorService';
import bookingService from '../../src/services/bookingService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import Card from '../../src/components/Card';
import { useRouter } from 'expo-router';
import AdvisorBookingModal from '../../src/components/AdvisorBookingModal';

export default function AdvisorsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const [advisors, setAdvisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  
  // Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAdvisorForBooking, setSelectedAdvisorForBooking] = useState(null);

  const roleValue = user?.role;
  const roleStr = typeof roleValue === 'string' ? roleValue.toLowerCase() : '';
  const canConnect = roleStr === 'startup' || roleStr === 'investor' || roleValue === 0 || roleValue === 1;

  const fetchAdvisors = async () => {
    try {
      const response = await advisorService.getAllAdvisors();
      const items = response?.data?.items || response?.items || [];
      setAdvisors(items);
    } catch (err) {
      console.error('Failed to load advisors:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchMyBookings = async () => {
    const userId = user?.userId || user?.userId; // Adjust based on AuthContext user object
    if (!userId) return;
    try {
      const response = await bookingService.getMyCustomerBookings(userId);
      const items = response?.items || response?.data?.items || response || [];
      if (Array.isArray(items)) setMyBookings(items);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    }
  };

  useEffect(() => {
    fetchAdvisors();
    fetchMyBookings();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAdvisors();
    fetchMyBookings();
  };

  const handleConnect = (advisor) => {
    if (!canConnect) {
      alert('Chỉ Startup hoặc Investor mới có thể kết nối với cố vấn.');
      return;
    }
    setSelectedAdvisorForBooking(advisor);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (advisorId) => {
    setMyBookings(prev => [...prev, { advisorId, status: 0 }]);
  };

  const filteredAdvisors = advisors.filter(advisor =>
    (advisor.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (advisor.expertise?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getBookingStatus = (advisorId) => {
    const booking = myBookings.find(b => b.advisorId === advisorId);
    return booking ? booking.status : null;
  };

  const renderAdvisorItem = ({ item }) => {
    const expertises = item.expertise ? item.expertise.split(',').map(s => s.trim()) : [];
    const status = getBookingStatus(item.advisorId);
    
    return (
      <Card style={styles.advisorCard}>
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: item.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}&background=random` }} 
            style={styles.avatar} 
          />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{item.userName}</Text>
              {item.approvalStatus === 'Approved' && <CheckCircle size={14} color={colors.primary} style={{marginLeft: 4}} />}
            </View>
            <View style={styles.expertiseContainer}>
              {expertises.slice(0, 3).map((exp, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{exp}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.bio, { color: colors.text }]} numberOfLines={2}>
          {item.bio || 'Chưa có thông tin giới thiệu.'}
        </Text>

        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.location || 'Nghề nghiệp tự do'}</Text>
          </View>
          <View style={styles.metaItem}>
            <DollarSign size={12} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.hourlyRate?.toLocaleString('vi-VN')} đ/h</Text>
          </View>
          <View style={styles.metaItem}>
            <Star size={12} color={colors.warning} fill={colors.warning} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.rating || 0}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.viewProfileBtn, { borderColor: colors.border }]}
            onPress={() => router.push(`/advisor/${item.advisorId}`)}
          >
            <Text style={[styles.viewProfileText, { color: colors.text }]}>Hồ sơ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.connectBtn, 
              { backgroundColor: colors.primary },
              (status === 0 || status === 'Pending') && { backgroundColor: colors.secondaryText },
              (status === 1 || status === 'Confirmed' || status === 'Accepted') && { backgroundColor: '#10b981' }
            ]}
            disabled={status !== null}
            onPress={() => handleConnect(item)}
          >
            <Text style={[styles.connectText, status !== null && {color: '#fff'}]}>
              {status === 0 || status === 'Pending' ? 'Đang chờ' : 
               status === 1 || status === 'Confirmed' || status === 'Accepted' ? 'Đã kết nối' : 'Kết nối'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.secondaryBackground }]}>
      <View style={[styles.searchSection, { backgroundColor: colors.background }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.secondaryBackground }]}>
          <Search size={20} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm theo tên hoặc chuyên môn"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
      </View>

      <FlatList
        data={filteredAdvisors}
        renderItem={renderAdvisorItem}
        keyExtractor={(item) => item.advisorId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Users size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy cố vấn</Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Hãy thử tìm kiếm từ khóa khác.</Text>
            </View>
          )
        }
      />

      {showBookingModal && (
        <AdvisorBookingModal
          isVisible={showBookingModal}
          advisor={selectedAdvisorForBooking}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: { padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingHorizontal: 16, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  list: { padding: 16 },
  advisorCard: { marginBottom: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  expertiseContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(29, 155, 240, 0.05)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 4 },
  tagText: { fontSize: 11, color: '#1d9bf0', fontWeight: '600' },
  bio: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  metadata: { flexDirection: 'row', marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { fontSize: 12, marginLeft: 4 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  viewProfileBtn: { flex: 1, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#cfd9de', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  viewProfileText: { fontWeight: '600', fontSize: 14 },
  connectBtn: { flex: 2, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  connectText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
});
