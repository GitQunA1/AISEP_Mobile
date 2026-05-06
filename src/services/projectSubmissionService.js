import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Project Submission Service
 * Handles project creation, document upload, and AI evaluation interactions.
 */
export const projectSubmissionService = {
  /**
   * Helper to build Multipart FormData from project data (Aligned with Web)
   */
  buildMultipartFormData: (projectData) => {
    const formData = new FormData();

    // Mapping between frontend local keys and Backend API expected keys (PascalCase)
    const fieldMapping = {
      projectName: 'ProjectName',
      shortDescription: 'ShortDescription',
      developmentStage: 'StageOptionId',
      industry: 'IndustryOptionId',
      problemStatement: 'ProblemStatement',
      solutionDescription: 'SolutionDescription',
      targetCustomers: 'TargetCustomers',
      uniqueValueProposition: 'UniqueValueProposition',
      businessModel: 'BusinessModel',
      competitors: 'Competitors',
      vision: 'Vision',
      mission: 'Mission',
      coreValues: 'CoreValues',
      roadmapText: 'RoadmapText',
      fundingStatus: 'FundingStatus',
      website: 'Website',
      facebook: 'Facebook',
      linkedin: 'Linkedin',
      videoUrl: 'VideoUrl',
      projectImageFile: 'ProjectImageFile',
    };

    Object.keys(fieldMapping).forEach(localKey => {
      const apiKey = fieldMapping[localKey];
      const value = projectData[localKey];

      if (value !== null && value !== undefined && value !== '') {
        // Special handling for image file in React Native
        if (localKey === 'projectImageFile' && value.uri) {
          formData.append(apiKey, value);
        } else if (typeof value === 'boolean') {
          formData.append(apiKey, value ? 'true' : 'false');
        } else {
          formData.append(apiKey, String(value));
        }
      }
    });

    // Scorecard flattened fields (Backend expects them at root level)
    const sc = projectData.projectScorecard || projectData.ProjectScorecard;
    if (sc && typeof sc === 'object') {
      const get = (c, p) => sc[c] !== undefined ? sc[c] : sc[p];
      const scorecardFields = [
        ['TeamSize', get('teamSize', 'TeamSize')],
        ['TeamExperience', get('teamExperience', 'TeamExperience')],
        ['HasTechnicalCofounder', get('hasTechnicalCofounder', 'HasTechnicalCofounder')],
        ['TargetMarketSize', get('targetMarketSize', 'TargetMarketSize')],
        ['MarketGrowth', get('marketGrowth', 'MarketGrowth')],
        ['ProductReadiness', get('productReadiness', 'ProductReadiness')],
        ['IPProtection', get('ipProtection', 'IpProtection') || get('iPProtection', 'iPProtection')],
        ['BarrierToEntry', get('barrierToEntry', 'BarrierToEntry')],
        ['CurrentTraction', get('currentTraction', 'CurrentTraction')],
        ['RunwayMonths', get('runwayMonths', 'RunwayMonths')],
      ];

      scorecardFields.forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          if (typeof v === 'boolean') {
            formData.append(k, v ? 'true' : 'false');
          } else {
            formData.append(k, String(v));
          }
        }
      });
    }

    return formData;
  },

  multipartFetch: async (endpoint, method, formData) => {
    try {
      const token = await AsyncStorage.getItem('aisep_token');
      const response = await fetch(`https://api.aisep.tech${endpoint}`, {
        method: method,
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result.data || result,
          message: result.message || 'Thành công'
        };
      } else {
        const error = {
          message: result.message || `Lỗi server: ${response.status}`,
          statusCode: response.status,
          errors: result.errors || []
        };
        throw error;
      }
    } catch (error) {
      console.error(`[projectSubmissionService] ${method} ${endpoint} error:`, error);
      throw error;
    }
  },

  submitStartupInfo: async (projectData) => {
    const formData = projectSubmissionService.buildMultipartFormData(projectData);
    return await projectSubmissionService.multipartFetch('/api/Projects', 'POST', formData);
  },

  createProject: async (projectData) => {
    const formData = projectSubmissionService.buildMultipartFormData(projectData);
    return await projectSubmissionService.multipartFetch('/api/Projects', 'POST', formData);
  },

  updateProject: async (id, projectData) => {
    const formData = projectSubmissionService.buildMultipartFormData(projectData);
    return await projectSubmissionService.multipartFetch(`/api/Projects/${id}`, 'PUT', formData);
  },

  getDocuments: async (projectId) => {
    return await apiClient.get(`/api/projects/${projectId}/documents`);
  },

  uploadDocument: async (projectId, file, documentType = 'PitchDeck') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    return await projectSubmissionService.multipartFetch(`/api/projects/${projectId}/documents`, 'POST', formData);
  },

  getDueDiligenceTemplate: async () => {
    return await apiClient.get('/api/admin/due-diligence-template');
  },

  getDueDiligenceTemplates: async () => {
    return await apiClient.get('/api/admin/due-diligence-template');
  },

  triggerAIAnalysis: async (projectId) => {
    return await apiClient.post(`/api/StartupAIAnalysis/${projectId}/analyze`);
  },

  getAIAnalysisResults: async (projectId) => {
    const response = await apiClient.get(`/api/StartupAIAnalysis/${projectId}`);
    return response;
  },

  getMyProjects: async () => {
    try {
      const response = await apiClient.get('/api/Projects/my?sorts=-ProjectId&pageSize=100');
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

  getProjectById: async (projectId) => {
    const response = await apiClient.get(`/api/Projects/${projectId}`);
    return response;
  },

  getProjectNonPremiumById: async (projectId) => {
    const response = await apiClient.get(`/api/Projects/non-premium/${projectId}`);
    return response;
  },

  getAssignedAdvisors: async (projectId) => {
    const response = await apiClient.get(`/api/project-advisor-assignments/project/${projectId}`);
    return response;
  },

  getAllProjects: async () => {
    const response = await apiClient.get('/api/Projects/non-premium?pageSize=100');
    return response;
  },

  submitProject: async (projectId) => {
    const response = await apiClient.patch(`/api/Projects/${projectId}/submit`);
    return response;
  },

  verifyDocument: async (documentId) => {
    const response = await apiClient.get(`/api/documents/${documentId}/verify`);
    return response;
  },

  deleteDocument: async (documentId) => {
      return await apiClient.delete(`/api/documents/${documentId}`);
  }
};

export default projectSubmissionService;

