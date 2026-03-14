import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { Search, MapPin, Rocket, CheckCircle, Target, TrendingUp, Filter, Heart, MessageCircle, Share2, Bookmark, Lock, ChevronRight } from 'lucide-react-native';
import projectSubmissionService from '../../src/services/projectSubmissionService';
import { useTheme } from '../../src/context/ThemeContext';
import Card from '../../src/components/Card';
import { useRouter } from 'expo-router';

export default function DiscoveryScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndustry, setActiveIndustry] = useState('Tất cả');
  
  const industries = ['Tất cả', 'FinTech', 'AgriTech', 'EdTech', 'HealthTech', 'SaaS', 'AI/ML', 'GreenTech'];

  const fetchFeed = async () => {
    try {
      const res = await projectSubmissionService.getAllProjects();
      if (res.statusCode === 200 && res.data && res.data.items) {
        // Filter for published projects and map to UI model matching Web logic
        const publishedProjects = res.data.items
          .filter(p => p.status === 'Published')
          .map(p => ({
            ...p,
            id: p.projectId,
            name: p.projectName,
            description: p.shortDescription || 'Chưa có mô tả chi tiết cho startup này.',
            stage: p.developmentStage || 'Giai đoạn sớm',
            industry: p.keySkills
              ? p.keySkills.split(',').map(s => s.trim()).filter(Boolean)[0] || 'Khác'
              : 'Khác',
            tags: p.keySkills
              ? p.keySkills.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            aiScore: p.score || 0,
            timestamp: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('vi-VN') : 'Mới',
            logo: null // For now, projects in API don't have separate logos in this endpoint
          }));

        setAllProjects(publishedProjects);
        setFilteredProjects(publishedProjects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    // Apply local filters
    const filtered = allProjects.filter(project => {
      const matchesSearch = (project.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (project.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesIndustry = activeIndustry === 'Tất cả' || project.industry === activeIndustry;
      return matchesSearch && matchesIndustry;
    });
    setFilteredProjects(filtered);
  }, [searchQuery, activeIndustry, allProjects]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const renderProjectItem = ({ item }) => (
    <Card style={styles.projectCard}>
      <TouchableOpacity 
        style={styles.cardContentWrapper}
        onPress={() => router.push(`/startup/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* LEFT COLUMN: AVATAR */}
        <View style={styles.avatarColumn}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(item.name || 'S').charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>

        {/* RIGHT COLUMN: CONTENT */}
        <View style={styles.contentColumn}>
          {/* ROW 1: HEADLINE */}
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.badge, styles.scoreBadge, { backgroundColor: colors.primary + '15' }]}>
                <Target size={10} color={colors.primary} />
                <Text style={[styles.scoreText, { color: colors.primary }]}>AI: {item.aiScore || '...'}</Text>
              </View>
            </View>
            <Text style={styles.timeText}>{item.timestamp}</Text>
          </View>

          {/* Industry/Stage Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.industryBadge]}>
              <Text style={styles.industryText}>{item.industry}</Text>
            </View>
            <View style={[styles.badge, styles.stageBadge]}>
              <Text style={styles.stageText}>{item.stage}</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={3}>
            {item.description}
          </Text>

          {/* Premium Area Teaser */}
          <View style={[styles.premiumTease, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <Lock size={12} color={colors.secondaryText} />
            <Text style={[styles.premiumText, { color: colors.secondaryText }]}>Dữ liệu tài chính & Nhu cầu gọi vốn</Text>
            <ChevronRight size={14} color={colors.secondaryText} />
          </View>

          {/* ROW 4: ACTIONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Heart size={18} color={colors.secondaryText} />
              <Text style={[styles.actionCount, { color: colors.secondaryText }]}>24</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <MessageCircle size={18} color={colors.secondaryText} />
              <Text style={[styles.actionCount, { color: colors.secondaryText }]}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Share2 size={18} color={colors.secondaryText} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
              <Bookmark size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchSection, { backgroundColor: colors.background }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.secondaryBackground }]}>
          <Search size={20} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm theo tên dự án hoặc mô tả..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
      </View>

      <View style={[styles.filterSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={industries}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.pillsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: colors.secondaryBackground }, activeIndustry === item && { backgroundColor: colors.primary }]}
              onPress={() => setActiveIndustry(item)}
            >
              <Text style={[styles.pillText, { color: colors.secondaryText }, activeIndustry === item && { color: '#fff' }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredProjects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.feed}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Rocket size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy dự án</Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Hãy thử thay đổi tiêu chí tìm kiếm.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1E293B',
  },
  filterSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  pillsContainer: {
    paddingHorizontal: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feed: {
    padding: 16,
  },
  projectCard: {
    marginBottom: 16,
    padding: 0, // Reset for internal padding
    overflow: 'hidden',
  },
  cardContentWrapper: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarColumn: {
    marginRight: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  contentColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    maxWidth: '65%',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 155, 240, 0.08)',
  },
  scoreText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  industryBadge: {
    backgroundColor: '#F1F5F9',
  },
  industryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stageBadge: {
    backgroundColor: '#ECFDF5',
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  premiumTease: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  premiumText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 13,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});
