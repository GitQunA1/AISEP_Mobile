import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Heart, ChevronRight, Briefcase } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import followerService from '../../services/followerService';

export default function FollowedProjects({ onSelectProject, onRefreshDashboard }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [followedProjects, setFollowedProjects] = useState([]);

  const fetchFollowed = async () => {
    try {
      const response = await followerService.getMyFollowing();
      const items = response?.data?.items || response?.data || [];
      
      const formatted = items.map(p => ({
        id: p.projectId || p.id,
        projectId: p.projectId || p.id,
        name: p.projectName || 'Dự án',
        industry: p.industry || 'Chưa phân loại',
        imageUrl: p.projectImageUrl,
        followedAt: p.followedAt ? new Date(p.followedAt).toLocaleDateString('vi-VN') : 'Mới đây'
      }));
      
      setFollowedProjects(formatted);
    } catch (error) {
      console.error('[FollowedProjects] fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowed();
  }, []);

  const handleUnfollow = (projectId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn bỏ theo dõi dự án này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Bỏ theo dõi', 
          style: 'destructive',
          onPress: async () => {
            try {
              await followerService.unfollowProject(projectId);
              setFollowedProjects(prev => prev.filter(p => p.id !== projectId));
              if (onRefreshDashboard) onRefreshDashboard();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể bỏ theo dõi dự án này.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <FadeInView delay={index * 100}>
      <Card style={[styles.projectCard, { borderColor: colors.border }]} onPress={() => onSelectProject?.(item)}>
        <View style={styles.cardHeader}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.projectImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.mutedBackground }]}>
              <Briefcase size={24} color={colors.secondaryText} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.industryBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.industryText, { color: colors.primary }]}>{item.industry}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.heartBtn, { backgroundColor: colors.statusRejectedBg }]} 
            onPress={() => handleUnfollow(item.id)}
          >
            <Heart size={18} color={colors.statusRejectedText} fill={colors.statusRejectedText} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.cardFooter}>
          <Text style={[styles.followDate, { color: colors.secondaryText }]}>
            Quan tâm từ: {item.followedAt}
          </Text>
          <ChevronRight size={18} color={colors.border} />
        </View>
      </Card>
    </FadeInView>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={followedProjects}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl 
          refreshing={isRefreshing} 
          onRefresh={() => { setIsRefreshing(true); fetchFollowed(); }} 
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Heart size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Bạn chưa theo dõi dự án nào.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 20 },
  loadingContainer: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center' },
  projectCard: { padding: 16, marginBottom: 16, borderRadius: 24, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  projectImage: { width: 50, height: 50, borderRadius: 12 },
  imagePlaceholder: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 16 },
  projectName: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  industryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  industryText: { fontSize: 11, fontWeight: '800' },
  heartBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, width: '100%', marginBottom: 14, opacity: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followDate: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 16 },
  emptyText: { fontSize: 15, fontWeight: '700' }
});
