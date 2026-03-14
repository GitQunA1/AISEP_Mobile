import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Filter, CheckCircle, MapPin, Building2, TrendingUp, Target, User } from 'lucide-react-native';
import investorService from '../../src/services/investorService';
import { useTheme } from '../../src/context/ThemeContext';
import Card from '../../src/components/Card';

export default function InvestorsScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const [searchQuery, setSearchQuery] = useState('');
  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInvestors = async () => {
    try {
      const response = await investorService.getAllInvestors();
      if (response && response.items) {
        const formatted = response.items.map(inv => ({
          id: inv.investorId,
          name: inv.organizationName || inv.userName,
          userName: inv.userName,
          thesis: inv.investmentTaste || 'Chưa cập nhật khẩu vị đầu tư.',
          type: 'Quỹ đầu tư', 
          industries: inv.focusIndustry ? inv.focusIndustry.split(',').map(s => s.trim()) : [],
          stages: inv.preferredStage ? [inv.preferredStage] : ['Giai đoạn sớm'],
          location: inv.investmentRegion || 'Chưa cập nhật',
          ticketSize: inv.investmentAmount ? `${inv.investmentAmount.toLocaleString()} VND` : 'N/A',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.organizationName || inv.userName)}&background=random`,
          verified: true
        }));
        setInvestors(formatted);
      }
    } catch (error) {
      console.error("Failed to load investors:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchInvestors();
  };

  const filteredInvestors = investors.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.thesis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderInvestorCard = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            {item.verified && <CheckCircle size={16} color={colors.primary} style={{marginLeft: 4}} />}
          </View>
          <Text style={[styles.type, { color: colors.secondaryText }]}>{item.type}</Text>
        </View>
      </View>

      <Text style={[styles.thesis, { color: colors.text }]} numberOfLines={3}>{item.thesis}</Text>

      <View style={styles.tagContainer}>
        <View style={styles.tagRow}>
          <Target size={14} color="#64748B" />
          {item.industries.slice(0, 2).map((industry, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.tagText, { color: colors.secondaryText }]}>{industry}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tagRow}>
          <TrendingUp size={14} color="#64748B" />
          {item.stages.slice(0, 2).map((stage, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.tagText, { color: colors.secondaryText }]}>{stage}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <MapPin size={14} color={colors.secondaryText} />
          <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.location}</Text>
        </View>
        <Text style={[styles.ticketSize, { color: colors.primary }]}>{item.ticketSize}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.viewProfileBtn, { borderColor: colors.border }]}
          onPress={() => router.push(`/investor/${item.id}`)}
        >
          <User size={16} color={colors.text} />
          <Text style={[styles.viewProfileText, { color: colors.text }]}>Hồ sơ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.connectBtn, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Thông báo', 'Tính năng gửi yêu cầu kết nối đang được phát triển.')}
        >
          <TrendingUp size={16} color="#fff" />
          <Text style={styles.connectText}>Kết nối</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.secondaryBackground }]}>
          <Search size={20} color={colors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm nhà đầu tư..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.primary + '15' }]}>
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredInvestors}
          renderItem={renderInvestorCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={styles.emptyState}>
            <TrendingUp size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy nhà đầu tư</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Hãy thử tìm kiếm với từ khóa khác.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchSection: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filterBtn: { marginLeft: 12, width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0' },
  headerInfo: { marginLeft: 12, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  type: { fontSize: 13, marginTop: 2 },
  thesis: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  tagContainer: { marginBottom: 16 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F1F5F9', marginLeft: 8 },
  tagText: { fontSize: 12, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, marginLeft: 4 },
  ticketSize: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  viewProfileBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewProfileText: { fontSize: 14, fontWeight: '600' },
  connectBtn: { flex: 2, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  connectText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 }
});
