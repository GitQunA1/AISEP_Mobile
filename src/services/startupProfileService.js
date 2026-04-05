import apiClient from './apiClient';

const startupProfileService = {
  /**
   * Fetch the startup profile for a specific user ID
   */
  getStartupProfileByUserId: async (userId) => {
    try {
      const response = await apiClient.get('/api/Startups', {
        params: {
          filters: `userId==${userId}`,
          pageSize: 1
        }
      });

      const items = response?.data?.items || response?.items || [];
      if (items.length > 0) {
        const match = items.find(s => s.userId == userId || s.UserId == userId);
        return match || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching startup profile by userId:', error);
      return null;
    }
  },

  /**
   * Fetch a startup by its ID
   */
  getStartupById: async (id) => {
    try {
      const response = await apiClient.get(`/api/Startups/${id}`);
      return response?.data ?? null;
    } catch (error) {
      console.error(`Error fetching startup by id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Fetch all startups
   */
  getAllStartups: async (queryParams = {}) => {
    try {
      return await apiClient.get('/api/Startups', { params: queryParams });
    } catch (error) {
      console.error('Error fetching all startups:', error);
      throw error;
    }
  },

  /**
   * Create a new startup profile
   */
  createStartupProfile: async (startupData) => {
    try {
      const formData = new FormData();
      Object.keys(startupData).forEach(key => {
        if (startupData[key] !== null && startupData[key] !== undefined) {
          // For mobile, we handle file objects appropriately
          if (startupData[key].uri) {
            formData.append(key, {
              uri: startupData[key].uri,
              name: startupData[key].name || 'photo.jpg',
              type: startupData[key].type || 'image/jpeg',
            });
          } else {
            formData.append(key, startupData[key]);
          }
        }
      });

      const response = await apiClient.post('/api/Startups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      console.error('Error creating startup profile:', error);
      throw error;
    }
  },

  /**
   * Update an existing startup profile
   */
  updateStartupProfile: async (startupData) => {
    try {
      const { userId, LogoFile, BusinessLicenseFile, ...restData } = startupData;

      const formData = new FormData();

      Object.keys(restData).forEach(key => {
        if (restData[key] !== null && restData[key] !== undefined) {
          formData.append(key, restData[key]);
        }
      });

      if (LogoFile && LogoFile.uri) {
        formData.append('LogoFile', {
          uri: LogoFile.uri,
          name: LogoFile.name || 'logo.jpg',
          type: LogoFile.type || 'image/jpeg',
        });
      }
      if (BusinessLicenseFile && BusinessLicenseFile.uri) {
        formData.append('BusinessLicenseFile', {
          uri: BusinessLicenseFile.uri,
          name: BusinessLicenseFile.name || 'license.pdf',
          type: BusinessLicenseFile.type || 'application/pdf',
        });
      }

      const response = await apiClient.put(`/api/Startups/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      console.error('Error updating startup profile:', error);
      throw error;
    }
  }
};

export default startupProfileService;
