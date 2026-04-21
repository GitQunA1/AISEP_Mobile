import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LayoutDashboard } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import StartupDashboard from '../../src/components/dashboard/StartupDashboard';
import InvestorDashboard from '../../src/components/dashboard/InvestorDashboard';
import AdvisorDashboard from '../../src/components/dashboard/AdvisorDashboard';

const ROLE_SUBTITLES = {
  startup: 'Theo dõi tiến độ và quản lý dự án của bạn',
  investor: 'Quản lý danh mục đầu tư và yêu cầu kết nối',
  advisor: 'Quản lý lịch tư vấn và hỗ trợ các startup',
};

export default function DashboardRouter() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = activeTheme.colors;

  if (authLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <TabScreenWrapper>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.guestContainer}>
            <View style={[styles.guestIconContainer, { backgroundColor: colors.secondaryBackground }]}>
              <LayoutDashboard size={64} color={colors.secondaryText} />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>Quản lý AISEP</Text>
            <Text style={[styles.guestSubtitle, { color: colors.secondaryText }]}>
              Đăng nhập để theo dõi tiến độ dự án, quản lý lịch tư vấn và kết nối với mạng lưới chuyên gia.
            </Text>
            <TouchableOpacity 
              style={[styles.authBtn, { backgroundColor: colors.primary }]} 
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.authBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
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

  const roleValue = user?.role;
  const roleStr = typeof roleValue === 'string' ? roleValue.toLowerCase() : (roleValue === 0 ? 'startup' : roleValue === 1 ? 'investor' : roleValue === 2 ? 'advisor' : '');
  const subtitle = ROLE_SUBTITLES[roleStr] || 'Theo dõi tiến trình và quản lý hồ sơ của bạn';

  const renderDashboard = () => {
    switch (roleStr) {
      case 'startup':
        return <StartupDashboard />;
      case 'investor':
        return <InvestorDashboard />;
      case 'advisor':
        return <AdvisorDashboard />;
      default:
        return <StartupDashboard />;
    }
  };

  return (
    <TabScreenWrapper>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Bảng điều khiển</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{subtitle}</Text>
          </View>
        </View>
        {renderDashboard()}
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: { 
    paddingHorizontal: 20, 
    paddingBottom: 4, 
    marginBottom: 8 
  },
  titleContainer: { 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800' 
  },
  subtitle: { 
    fontSize: 13, 
    fontWeight: '400', 
    marginTop: 2, 
    lineHeight: 18 
  },
  container: { flex: 1 },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestIconContainer: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  guestSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  authBtn: { width: '100%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  authBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { marginTop: 20 },
  registerText: { fontSize: 15, fontWeight: '600' },
});
