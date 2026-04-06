import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/apiClient';
import StartupCard from '../../src/components/feed/StartupCard';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import { Clock, List, Star, Filter, Check, X, Sparkles, SlidersHorizontal } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const PAGE_SIZE = 10;
const HEADER_HEIGHT = 110; // BASE HEIGHT without SafeArea inset

const SORT_OPTIONS = [
  { key: 'newest',      label: 'Mới nhất',      icon: Clock, sieve: '-CreatedAt' },
  { key: 'oldest',      label: 'Cũ nhất',        icon: List,  sieve: 'CreatedAt' },
  { key: 'recommended', label: 'Được đề xuất',   icon: Star,  sieve: '-ProjectId' },
];

const STAGE_OPTIONS = ['Idea', 'MVP', 'Growth'];

const INDUSTRY_OPTIONS = [
  'Edtech',
  'Fintech',
  'Healthtech',
  'Agritech',
  'Ecommerce',
  'SaaS',
  'Khác',
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function DiscoveryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();
  const ACTUAL_HEADER_HEIGHT = HEADER_HEIGHT;

  // Animation & Scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // CLAMP SCROLL: This is critical for iOS Pull-To-Refresh. 
  // It forces the animation to ignore negative scroll values during bouncing/refreshing.
  // We use interpolation to ensure the value passed to diffClamp never goes below 0.
  const scrollYClamped = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolateLeft: 'clamp',
  });
  
  // Tie diffClamp to the clamped scroll value
  const clampedScroll = Animated.diffClamp(scrollYClamped, 0, ACTUAL_HEADER_HEIGHT);

  // Interpolate the clamped scroll to move the header
  const headerTranslateY = clampedScroll.interpolate({
    inputRange: [0, ACTUAL_HEADER_HEIGHT],
    outputRange: [0, -ACTUAL_HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  // State
  const [projects, setProjects]           = useState([]);
  const [page, setPage]                   = useState(1);
  const [totalCount, setTotalCount]       = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [activeSort, setActiveSort]       = useState('newest');
  const [activeFilters, setActiveFilters] = useState({ stage: [], industry: [] });
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const fetchProjects = async (params) => {
    const sortOption = SORT_OPTIONS.find(o => o.key === params.sort);
    
    let sorts = sortOption?.sieve || '-CreatedAt';
    let filters = '';

    if (params.stage && params.stage.length > 0) {
      const stageFilters = params.stage.map(s => `DevelopmentStage==${s}`).join('||');
      filters += (filters ? ',' : '') + `(${stageFilters})`;
    }
    if (params.industry && params.industry.length > 0) {
       const industryFilters = params.industry.map(i => `Industry==${i}`).join('||');
       filters += (filters ? ',' : '') + `(${industryFilters})`;
    }

    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      pageSize: params.limit.toString(),
      sorts: sorts,
    });
    if (filters) queryParams.append('filters', filters);

    const res = await api.get(`/api/Projects/non-premium?${queryParams.toString()}`);
    
    const data = res.data || res;
    const items = data.items || [];
    
    const mappedItems = items.map(p => ({
      ...p,
      id: p.projectId,
      startupName: p.startupName || p.organizationName || p.companyName || p.startup?.companyName || 'Startup',
      name: p.projectName,
      description: p.shortDescription || 'Chưa có mô tả.',
      stage: p.developmentStage != null ? STAGE_OPTIONS[p.developmentStage] || p.developmentStage : 'Idea',
      industry: p.industry != null ? (typeof p.industry === 'number' ? INDUSTRY_OPTIONS[p.industry] : p.industry) : 'Khác',
      aiScore: p.startupPotentialScore ?? null, // FIXED MAPPING: preserve null for __ placeholder
      imageUrl: p.projectImageUrl,
      interestedCount: p.followerCount || 0,
      createdAt: p.createdAt,
      targetCustomers: p.targetCustomers,
      uniqueValueProposition: p.uniqueValueProposition,
      businessModel: p.businessModel,
    }));

    return {
      data: mappedItems,
      total: data.totalCount ?? (items.length === PAGE_SIZE ? (params.page * PAGE_SIZE) + 1 : items.length),
      hasMore: items.length === PAGE_SIZE,
    };
  };

  const fetchInitial = useCallback(async (sortKey, filters = activeFilters, isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
      setProjects([]); // CLEAR CURRENT DATA IMMEDIATELY FOR LOADING FEEDBACK
    }

    try {
      const result = await fetchProjects({
        page: 1,
        limit: PAGE_SIZE,
        sort: sortKey,
        stage: filters.stage,
        industry: filters.industry,
      });

      // SMOOTH TRANSITION FROM LOADING TO CONTENT
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      setProjects(result.data);
      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setPage(1);
    } catch (e) {
      console.error('fetchInitial error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading || isRefreshing) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchProjects({
        page: nextPage,
        limit: PAGE_SIZE,
        sort: activeSort,
        stage: activeFilters.stage,
        industry: activeFilters.industry,
      });

      if (result.data.length > 0) {
        setProjects(prev => [...prev, ...result.data]);
        setTotalCount(result.total);
        setHasMore(result.hasMore);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('loadMore error:', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, activeSort, activeFilters, isLoading, isRefreshing]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchInitial(activeSort, activeFilters, true);
    setIsRefreshing(false);
  }, [activeSort, activeFilters, fetchInitial]);

  useEffect(() => {
    fetchInitial(activeSort);
  }, []);

  const handleSortChange = (key) => {
    setActiveSort(key);
    fetchInitial(key);
  };

  const followedProjectIdsSet = React.useMemo(() => 
    new Set(user?.followedProjectIds || []), 
    [user?.followedProjectIds]
  );

  const onViewProject = useCallback((projectId) => {
    router.push(`/startup/${projectId}`);
  }, [router]);

  const renderItem = useCallback(({ item }) => (
    <View style={{ paddingHorizontal: 16 }}>
       <StartupCard
        startup={item}
        user={user}
        onViewProject={onViewProject}
        followedProjectIds={followedProjectIdsSet}
      />
    </View>
  ), [user, onViewProject, followedProjectIdsSet]);

  const toggleFilter = (type, value) => {
    setActiveFilters(prev => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      };
    });
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    fetchInitial(activeSort);
  };

  const clearFilters = () => {
    const cleared = { stage: [], industry: [] };
    setActiveFilters(cleared);
    setFilterModalVisible(false);
    fetchInitial(activeSort, cleared);
  };

  const activeFilterCount = activeFilters.stage.length + activeFilters.industry.length;

  return (
    <TabScreenWrapper>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        
        {/* ANIMATED HEADER */}
        {/* Top Plate: Covers the status bar area to prevent content from bleeding through when header is hidden */}

        <Animated.View style={[
          styles.animatedHeader, 
          { 
            backgroundColor: colors.background, 
            transform: [{ translateY: headerTranslateY }],
            zIndex: 1000, 
            paddingTop: 10,
            // Header effect condition
            elevation: isDark ? 4 : 0,
            shadowOpacity: isDark ? 0.2 : 0,
            borderBottomWidth: isDark ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          }
        ]}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>
              Khám phá dự án
            </Text>
            <Text style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
              Khám phá các dự án sáng tạo được hỗ trợ bởi AI
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              {SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = activeSort === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => handleSortChange(option.key)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 14,
                      borderBottomWidth: 2,
                      borderBottomColor: isActive ? colors.primary : 'transparent',
                      marginRight: 8,
                    }}
                  >
                    <Icon size={16} color={isActive ? colors.primary : colors.secondaryText} style={{ marginRight: 6 }} />
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? colors.primary : colors.secondaryText,
                    }}>
                      {option.label}
                    </Text>
                    {isActive && totalCount > 0 && (
                      <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 6 }}>
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                          {totalCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              style={{ 
                paddingHorizontal: 16,
                height: 48,
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: activeFilterCount > 0 ? colors.primary + '15' : colors.background,
                borderLeftWidth: 1,
                borderLeftColor: colors.border
              }}
            >
              <View>
                <SlidersHorizontal size={20} color={activeFilterCount > 0 ? colors.primary : colors.secondaryText} />
                {activeFilterCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -6, right: -10,
                    backgroundColor: colors.primary, borderRadius: 8,
                    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 3, borderWidth: 2, borderColor: colors.background
                  }}>
                    <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <AnimatedFlatList
          data={projects}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          onScrollEndDrag={() => {
            // Snapping logic: if the header is stuck halfway, snap it
            // This is harder with diffClamp + native driver, so we use a simple heuristic 
            // but the scrolling itself is already 100% smooth now
          }}
          onMomentumScrollEnd={() => {
            // Same as above
          }}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              progressViewOffset={ACTUAL_HEADER_HEIGHT + 20}
            />
          }
          contentContainerStyle={{ paddingTop: ACTUAL_HEADER_HEIGHT + 24, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (!hasMore && projects.length > 0) ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <View style={{ height: 1, width: 40, backgroundColor: colors.border, marginBottom: 12 }} />
                <Text style={{ textAlign: 'center', color: colors.secondaryText, fontSize: 12 }}>
                  Đã hiển thị tất cả {projects.length} dự án
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 }}>
                <Sparkles size={48} color={colors.primary} style={{ marginBottom: 16, opacity: 0.3 }} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Không tìm thấy dự án nào</Text>
                <Text style={{ color: colors.secondaryText, fontSize: 13, marginTop: 8, textAlign: 'center' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
              </View>
            ) : (
              <View style={{ paddingTop: 60 }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )
          }
        />

        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.centeredView, { backgroundColor: colors.mutedBackground || '#111', borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Bộ lọc</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} hitSlop={10}>
                  <X size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.6 }}>
                <Text style={styles.filterGroupLabel(colors)}>Giai đoạn</Text>
                <View style={styles.chipContainer}>
                  {STAGE_OPTIONS.map((stage) => {
                    const isActive = activeFilters.stage.includes(stage);
                    return (
                      <TouchableOpacity
                        key={stage}
                        onPress={() => toggleFilter('stage', stage)}
                        style={[styles.chip(colors), isActive && styles.chipActive(colors)]}
                      >
                        {isActive && <Check size={14} color="#fff" style={{ marginRight: 6 }} />}
                        <Text style={[styles.chipText(colors), isActive && styles.chipTextActive(colors)]}>{stage}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.filterGroupLabel(colors)}>Ngành</Text>
                <View style={styles.chipContainer}>
                  {INDUSTRY_OPTIONS.map((ind) => {
                    const isActive = activeFilters.industry.includes(ind);
                    return (
                      <TouchableOpacity
                        key={ind}
                        onPress={() => toggleFilter('industry', ind)}
                        style={[styles.chip(colors), isActive && styles.chipActive(colors)]}
                      >
                        {isActive && <Check size={14} color="#fff" style={{ marginRight: 6 }} />}
                        <Text style={[styles.chipText(colors), isActive && styles.chipTextActive(colors)]}>{ind}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={clearFilters} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: colors.secondaryText, fontSize: 14, fontWeight: '600' }}>Xoá tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyFilters} style={styles.applyBtn(colors)}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TabScreenWrapper>
  );
}

const styles = {
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centeredView: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  applyBtn: (colors) => ({
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  }),
  filterGroupLabel: (colors) => ({ 
    color: colors.secondaryText, 
    fontSize: 10, 
    marginBottom: 12, 
    fontWeight: '900', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5
  }),
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  chip: (colors) => ({ 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: colors.border,
    backgroundColor: colors.hover || 'rgba(255,255,255,0.05)'
  }),
  chipActive: (colors) => ({ 
    borderColor: colors.primary, 
    backgroundColor: colors.primary
  }),
  chipText: (colors) => ({ color: colors.secondaryText, fontSize: 13, fontWeight: '600' }),
  chipTextActive: (colors) => ({ color: '#fff', fontWeight: '800' }),
};
