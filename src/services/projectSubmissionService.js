import apiClient from './apiClient';

/**
 * Project Submission Service
 * Handles project creation, document upload, and AI evaluation interactions.
 */
export const projectSubmissionService = {
  submitStartupInfo: async (projectData) => {
    const formData = new FormData();
    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        formData.append(key, projectData[key]);
      }
    });

    const response = await apiClient.post('/api/Projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  createProject: async (projectData) => {
    const formData = new FormData();
    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        formData.append(key, projectData[key]);
      }
    });

    const response = await apiClient.post('/api/Projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  updateProject: async (id, projectData) => {
    const formData = new FormData();
    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        formData.append(key, projectData[key]);
      }
    });

    const response = await apiClient.put(`/api/Projects/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  getDocuments: async (projectId) => {
    const response = await apiClient.get(`/api/projects/${projectId}/documents`);
    return response;
  },

  uploadDocument: async (projectId, file, documentType = 'PitchDeck') => {
    const formData = new FormData();
    // In React Native, file should be { uri, name, type }
    formData.append('file', file);
    
    const response = await apiClient.post(`/api/projects/${projectId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  triggerAIAnalysis: async (projectId) => {
    const response = await apiClient.post(`/api/StartupAIAnalysis/${projectId}/analyze`);
    return response;
  },

  getAIAnalysisResults: async (projectId) => {
    const response = await apiClient.get(`/api/StartupAIAnalysis/${projectId}`);
    return response;
  },

  getMyProjects: async () => {
    try {
      const response = await apiClient.get('/api/Projects/my');
      if (response && (response.success || response.isSuccess)) {
        return response;
      } else {
        throw new Error(response?.message || 'Failed to fetch projects.');
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        return { success: true, data: [] };
      }
      throw error;
    }
  },

  getAllProjects: async () => {
    const response = await apiClient.get('/api/Projects');
    return response;
  },

  submitProject: async (projectId) => {
    const response = await apiClient.patch(`/api/Projects/${projectId}/submit`);
    return response;
  },

  verifyDocument: async (documentId) => {
    const response = await apiClient.get(`/api/documents/${documentId}/verify`);
    return response;
  }
};

export default projectSubmissionService;
