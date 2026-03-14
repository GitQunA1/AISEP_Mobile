import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Calendar, 
  MapPin, 
  LogOut, 
  Settings, 
  ChevronRight, 
  User as UserIcon,
  Shield,
  Bell,
  HelpCircle,
  Share2,
  ExternalLink,
  Award
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import THEME from '../../src/constants/Theme';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import projectSubmissionService from '../../src/services/projectSubmissionService';
import bookingService from '../../src/services/bookingService';
import advisorService from '../../src/services/advisorService';
import investorService from '../../src/services/investorService';
import startupProfileService from '../../src/services/startupProfileService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;

  const [stats, setStats] = useState({
    connections: 0,
    projects: 0,
    rating: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const role = String(user.role).toLowerCase();
      
      let connectionCount = 0;
      let projectCount = 0;
      let ratingCount = 0;

      if (role === 'startup' || user.role === 0) {
        // Fetch projects
        const projectRes = await projectSubmissionService.getMyProjects();
        if (projectRes.success|| projectRes.isSuccess) {
           const projects = Array.isArray(projectRes.data) ? projectRes.data : (projectRes.data?.items || []);
           projectCount = projects.length;
        }
        // Fetch connections
        const bookingRes = await bookingService.getMyCustomerBookings(user.userId);
        connectionCount = (bookingRes?.items || bookingRes || []).length;
      } else if (role === 'advisor' || user.role === 2) {
        // Fetch advisor profile for rating
        const advisorProfile = await advisorService.getMyProfile();
        ratingCount = advisorProfile?.rating || 0;
        // Fetch connections
        if (advisorProfile?.advisorId) {
          const bookingRes = await bookingService.getBookingsByAdvisorId(advisorProfile.advisorId);
          connectionCount = (bookingRes?.items || bookingRes || []).length;
        }
      } else if (role === 'investor' || user.role === 1) {
        const investorProfile = await investorService.getMyProfile();
        // Investor specific stats could be portfolio or watchlist
        connectionCount = 0; // Placeholder for now
      }

      setStats({
        connections: connectionCount,
        projects: projectCount,
        rating: ratingCount
      });
    } catch (err) {
      console.error("Error fetching profile stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.guestContainer}>
          <View style={[styles.guestIconContainer, { backgroundColor: colors.secondaryBackground }]}>
            <UserIcon size={64} color={colors.secondaryText} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Trải nghiệm AISEP</Text>
          <Text style={[styles.guestSubtitle, { color: colors.secondaryText }]}>
            Tham gia cộng đồng startup lớn nhất Việt Nam để kết nối với các nhà đầu tư và cố vấn hàng đầu.
          </Text>
          <Button title="Đăng nhập ngay" onPress={() => router.push('/(auth)/login')} style={styles.authBtn} />
          <TouchableOpacity 
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[styles.registerText, { color: colors.primary }]}>Chưa có tài khoản? Đăng ký miễn phí</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handle = user.email ? `@${user.email.split('@')[0]}` : `@${user.name?.toLowerCase().replace(/\s+/g, '')}`;

  const renderMenuItem = (icon, title, subtitle, onPress, color = colors.text) => (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: colors.secondaryBackground }]}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.secondaryText }]}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.headerGradient, { backgroundColor: colors.primary }]}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop' }} 
            style={styles.coverImage}
            opacity={0.3}
          />
        </View>

        <View style={styles.profileInfoContainer}>
          <View style={[styles.avatarWrapper, { borderColor: colors.background }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{(user.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.badgeContainer}>
              <Award size={14} color="#fff" fill="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.nameSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
              <Shield size={18} color={colors.primary} fill={colors.primary + '20'} style={{marginLeft: 6}} />
            </View>
            <Text style={[styles.handle, { color: colors.secondaryText }]}>{handle}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {isLoadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.connections}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Kết nối</Text>
            </View>
            
            {(String(user.role).toLowerCase() === 'startup' || user.role === 0) && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {isLoadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.projects}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Dự án</Text>
                </View>
              </>
            )}

            {(String(user.role).toLowerCase() === 'advisor' || user.role === 2) && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {isLoadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.rating.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Đánh giá</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.mainContent}>
          <View style={styles.menuGroup}>
            <Text style={[styles.groupTitle, { color: colors.secondaryText }]}>CÀI ĐẶT ỨNG DỤNG</Text>
            {renderMenuItem(
              <Settings size={20} color={colors.primary} />, 
              "Giao diện", 
              "Chế độ sáng/tối và thông số hệ thống",
              () => router.push('/settings/appearance')
            )}
          </View>

          <View style={styles.menuGroup}>
            <Text style={[styles.groupTitle, { color: colors.secondaryText }]}>TÀI KHOẢN & BẢO MẬT</Text>
            {renderMenuItem(<UserIcon size={20} color={colors.primary} />, "Thông tin cá nhân", "Cập nhật hồ sơ và ảnh đại diện")}
            {renderMenuItem(<Shield size={20} color="#10b981" />, "Bảo mật", "Mật khẩu, xác thực 2 lớp")}
            {renderMenuItem(<Bell size={20} color="#f59e0b" />, "Thông báo", "Quản lý cảnh báo và tin nhắn")}
          </View>

          <View style={styles.menuGroup}>
            <Text style={[styles.groupTitle, { color: colors.secondaryText }]}>HỖ TRỢ & THÔNG TIN</Text>
            {renderMenuItem(<HelpCircle size={20} color="#8b5cf6" />, "Trung tâm trợ giúp", "Câu hỏi thường gặp và liên hệ")}
            {renderMenuItem(<Share2 size={20} color="#ec4899" />, "Chia sẻ ứng dụng", "Giới thiệu AISEP cho bạn bè")}
            {renderMenuItem(<ExternalLink size={20} color="#64748b" />, "Điều khoản & Chính sách", "Quyền riêng tư, bảo mật")}
          </View>

          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Đăng xuất khỏi hệ thống</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestIconContainer: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  guestSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  authBtn: { width: '100%', height: 52, borderRadius: 12 },
  registerLink: { marginTop: 20 },
  registerText: { fontSize: 15, fontWeight: '600' },

  headerGradient: { height: 160, position: 'relative', overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  
  profileInfoContainer: { paddingHorizontal: 20, marginTop: -50, alignItems: 'center' },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, borderWidth: 5, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  badgeContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#f59e0b', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  
  nameSection: { alignItems: 'center', marginTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '800' },
  handle: { fontSize: 15, marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  statDivider: { width: 1, height: 24, marginHorizontal: 10 },

  mainContent: { padding: 20, paddingBottom: 40 },
  menuGroup: { marginBottom: 24 },
  groupTitle: { fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  menuIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600' },
  menuSubtitle: { fontSize: 13, marginTop: 2 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, backgroundColor: '#fee2e2', marginTop: 8 },
  logoutText: { fontWeight: '700', marginLeft: 10, fontSize: 16 }
});
