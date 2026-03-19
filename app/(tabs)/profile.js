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
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';

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
      <TabScreenWrapper>
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
      </TabScreenWrapper>
    );
  }

  const handle = user.email ? `@${user.email.split('@')[0]}` : `@${user.name?.toLowerCase().replace(/\s+/g, '')}`;

  const renderMenuItem = (icon, title, subtitle, onPress, color = colors.text, showBorder = true) => (
    <TouchableOpacity 
      style={[styles.menuItem, showBorder && { borderBottomColor: colors.border, borderBottomWidth: 1 }]} 
      onPress={onPress}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: colors.mutedBackground }]}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.secondaryText }]}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={colors.secondaryText} opacity={0.5} />
    </TouchableOpacity>
  );

  const getRoleLabel = (role) => {
    const r = String(role).toLowerCase();
    if (r === 'startup' || role === 0) return 'Startup';
    if (r === 'investor' || role === 1) return 'Nhà đầu tư';
    if (r === 'advisor' || role === 2) return 'Cố vấn';
    return 'Thành viên';
  };

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header Section */}
          <View style={[styles.headerSection, { backgroundColor: colors.card }]}>
            <View style={styles.headerBackground}>
              <View style={[styles.headerCircle, { backgroundColor: colors.primary + '10', top: -80, right: -40, opacity: 0.7 }]} />
              <View style={[styles.headerCircle, { backgroundColor: colors.primary + '05', bottom: -120, left: -60, width: 320, height: 320, borderRadius: 160, opacity: 0.6 }]} />
            </View>

            <View style={styles.profileHeaderContent}>
              <View style={[styles.avatarWrapper, { borderColor: colors.background }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{(user.name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={[styles.badgeContainer, { borderColor: colors.background }]}>
                  <Award size={14} color="#fff" fill="#fff" />
                </View>
              </View>

              <View style={styles.nameSection}>
                <View style={styles.titleRow}>
                  <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
                  <Shield size={18} color={colors.primary} fill={colors.primary + '20'} style={{marginLeft: 8}} />
                </View>
                <View style={styles.handleRow}>
                  <Text style={[styles.handle, { color: colors.secondaryText }]}>{handle}</Text>
                  <View style={[styles.roleLabel, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.roleText, { color: colors.primary }]}>{getRoleLabel(user.role)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Card style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {isLoadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.connections}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Kết nối</Text>
              </View>
              
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {isLoadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : stats.projects}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Dự án</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {isLoadingStats ? <ActivityIndicator size="small" color={colors.primary} /> : (stats.rating || 0).toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Đánh giá</Text>
              </View>
            </Card>
          </View>

          {/* Content Section */}
          <View style={styles.mainContent}>
            <Text style={[styles.sectionHeading, { color: colors.secondaryText }]}>ỨNG DỤNG</Text>
            <Card style={styles.menuCard}>
              {renderMenuItem(
                <Settings size={20} color={colors.primary} />, 
                "Giao diện & Cài đặt", 
                "Chế độ hiển thị và tùy sở thích",
                () => router.push('/settings/appearance'),
                colors.text,
                false
              )}
            </Card>

            <Text style={[styles.sectionHeading, { color: colors.secondaryText }]}>CÁ NHÂN</Text>
            <Card style={styles.menuCard}>
              {renderMenuItem(<UserIcon size={20} color={colors.primary} />, "Thông tin hồ sơ", "Cập nhật ảnh và thông tin cơ bản", () => {}, colors.text, true)}
              {renderMenuItem(<Shield size={20} color="#10b981" />, "Bảo mật tài khoản", "Mật khẩu và xác thực 2 lớp", () => {}, colors.text, true)}
              {renderMenuItem(<Bell size={20} color="#f59e0b" />, "Thông báo", "Quản lý cảnh báo tức thời", () => {}, colors.text, false)}
            </Card>

            <Text style={[styles.sectionHeading, { color: colors.secondaryText }]}>HỖ TRỢ</Text>
            <Card style={styles.menuCard}>
              {renderMenuItem(<HelpCircle size={20} color="#8b5cf6" />, "Trung tâm trợ giúp", "Câu hỏi thường gặp và HDSD", () => {}, colors.text, true)}
              {renderMenuItem(<Share2 size={20} color="#ec4899" />, "Chia sẻ ứng dụng", "Giới thiệu AISEP cho cộng đồng", () => {}, colors.text, false)}
            </Card>

            <Card style={[styles.logoutCard, { backgroundColor: colors.error + '08', borderColor: colors.error + '20' }]}>
              <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={handleLogout}
              >
                <LogOut size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Đăng xuất khỏi hệ thống</Text>
              </TouchableOpacity>
            </Card>

            <View style={styles.versionInfo}>
              <Text style={[styles.versionText, { color: colors.secondaryText }]}>AISEP for Mobile • Phiên bản 1.2.0</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </TabScreenWrapper>
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

  headerSection: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
  headerBackground: { ...StyleSheet.absoluteFillObject },
  headerCircle: { position: 'absolute', width: 250, height: 250, borderRadius: 125 },
  profileHeaderContent: { alignItems: 'center', zIndex: 1 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, borderWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 44, fontWeight: '900' },
  badgeContainer: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#f59e0b', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  
  nameSection: { alignItems: 'center', marginTop: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  handleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
  handle: { fontSize: 15, fontWeight: '600', opacity: 0.6 },
  roleLabel: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  statsCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, marginTop: 28, borderRadius: 28, width: '100%', borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 },
  statDivider: { width: 1, height: 30, opacity: 0.1 },

  mainContent: { paddingHorizontal: 20, paddingTop: 10 },
  sectionHeading: { fontSize: 11, fontWeight: '800', marginLeft: 16, marginBottom: 12, marginTop: 24, letterSpacing: 1.5, opacity: 0.8 },
  menuCard: { padding: 0, borderRadius: 28, overflow: 'hidden', borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.01)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuIconContainer: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  menuSubtitle: { fontSize: 13, marginTop: 3, opacity: 0.6 },

  logoutCard: { marginTop: 32, borderRadius: 24, padding: 0, overflow: 'hidden', borderWidth: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, gap: 12 },
  logoutText: { fontWeight: '800', fontSize: 16, letterSpacing: -0.3 },
  
  versionInfo: { alignItems: 'center', marginTop: 32, marginBottom: 20 },
  versionText: { fontSize: 12, fontWeight: '600', opacity: 0.4 }
});
