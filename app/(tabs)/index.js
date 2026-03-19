import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { Rocket, Plus } from 'lucide-react-native';
import projectSubmissionService from '../../src/services/projectSubmissionService';
import startupProfileService from '../../src/services/startupProfileService';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter, useNavigation } from 'expo-router';

import StartupCard from '../../src/components/feed/StartupCard';
import FeedHeader from '../../src/components/feed/FeedHeader';
import ProjectSubmissionForm from '../../src/components/startup/ProjectSubmissionForm';
import ProfileRequiredModal from '../../src/components/startup/ProfileRequiredModal';
import SuccessModal from '../../src/components/common/SuccessModal';
import SkeletonCard from '../../src/components/feed/SkeletonCard';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';

export default function DiscoveryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { user } = useAuth();

  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals state
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasStartupProfile, setHasStartupProfile] = useState(null);

  const isStartupRole = user?.role === 0 || user?.role?.toString().toLowerCase() === 'startup';

  // Profile check
  useEffect(() => {
    const checkProfile = async () => {
      const userRole = user?.role?.toString().toLowerCase();
      if (user && (userRole === 'startup' || userRole === '0') && user.userId) {
        try {
          const profile = await startupProfileService.getStartupProfileByUserId(user.userId);
          setHasStartupProfile(!!profile);
        } catch (err) {
          console.error("Failed to check profile", err);
        }
      } else {
        setHasStartupProfile(true);
      }
    };
    checkProfile();
  }, [user]);

  const fetchFeed = async () => {
    try {
      const res = await projectSubmissionService.getAllProjects();
      if (res.statusCode === 200 && res.data && res.data.items) {
        const publishedProjects = res.data.items
          .filter(p => p.status === 'Approved')
          .map(p => ({
            ...p,
            id: p.projectId,
            name: p.projectName,
            description: p.shortDescription || 'Chưa có mô tả chi tiết cho startup này.',
            stage: p.developmentStage || 'Giai đoạn sớm',
            industry: p.keySkills ? p.keySkills.split(',').map(s => s.trim()).filter(Boolean)[0] || 'Khác' : 'Khác',
            tags: p.keySkills ? p.keySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
            aiScore: p.score || 0,
            timestamp: p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('vi-VN') : 'Mới',
            logo: null
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

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const handleFilterChange = (filters) => {
    const filtered = allProjects.filter(project => {
      if (filters.industry && project.industry !== filters.industry) return false;
      if (filters.stage && project.stage !== filters.stage) return false;
      if (filters.minScore && (project.aiScore || 0) < filters.minScore) return false;
      return true;
    });
    setFilteredProjects(filtered);
  };

  const handleShowProjectForm = () => {
    const userRole = user?.role?.toString().toLowerCase();
    if ((userRole === 'startup' || userRole === '0') && !hasStartupProfile) {
      setShowProfileModal(true);
    } else {
      setShowProjectForm(true);
    }
  };

  return (
    <TabScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={isLoading ? [1, 2, 3] : filteredProjects}
          keyExtractor={(item, index) => isLoading ? index.toString() : item.id.toString()}
          contentContainerStyle={styles.feed}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <FeedHeader 
               user={user} 
               onFilterChange={handleFilterChange} 
               onShowProjectForm={handleShowProjectForm} 
            />
          }
          renderItem={({ item }) => (
            isLoading ? (
              <SkeletonCard />
            ) : (
              <StartupCard 
                startup={item} 
                user={user} 
                onViewProfile={(id) => router.push(`/startup/${id}`)}
              />
            )
          )}
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyState}>
                <Rocket size={48} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy dự án</Text>
                <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Hãy thử thay đổi tiêu chí tìm kiếm.</Text>
              </View>
            )
          }
        />

        <ProjectSubmissionForm 
          visible={showProjectForm} 
          onClose={() => setShowProjectForm(false)} 
          onSuccess={() => {
            setShowProjectForm(false);
            setShowSuccessModal(true);
            fetchFeed(); // Refresh the feed after generic creation!
          }} 
          user={user} 
        />

        <ProfileRequiredModal 
          visible={showProfileModal} 
          onDismiss={() => setShowProfileModal(false)}
          onRedirect={() => {
            setShowProfileModal(false);
            router.push('/profile'); 
          }} 
        />

        <SuccessModal 
          visible={showSuccessModal} 
          onClose={() => setShowSuccessModal(false)} 
          title="Tạo Dự Án Thành Công!" 
          message={<Text style={{lineHeight: 22, color: colors.secondaryText, textAlign: 'center'}}>Dự án của bạn đã được tạo thành công. Bạn có thể tải lên các tài liệu bổ sung và nộp dự án bất cứ lúc nào tại mục Quản lý dự án.</Text>} 
          primaryBtnText="Tuyệt vời" 
        />
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  feed: { 
    paddingHorizontal: 20,
    paddingBottom: 100, 
  },
  separator: {
    height: 12,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  headerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
});
