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
import projectSubmissionService from '../../src/services/projectSubmissionService';
import startupProfileService from '../../src/services/startupProfileService';
import SkeletonCard from '../../src/components/feed/SkeletonCard';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { Clock, List, Star, Filter, Check, X, Sparkles, SlidersHorizontal, Plus, ArrowUp } from 'lucide-react-native';
import optionService from '../../src/services/optionService';

const { width, height } = Dimensions.get('window');
const PAGE_SIZE = 10;
const HEADER_HEIGHT = 110; // BASE HEIGHT without SafeArea inset

const SORT_OPTIONS = [
  { key: 'newest',      label: 'Mới nhất',      icon: Clock, sieve: '-CreatedAt' },
  { key: 'oldest',      label: 'Cũ nhất',        icon: List,  sieve: 'CreatedAt' },
  { key: 'recommended', label: 'Được đề xuất',   icon: Star,  sieve: '-ProjectId' },
];

// These will be fallback/initial values if dynamic fetch fails
const DEFAULT_STAGES = ['Idea', 'MVP', 'Growth'];
const DEFAULT_INDUSTRIES = ['Edtech', 'Fintech', 'Healthtech', 'Agritech', 'Ecommerce', 'SaaS', 'Khác'];

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
  const flatListRef = useRef(null);

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
  const headerTranslateY = 0; // KEEP FIXED AS REQUESTED

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
  const { isPremium: hasSub, startupProfile } = useSubscription();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopAnim = useRef(new Animated.Value(0)).current;
  
  const [dynamicStages, setDynamicStages] = useState([]);
  const [dynamicIndustries, setDynamicIndustries] = useState([]);

  const fetchProjects = async (params) => {
    try {
      const sortOption = SORT_OPTIONS.find(o => o.key === params.sort);
      let sorts = sortOption?.sieve || '-CreatedAt';
      let filters = 'Status==Approved';

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

      // Fetch both projects and startups to join data (Parity with Web)
      // This ensures we get the real organization name and logo
      const [projectsRes, startupsRes] = await Promise.all([
        api.get(`/api/Projects/non-premium?${queryParams.toString()}`),
        startupProfileService.getAllStartups({ pageSize: 150 })
      ]);

      const startupMap = {};
      const profiles = (startupsRes?.data?.items || startupsRes?.items || []);
      profiles.forEach(p => {
        const info = {
          name: p.organizationName || p.companyName || p.startupName,
          logo: p.logoUrl || p.logo
        };
        const sid = p.startupId || p.id || p.userId;
        if (sid) startupMap[sid] = info;
      });

      const data = projectsRes.data || projectsRes;
      const items = data.items || [];
      
      const mappedItems = items.map(p => {
        const sid = p.startupId || p.userId;
        const info = startupMap[sid];

        return {
          ...p,
          id: p.projectId,
          startupName: info?.name || p.startupCompanyName || p.startupName || p.organizationName || p.companyName || 'Startup',
          logo: info?.logo || p.startupLogoUrl || p.logoUrl,
          name: p.projectName,
          description: p.shortDescription || 'Chưa có mô tả.',
          stage: p.developmentStage ?? 'Idea',
          industry: p.industry ?? 'Khác',
          aiScore: p.startupPotentialScore ?? null,
          imageUrl: p.projectImageUrl,
          interestedCount: p.followerCount || 0,
          createdAt: p.createdAt,
          targetCustomers: p.targetCustomers,
          uniqueValueProposition: p.uniqueValueProposition,
          businessModel: p.businessModel,
        };
      });

      return {
        data: mappedItems,
        total: data.totalCount ?? (items.length === PAGE_SIZE ? (params.page * PAGE_SIZE) + 1 : items.length),
        hasMore: items.length === PAGE_SIZE,
      };
    } catch (error) {
      console.error('fetchProjects error:', error);
      throw error;
    }
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
      if (Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      }
      
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
    const initData = async () => {
      fetchInitial(activeSort);
      try {
        const [stages, industries] = await Promise.all([
          optionService.getStages(),
          optionService.getIndustries()
        ]);
        if (stages.length > 0) setDynamicStages(stages.map(s => s.label));
        if (industries.length > 0) setDynamicIndustries(industries.map(i => i.label));
      } catch (err) {
        setDynamicStages(DEFAULT_STAGES);
        setDynamicIndustries(DEFAULT_INDUSTRIES);
      }
    };
    initData();
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
    <StartupCard
      startup={item}
      user={user}
      onViewProject={onViewProject}
      followedProjectIds={followedProjectIdsSet}
      isPremium={hasSub}
      startupProfileId={startupProfile?.id}
    />
  ), [user, onViewProject, followedProjectIdsSet, hasSub, startupProfile?.id]);

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
            <Text allowFontScaling={false} style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>
              Khám phá dự án
            </Text>
            <Text allowFontScaling={false} style={{ fontSize: 13, color: colors.secondaryText, marginTop: 2 }}>
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
                    <Text allowFontScaling={false} style={{
                      fontSize: 13,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? colors.primary : colors.secondaryText,
                    }}>
                      {option.label}
                    </Text>
                    {isActive && totalCount > 0 && (
                      <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 6 }}>
                        <Text allowFontScaling={false} style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
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
                    <Text allowFontScaling={false} style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <AnimatedFlatList
          ref={flatListRef}
          data={projects}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: true,
              listener: (event) => {
                const y = event.nativeEvent.contentOffset.y;
                if (y > 400 && !showScrollTop) {
                  setShowScrollTop(true);
                  Animated.spring(scrollTopAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
                } else if (y <= 400 && showScrollTop) {
                  setShowScrollTop(false);
                  Animated.timing(scrollTopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                }
              }
            }
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
          contentContainerStyle={{ paddingTop: ACTUAL_HEADER_HEIGHT + 42, paddingBottom: 100, paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (!hasMore && projects.length > 0) ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <View style={{ height: 1, width: 40, backgroundColor: colors.border, marginBottom: 12 }} />
                <Text allowFontScaling={false} style={{ textAlign: 'center', color: colors.secondaryText, fontSize: 12 }}>
                  Đã hiển thị tất cả {projects.length} dự án
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 }}>
                <Sparkles size={48} color={colors.primary} style={{ marginBottom: 16, opacity: 0.3 }} />
                <Text allowFontScaling={false} style={{ color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Không tìm thấy dự án nào</Text>
                <Text allowFontScaling={false} style={{ color: colors.secondaryText, fontSize: 13, marginTop: 8, textAlign: 'center' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
              </View>
            ) : (
              <View style={{ paddingTop: 20 }}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                    <SkeletonCard />
                  </View>
                ))}
              </View>
            )
          }
        />

        {/* SCROLL TO TOP BUTTON */}
        <Animated.View style={{
          position: 'absolute',
          top: ACTUAL_HEADER_HEIGHT + 20,
          alignSelf: 'center',
          zIndex: 999,
          opacity: scrollTopAnim,
          transform: [{
            translateY: scrollTopAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0]
            })
          }]
        }}>
          <TouchableOpacity
            onPress={() => {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 8,
              elevation: 5,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <ArrowUp size={16} color="#fff" strokeWidth={3} />
            <Text allowFontScaling={false} style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Lên đầu trang</Text>
          </TouchableOpacity>
        </Animated.View>

        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.centeredView, { backgroundColor: colors.mutedBackground || '#111', borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text allowFontScaling={false} style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Bộ lọc</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} hitSlop={10}>
                  <X size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.6 }}>
                <Text allowFontScaling={false} style={styles.filterGroupLabel(colors)}>Giai đoạn</Text>
                <View style={styles.chipContainer}>
                  {(dynamicStages.length > 0 ? dynamicStages : DEFAULT_STAGES).map((stage) => {
                    const isActive = activeFilters.stage.includes(stage);
                    return (
                      <TouchableOpacity
                        key={stage}
                        onPress={() => toggleFilter('stage', stage)}
                        style={[styles.chip(colors), isActive && styles.chipActive(colors)]}
                      >
                        {isActive && <Check size={14} color="#fff" style={{ marginRight: 6 }} />}
                        <Text allowFontScaling={false} style={[styles.chipText(colors), isActive && styles.chipTextActive(colors)]}>{stage}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text allowFontScaling={false} style={styles.filterGroupLabel(colors)}>Ngành</Text>
                <View style={styles.chipContainer}>
                  {(dynamicIndustries.length > 0 ? dynamicIndustries : DEFAULT_INDUSTRIES).map((ind) => {
                    const isActive = activeFilters.industry.includes(ind);
                    return (
                      <TouchableOpacity
                        key={ind}
                        onPress={() => toggleFilter('industry', ind)}
                        style={[styles.chip(colors), isActive && styles.chipActive(colors)]}
                      >
                        {isActive && <Check size={14} color="#fff" style={{ marginRight: 6 }} />}
                        <Text allowFontScaling={false} style={[styles.chipText(colors), isActive && styles.chipTextActive(colors)]}>{ind}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={clearFilters} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
                  <Text allowFontScaling={false} style={{ color: colors.secondaryText, fontSize: 14, fontWeight: '600' }}>Xoá tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyFilters} style={styles.applyBtn(colors)}>
                  <Text allowFontScaling={false} style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* FLOATING ACTION BUTTON (Bottom Right) */}
        {user && (user.role === 0 || (typeof user.role === 'string' && user.role.toLowerCase() === 'startup')) && !isLoading && (
          <TouchableOpacity
            style={[
              styles.floatingUploadBtn(colors),
              { bottom: insets.bottom + 15 } // Lowered even more as requested (was 70)
            ]}
            onPress={() => router.push('/startup/create')}
            activeOpacity={0.8}
          >
            <View style={styles.floatingIconCircle(colors)}>
              <Plus size={32} color="#fff" strokeWidth={3} />
            </View>
          </TouchableOpacity>
        )}
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
  floatingUploadBtn: (colors) => ({
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 1001,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  }),
  floatingIconCircle: (colors) => ({
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  }),
};
