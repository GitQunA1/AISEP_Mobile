import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info, Layout, CheckCircle, Smartphone } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import AppearanceSettings from '../../src/components/AppearanceSettings';
import Card from '../../src/components/Card';

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      {/* Custom Header */}
      <View style={[styles.headerActions, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Giao diện</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introHeader}>
          <Text style={[styles.title, { color: colors.text }]}>Tùy chỉnh giao diện</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Điều chỉnh ứng dụng theo phong cách của bạn để có trải nghiệm tốt nhất.
          </Text>
        </View>

        <Card style={styles.settingsCard}>
          <AppearanceSettings />
        </Card>

        {/* Live Preview Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>XEM TRƯỚC TRỰC TIẾP</Text>
        </View>

        <Card style={styles.previewCard}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeaderRow}>
              <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: colors.text }]}>Startup Discovery</Text>
                <Text style={[styles.previewHandle, { color: colors.secondaryText }]}>@aisep_official</Text>
              </View>
              <CheckCircle size={20} color={colors.primary} />
            </View>
            <Text style={[styles.previewText, { color: colors.text }]}>
              Ứng dụng sẽ thay đổi màu sắc ngay khi bạn chọn chế độ hiển thị bên trên.
            </Text>
            <View style={styles.previewBadges}>
              <View style={[styles.previewBadge, { backgroundColor: colors.secondaryBackground }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>#Tech</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: colors.secondaryBackground }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>#AI</Text>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.infoBox}>
          <Info size={16} color={colors.secondaryText} />
          <Text style={[styles.infoText, { color: colors.secondaryText }]}>
            Chế độ hệ thống sẽ tự động chuyển đổi dựa trên cài đặt thiết bị của bạn.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: 56,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  introHeader: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  
  settingsCard: { padding: 16, marginBottom: 24 },
  
  sectionHeader: { marginBottom: 12, paddingLeft: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  
  previewCard: { padding: 0, overflow: 'hidden' },
  previewContent: { padding: 16 },
  previewHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  previewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  previewInfo: { flex: 1, marginLeft: 12 },
  previewName: { fontSize: 16, fontWeight: '700' },
  previewHandle: { fontSize: 13, marginTop: 2 },
  previewText: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  previewBadges: { flexDirection: 'row', gap: 8 },
  previewBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  
  infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 4 },
  infoText: { flex: 1, marginLeft: 8, fontSize: 13, lineHeight: 18 },
});
