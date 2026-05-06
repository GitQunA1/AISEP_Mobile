import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, Animated,
  Platform
} from 'react-native';
import { Search, TrendingUp, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useScrollToTop, useFocusEffect } from '@react-navigation/native';

import investorService from '../../src/services/investorService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

import InvestorCard from '../../src/components/investor/InvestorCard';
import InvestorSkeletonCard from '../../src/components/investor/InvestorSkeletonCard';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';

export default function InvestorsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  useScrollToTop(listRef);

  useFocusEffect(
    React.useCallback(() => {
      if (listRef.current) {
        listRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }, [])
  );

  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  const fetchInvestors = async () => {
    try {
      // Use matching API for startups to show relevant investors, otherwise use general list
      const isStartup = user?.role === 0 || user?.role === 'Startup';
      const response = isStartup
        ? await investorService.getMatchingInvestors()
        : await investorService.getAllInvestors();

      if (response && response.items) {
        const formatted = response.items.map(inv => ({
          id: inv.investorId,
          name: inv.organizationName || inv.userName,
          userName: inv.userName,
          thesis: inv.investmentTaste || 'Chưa cập nhật khẩu vị đầu tư.',
          type: 'Nhà đầu tư',
          industries: Array.isArray(inv.industries) ? inv.industries : (inv.industries ? inv.industries.split(',').map(s => s.trim()) : []),
          stages: inv.preferredStage ? [inv.preferredStage] : (inv.preferredStageOptionId ? [`Giai đoạn ${inv.preferredStageOptionId}`] : ['Chưa xác định']),
          location: inv.investmentRegion || 'Chưa cập nhật',
          ticketSize: inv.investmentAmount ? `${inv.investmentAmount.toLocaleString()} VND` : 'N/A',
          avatar: inv.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.organizationName || inv.userName)}&background=random`,
          verified: inv.status === 'Approved'
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

  // Filter logic combining text and tags
  const filteredInvestors = investors.filter(inv => {
    const matchesSearch =
      (inv.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.thesis || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
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
    router.push(`/investor/${investor.id}`);
  };

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* COMPACT HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Tìm nhà đầu tư</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Khám phá và kết nối với mạng lưới nhà đầu tư toàn cầu
            </Text>
          </View>
        </View>

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
        </View>

        {/* FEED SECTION */}
        <FlatList
          ref={listRef}
          data={isLoading ? [1, 2, 3] : filteredInvestors}
          renderItem={({ item }) => isLoading ? (
            <InvestorSkeletonCard />
          ) : (
            <InvestorCard
              investor={item}
              user={user}
              onViewProfile={(id) => router.push(`/investor/${id}`)}
              onConnect={() => handleConnect(item)}
            />
          )}
          keyExtractor={(item, index) => isLoading ? index.toString() : item.id.toString()}
          contentContainerStyle={styles.list}
          bounces={true}
          overScrollMode="auto"
          scrollEventThrottle={16}
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
