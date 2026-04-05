import { apiClient } from './apiClient';

/**
 * Follower Service - Handles project following/interest interactions
 */
const followerService = {
  /**
   * Follow a project (show interest)
   * POST /api/projects/{projectId}/follow
   */
  followProject: async (projectId) => {
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/follow`);
      return response;
    } catch (error) {
      console.error('Failed to follow project:', error);
      throw error;
    }
  },

  /**
   * Unfollow a project
   * DELETE /api/projects/{projectId}/follow
   */
  unfollowProject: async (projectId) => {
    try {
      const response = await apiClient.delete(`/api/projects/${projectId}/follow`);
      return response;
    } catch (error) {
      console.error('Failed to unfollow project:', error);
      throw error;
    }
  },

  /**
   * Get all projects followed by current investor
   * GET /api/projects/my-followed
   */
  getMyFollowing: async () => {
    try {
      const response = await apiClient.get('/api/projects/my-followed');
      return response;
    } catch (error) {
      console.error('Failed to get followed projects:', error);
      throw error;
    }
  },

  /**
   * Check if investor is following a project
   */
  checkFollowStatus: async (projectId) => {
    try {
      const response = await apiClient.get('/api/projects/my-followed');
      let followedProjects = [];
      
      if (response && response.data) {
        if (response.data.items && Array.isArray(response.data.items)) {
          followedProjects = response.data.items;
        } else if (Array.isArray(response.data)) {
          followedProjects = response.data;
        }
      } else if (Array.isArray(response)) {
        followedProjects = response;
      }
      
      const isFollowing = followedProjects.some(p => {
        const pid = p.projectId || p.id;
        return pid === projectId || pid == projectId;
      });
      
      return {
        success: true,
        data: { isFollowing: isFollowing }
      };
    } catch (error) {
      console.error('[followerService] Error checking follow status:', error);
      return { success: true, data: { isFollowing: false } };
    }
  }
};

export default followerService;
