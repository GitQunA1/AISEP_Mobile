import apiClient from './apiClient';

/**
 * AIEvaluationService.js
 * AI-powered evaluation of startup projects for Mobile
 */
class AIEvaluationService {
  /**
   * Translate AI evaluation results to Vietnamese (Ported from Web)
   * Handles the new nested result structure.
   */
  /**
   * Normalize AI evaluation results (Ported from Web's normalizeAIAnalysisPayload)
   * Handles nested analysis, analysisJson strings, and various score field names.
   */
  static normalizeAIResults(analysisResult) {
    let analysisData = analysisResult?.data ?? analysisResult ?? {};

    // If it's a paginated response with items
    if (analysisData.items && Array.isArray(analysisData.items) && analysisData.items.length > 0) {
      analysisData = analysisData.items[0];
    }

    let nested =
      analysisData.analysis && typeof analysisData.analysis === 'object' && !Array.isArray(analysisData.analysis)
        ? { ...analysisData.analysis }
        : {};

    // Helper to parse analysisJson if it exists
    const parseAnalysisJson = (str) => {
      if (!str || typeof str !== 'string') return null;
      try {
        const j = JSON.parse(str);
        const auditedRaw = j.AuditedItems ?? j.auditedItems;
        const auditedItems = Array.isArray(auditedRaw)
          ? auditedRaw.map(item => ({
              criteria: item.Criteria ?? item.criteria,
              maxScore: item.MaxScore ?? item.maxScore,
              baseScore: item.BaseScore ?? item.baseScore,
              finding: item.Finding ?? item.finding,
              adjustment: item.Adjustment ?? item.adjustment,
              finalScore: item.FinalScore ?? item.finalScore,
            }))
          : [];

        return {
          totalBaseScore: j.TotalBaseScore ?? j.totalBaseScore,
          totalAIAdjustmentScore: j.TotalAIAdjustmentScore ?? j.totalAIAdjustmentScore,
          totalFinalScore: j.TotalFinalScore ?? j.totalFinalScore,
          auditedItems,
          strengths: j.Strengths ?? j.strengths,
          weaknesses: j.Weaknesses ?? j.weaknesses,
          advice: j.Advice ?? j.advice,
        };
      } catch (e) {
        return null;
      }
    };

    const fromJson = parseAnalysisJson(analysisData.analysisJson);
    if (fromJson) {
      if (!nested.auditedItems?.length && fromJson.auditedItems?.length) {
        nested.auditedItems = fromJson.auditedItems;
      }
      if (!nested.strengths && fromJson.strengths) nested.strengths = fromJson.strengths;
      if (!nested.weaknesses && fromJson.weaknesses) nested.weaknesses = fromJson.weaknesses;
      if (!nested.advice && fromJson.advice) nested.advice = fromJson.advice;
      nested.totalBaseScore = nested.totalBaseScore ?? fromJson.totalBaseScore;
      nested.totalFinalScore = nested.totalFinalScore ?? fromJson.totalFinalScore;
    }

    const finalScore = Number(
      analysisData.finalPotentialScore ??
      nested.totalFinalScore ??
      analysisData.potentialScore ??
      nested.potentialScore ??
      0
    );

    const auditedItems = Array.isArray(nested.auditedItems) ? nested.auditedItems.map(item => ({
      criteria: item.criteria ?? item.Criteria,
      score: item.finalScore ?? item.FinalScore ?? item.score ?? 0,
      reason: item.finding ?? item.Finding ?? item.reason,
      maxScore: item.maxScore ?? item.MaxScore,
      baseScore: item.baseScore ?? item.BaseScore,
      adjustment: item.adjustment ?? item.Adjustment
    })) : [];

    const strengths = analysisData.strengths ?? nested.strengths ?? [];
    const weaknesses = analysisData.weaknesses ?? nested.weaknesses ?? [];
    const recommendations = analysisData.recommendations ?? nested.recommendations ?? nested.advice ?? [];
    const summary = analysisData.summary ?? nested.summary ?? '';

    // Legacy detail entries (object mapping)
    const skipKeys = new Set(['auditedItems', 'strengths', 'weaknesses', 'advice', 'recommendations', 'totalBaseScore', 'totalFinalScore']);
    const legacyDetails = Object.entries(nested).filter(([key, section]) => {
      if (skipKeys.has(key)) return false;
      return section && typeof section === 'object' && !Array.isArray(section) && ('score' in section || 'reason' in section);
    });

    return {
      success: true,
      data: {
        ...analysisData,
        potentialScore: finalScore,
        analysis: {
          ...nested,
          auditedItems,
          strengths,
          weaknesses,
          recommendations,
          summary,
          legacyDetails
        }
      }
    };
  }

  /**
   * Call API to analyze project and get AI score
   */
  static async analyzeProjectAPI(projectId) {
    try {
      const result = await apiClient.post(`/api/StartupAIAnalysis/${projectId}/analyze`);
      return this.normalizeAIResults(result);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get previous AI analysis results for a project
   */
  static async getProjectAnalysisHistory(projectId) {
    try {
      const result = await apiClient.get(`/api/StartupAIAnalysis/${projectId}`, { params: { pageSize: 100 } });
      const rawData = result.data || result;
      const normalizedData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      
      const translatedHistory = normalizedData.map(item => this.normalizeAIResults({ success: true, data: item }).data);

      return {
        success: true,
        data: translatedHistory
      };
    } catch (error) {
      return { success: false, data: [] };
    }
  }

  /**
   * Investor-triggered AI analysis of a project
   */
  static async analyzeProjectByInvestorAPI(projectId) {
    try {
      if (!projectId && projectId !== 0) {
        return { success: false, message: 'Invalid projectId' };
      }
      const result = await apiClient.post(`/api/InvestorAIAnalysis/${projectId}/analyze`);
      
      const translatedData = this.translateAIResults(result);

      return {
        success: true,
        data: translatedData.data || translatedData,
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
   */
  static async getInvestorAnalysisHistory(projectId) {
    try {
      const result = await apiClient.get(`/api/InvestorAIAnalysis/${projectId}`, { params: { pageSize: 100 } });
      const rawData = result.data || result;
      const normalizedData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      
      const translatedHistory = normalizedData.map(item => this.translateAIResults({ success: true, data: item }).data || item);

      return {
        success: true,
        data: translatedHistory
      };
    } catch (error) {
      return { success: false, data: [] };
    }
  }

  /**
   * Helper: Convert score to category
   */
  static getScoreCategory(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  }
}

export default AIEvaluationService;

