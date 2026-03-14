import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Star, CheckCircle, DollarSign, Users, Mail, Phone, Calendar, Info, Target, Briefcase, User } from 'lucide-react-native';
import advisorService from '../../src/services/advisorService';
import THEME from '../../src/constants/Theme';
import { useAuth } from '../../src/context/AuthContext';
import AdvisorBookingModal from '../../src/components/AdvisorBookingModal';
import bookingService from '../../src/services/bookingService';

const DISPLAY = (val, fallback = 'Đang cập nhật') =>
  val && String(val).trim() ? val : fallback;

export default function AdvisorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [advisor, setAdvisor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const roleValue = user?.role;
  const roleStr = typeof roleValue === 'string' ? roleValue.toLowerCase() : '';
  const canConnect = roleStr === 'startup' || roleStr === 'investor' || roleValue === 0 || roleValue === 1;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [advisorData, bookingsData] = await Promise.all([
          advisorService.getAdvisorById(id),
          user?.userId ? bookingService.getMyCustomerBookings(user.userId) : Promise.resolve([])
        ]);

        if (advisorData) {
          setAdvisor(advisorData);
        } else {
          setError('Không tìm thấy thông tin cố vấn.');
        }

        const items = bookingsData?.items || bookingsData?.data?.items || bookingsData || [];
        if (Array.isArray(items)) setMyBookings(items);

      } catch (err) {
        console.error('Data fetch error:', err);
        setError('Lỗi khi tải thông tin.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user]);

  const handleConnect = () => {
    if (!canConnect) {
      Alert.alert('Hạn chế', 'Chỉ Startup hoặc Investor mới có thể kết nối với cố vấn.');
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (advisorId) => {
    setMyBookings(prev => [...prev, { advisorId, status: 0 }]);
  };

  const getBookingStatus = (advisorId) => {
    const booking = myBookings.find(b => b.advisorId === advisorId);
    return booking ? booking.status : null;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !advisor) {
    return (
      <View style={styles.centered}>
        <Info size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Lỗi</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtnLarge} onPress={() => router.back()}>
          <Text style={styles.backBtnTextLarge}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const expertises = advisor.expertise ? advisor.expertise.split(',').map(s => s.trim()) : [];
  const status = getBookingStatus(advisor.advisorId);
  const initial = (advisor.userName || 'A').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ Sơ Cố Vấn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: advisor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(advisor.userName)}&background=random` }} 
              style={styles.avatar} 
            />
            {advisor.approvalStatus === 'Approved' && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{advisor.userName}</Text>
          <Text style={styles.handle}>@{advisor.userName?.toLowerCase().replace(/\s/g, '')}</Text>
          
          <View style={styles.expertiseTags}>
            {expertises.map((exp, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{exp}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{advisor.rating || 0}</Text>
            <View style={styles.statLabelRow}>
              <Star size={12} color={THEME.colors.warning} fill={THEME.colors.warning} />
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{DISPLAY(advisor.hourlyRate?.toLocaleString('vi-VN'))}</Text>
            <View style={styles.statLabelRow}>
              <DollarSign size={12} color={THEME.colors.secondaryText} />
              <Text style={styles.statLabel}>đ/giờ</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.bioText}>{advisor.bio || 'Chưa có thông tin giới thiệu.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>
          <View style={styles.infoRow}>
            <MapPin size={18} color={THEME.colors.secondaryText} />
            <Text style={styles.infoText}>{advisor.location || 'Nghề nghiệp tự do'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Briefcase size={18} color={THEME.colors.secondaryText} />
            <Text style={styles.infoText}>Cố vấn khởi nghiệp</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.mainConnectBtn,
            (status === 0 || status === 'Pending') && styles.pendingBtn,
            (status === 1 || status === 'Confirmed' || status === 'Accepted') && styles.confirmedBtn
          ]}
          onPress={handleConnect}
          disabled={status !== null}
        >
          <Text style={styles.mainConnectText}>
            {status === 0 || status === 'Pending' ? 'Yêu cầu đang chờ duyệt' : 
             status === 1 || status === 'Confirmed' || status === 'Accepted' ? 'Đã kết nối' : 'Kết nối ngay'}
          </Text>
        </TouchableOpacity>
      </View>

      {showBookingModal && (
        <AdvisorBookingModal
          isVisible={showBookingModal}
          advisor={advisor}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  backBtn: { padding: 4 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  handle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  expertiseTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  tag: { backgroundColor: 'rgba(29, 155, 240, 0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, margin: 4 },
  tagText: { fontSize: 13, color: THEME.colors.primary, fontWeight: '600' },
  statsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#64748B', marginLeft: 4 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  bioText: { fontSize: 15, color: '#475569', lineHeight: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { marginLeft: 12, fontSize: 15, color: '#475569' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mainConnectBtn: {
    height: 52,
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainConnectText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pendingBtn: { backgroundColor: '#64748B' },
  confirmedBtn: { backgroundColor: '#10B981' },
});
