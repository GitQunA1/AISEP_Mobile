import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, RefreshControl, Animated, 
  ActivityIndicator, Platform 
} from 'react-native';
import { Search, Plus, Users, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import advisorService from '../../src/services/advisorService';
import bookingService from '../../src/services/bookingService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import AdvisorCard from '../../src/components/advisor/AdvisorCard';
import AdvisorSkeletonCard from '../../src/components/advisor/AdvisorSkeletonCard';
import AdvisorBookingModal from '../../src/components/AdvisorBookingModal';

import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';

export default function AdvisorsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [advisors, setAdvisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  
  // Search Bar Animation
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  // Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAdvisorForBooking, setSelectedAdvisorForBooking] = useState(null);

  const roleValue = user?.role;
  const roleStr = typeof roleValue === 'string' ? roleValue.toLowerCase() : '';
  const isStartupRole = roleValue === 0 || roleStr === 'startup';

  const fetchData = async () => {
    try {
      const [advisorsRes, bookingsRes] = await Promise.all([
        advisorService.getAllAdvisors(),
        user?.userId ? bookingService.getMyCustomerBookings(user.userId) : Promise.resolve([])
      ]);

      const items = advisorsRes?.data?.items || advisorsRes?.items || [];
      setAdvisors(items);

      const bookingItems = bookingsRes?.items || bookingsRes?.data?.items || bookingsRes || [];
      if (Array.isArray(bookingItems)) setMyBookings(bookingItems);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleConnect = (advisor) => {
    if (!isStartupRole && roleValue !== 1 && roleStr !== 'investor') {
      alert('Chỉ Startup hoặc Investor mới có thể kết nối với cố vấn.');
      return;
    }
    setSelectedAdvisorForBooking(advisor);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (advisorId) => {
    setMyBookings(prev => [...prev, { advisorId, status: 0 }]);
  };

  const filteredAdvisors = advisors.filter(advisor =>
    (advisor.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (advisor.expertise?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getBookingStatus = (advisorId) => {
    const booking = myBookings.find(b => b.advisorId === advisorId);
    return booking ? booking.status : null;
  };

  // Search Border Animation
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

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Unified SEARCH BAR with Home's filter/input style */}
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
              placeholder="Tìm theo tên hoặc chuyên môn..."
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

        <FlatList
          data={isLoading ? [1, 2, 3] : filteredAdvisors}
          renderItem={({ item }) => isLoading ? (
            <AdvisorSkeletonCard />
          ) : (
            <AdvisorCard 
              advisor={item} 
              bookingStatus={getBookingStatus(item.advisorId)}
              onViewProfile={(id) => router.push(`/advisor/${id}`)}
              onConnect={handleConnect}
            />
          )}
          keyExtractor={(item, index) => isLoading ? index.toString() : item.advisorId.toString()}
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
                <Users size={48} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy cố vấn</Text>
                <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Hãy thử tìm kiếm từ khóa khác.</Text>
              </View>
            )
          }
        />

        {showBookingModal && (
          <AdvisorBookingModal
            isVisible={showBookingModal}
            advisor={selectedAdvisorForBooking}
            onClose={() => setShowBookingModal(false)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 10, // Match Home's container paddingTop
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8, // Match FeedHeader's paddingTop
    paddingBottom: 0,
    marginBottom: 6, // Match FeedHeader's marginBottom
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 20,
    paddingBottom: 10, // Match FeedHeader's subtitle marginBottom
    marginTop: 0, // Match FeedHeader's subtitle gap
    lineHeight: 18,
  },
  searchSection: { 
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchContainer: { 
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
