import apiClient from './apiClient';

/**
 * AIEvaluationService.js
 * AI-powered evaluation of startup projects for Mobile
 * Adapted from Web version for full feature parity
 */
class AIEvaluationService {
  /**
   * Call API to analyze project and get AI score
   * POST /api/StartupAIAnalysis/{projectId}/analyze
   */
  static async analyzeProjectAPI(projectId) {
    try {
      if (!projectId && projectId !== 0) {
        return { success: false, message: 'Invalid projectId' };
      }

      console.log('[AI ANALYSIS] API Call:', projectId);
      const result = await apiClient.post(`/api/StartupAIAnalysis/${projectId}/analyze`);
      
      return {
        success: true,
        data: result.data || result,
        message: result.message || 'Analysis complete'
      };
    } catch (error) {
      console.error('[AI ANALYSIS] Error:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Network error while analyzing project'
      };
    }
  }

  /**
   * Call API to evaluate project eligibility
   * POST /api/StartupAIAnalysis/{projectId}/eligibility-evaluate
   */
  static async evaluateEligibilityAPI(projectId) {
    try {
      if (!projectId && projectId !== 0) {
        return { success: false, message: 'Invalid projectId' };
      }

      console.log('[ELIGIBILITY] API Call:', projectId);
      const result = await apiClient.post(`/api/StartupAIAnalysis/${projectId}/eligibility-evaluate`);
      
      return {
        success: true,
        data: result.data || result,
        message: result.message || 'Evaluation complete'
      };
    } catch (error) {
      console.error('[ELIGIBILITY] Error:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Network error while evaluating eligibility'
      };
    }
  }

  /**
   * Get previous AI analysis results for a project
   * GET /api/StartupAIAnalysis/{projectId}
   */
  static async getProjectAnalysisHistory(projectId) {
    try {
      if (!projectId && projectId !== 0) {
        return { success: false, message: 'Invalid projectId' };
      }

      const result = await apiClient.get(`/api/StartupAIAnalysis/${projectId}`);
      
      const rawData = result.data || result;
      const normalizedData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      
      return {
        success: true,
        data: normalizedData,
        message: result.message || 'History fetched successfully'
      };
    } catch (error) {
      console.error('[AI HISTORY] Error:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Error fetching history'
      };
    }
  }

  /**
   * Investor-triggered AI analysis of a project
   * POST /api/InvestorAIAnalysis/{projectId}/analyze
   */
  static async analyzeProjectByInvestorAPI(projectId) {
    try {
      if (!projectId && projectId !== 0) {
        return { success: false, message: 'Invalid projectId' };
      }
      const result = await apiClient.post(`/api/InvestorAIAnalysis/${projectId}/analyze`);
      return {
        success: true,
        data: result.data || result,
        message: result.message || 'Analysis complete'
      };
    } catch (error) {
      console.error('[INVESTOR AI ANALYSIS] Error:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Error analyzing project'
      };
    }
  }

  /**
   * Get investor AI analysis history for a project
   * GET /api/InvestorAIAnalysis/{projectId}
   */
  static async getInvestorAnalysisHistory(projectId) {
    try {
      const result = await apiClient.get(`/api/InvestorAIAnalysis/${projectId}`);
      const rawData = result.data || result;
      return {
        success: true,
        data: Array.isArray(rawData) ? rawData : (rawData ? [rawData] : [])
      };
    } catch (error) {
      return { success: false, data: [] };
    }
  }

  /**
   * Helper: Convert score to category (ported from Web)
   */
  static getScoreCategory(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  }
}

export default AIEvaluationService;
