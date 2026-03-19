import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, RefreshControl, Animated, 
  Platform 
} from 'react-native';
import { Search, Filter, TrendingUp, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import investorService from '../../src/services/investorService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

import InvestorCard from '../../src/components/investor/InvestorCard';
import InvestorSkeletonCard from '../../src/components/investor/InvestorSkeletonCard';
import InvestorFilterModal from '../../src/components/investor/InvestorFilterModal';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';

export default function InvestorsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Filters State Map
  const [filters, setFilters] = useState({
    industry: 'Tất cả ngành nghề',
    stage: 'Tất cả giai đoạn',
    fundingStatus: 'Tất cả trạng thái',
    minAiScore: 0
  });

  // Modal map
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  // Search Bar Animation
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

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

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Filter logic combining text and tags
  const filteredInvestors = investors.filter(inv => {
    // text search
    const matchesSearch = 
      (inv.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.thesis || '').toLowerCase().includes(searchQuery.toLowerCase());

    // industry filter
    const matchesIndustry = 
      filters.industry === 'Tất cả ngành nghề' ||
      inv.industries.includes(filters.industry);
    
    // stage filter
    const matchesStage = 
      filters.stage === 'Tất cả giai đoạn' ||
      inv.stages.includes(filters.stage);
    
    // Notice: fundingStatus mock checks omitted due to UI parity limits

    return matchesSearch && matchesIndustry && matchesStage;
  });

  // Search Border Animation Hook
  useEffect(() => {
    Animated.timing(searchBorderAnim, {
      toValue: isSearchFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSearchFocused]);

  const borderColor = searchBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  // Determine connected state logic
  const handleConnect = (investor) => {
    if (!user || user.role !== 'startup') {
      alert('Chỉ tài khoản Startup mới có thể gửi yêu cầu đến Nhà Đầu Tư.');
      return;
    }
    alert(`Yêu cầu kết nối đã được gửi tới ${investor.name}!`);
  };

  // Count active filter flags for the indicator
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.industry !== 'Tất cả ngành nghề') count++;
    if (filters.stage !== 'Tất cả giai đoạn') count++;
    if (filters.fundingStatus !== 'Tất cả trạng thái') count++;
    return count;
  };

  const selectedCount = getActiveFiltersCount();

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* SEARCH AND FILTER SECTION */}
        <View style={styles.searchSection}>
          <Animated.View style={[
            styles.searchContainer, 
            { 
              backgroundColor: colors.inputBackground, 
              borderColor: borderColor 
            }
          ]}>
            <Search size={16} color={colors.secondaryText} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Tìm kiếm nhà đầu tư..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
                <X size={16} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </Animated.View>

          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Filter size={18} color="#fff" />
            {selectedCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{selectedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* FEED SECTION */}
        <FlatList
          data={isLoading ? [1, 2, 3] : filteredInvestors}
          renderItem={({ item }) => isLoading ? (
            <InvestorSkeletonCard />
          ) : (
            <InvestorCard 
              investor={item} 
              onViewProfile={(id) => router.push(`/investor/${id}`)}
              onConnect={() => handleConnect(item)}
            />
          )}
          keyExtractor={(item, index) => isLoading ? index.toString() : item.id.toString()}
          contentContainerStyle={styles.list}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyState}>
                <TrendingUp size={48} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy nhà đầu tư</Text>
                <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Hiện không có nhà đầu tư nào phù hợp với bộ lọc.</Text>
              </View>
            )
          }
        />

        {/* BOTTOM SHEET MODAL */}
        <InvestorFilterModal 
          isVisible={isFilterModalVisible}
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalVisible(false)}
        />
        
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 0,
    lineHeight: 18,
  },
  searchSection: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchContainer: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: Platform.OS === 'ios' ? 11 : 4,
    borderWidth: 1.5,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14,
  },
  filterBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    marginLeft: 12,
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  list: { 
    paddingBottom: 100,
    paddingTop: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginTop: 16,
  },
  emptySubtitle: { 
    fontSize: 14, 
    marginTop: 8,
    textAlign: 'center',
  },
});
