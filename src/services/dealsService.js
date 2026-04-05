import apiClient from './apiClient';

// Status mapping for deals (BR-020, BR-021) - Ported from Web
const STATUS_MAP = {
  0: { label: 'Pending', labelVi: 'Chờ xác nhận', color: '#f59e0b', value: 0 },
  1: { label: 'Confirmed', labelVi: 'Đã xác nhận', color: '#10b981', value: 1 },
  2: { label: 'Waiting_For_Startup_Signature', labelVi: 'Chờ ký từ Startup', color: '#f97316', value: 2 },
  3: { label: 'Contract_Signed', labelVi: 'Đã ký kết', color: '#667eea', value: 3 },
  4: { label: 'Minted_NFT', labelVi: 'Đã mint NFT', color: '#8b5cf6', value: 4 },
  5: { label: 'Rejected', labelVi: 'Bị từ chối', color: '#ef4444', value: 5 },
  6: { label: 'Failed', labelVi: 'Thất bại', color: '#dc2626', value: 6 }
};

// String to numeric status mapping
const STRING_STATUS_MAP = {
  'Pending': 0,
  'Confirmed': 1,
  'Waiting_For_Startup_Signature': 2,
  'Contract_Signed': 3,
  'Minted_NFT': 4,
  'Rejected': 5,
  'Failed': 6
};

/**
 * dealsService.js for Mobile
 * Manages investment deals between Investors and Startups
 * Ported from Web for full feature parity
 */
const dealsService = {
  /**
   * Create a new investment deal (Investor only)
   */
  createDeal: async (projectId) => {
    try {
      const response = await apiClient.post('/api/Deals', {
        projectId: projectId,
      });
      return response;
    } catch (error) {
      console.error('[dealsService] createDeal Error:', error);
      throw error;
    }
  },

  /**
   * Get all deals for current investor
   */
  getInvestorDeals: async () => {
    try {
      const response = await apiClient.get('/api/Deals');
      return response;
    } catch (error) {
      console.error('[dealsService] getInvestorDeals Error:', error);
      throw error;
    }
  },

  /**
   * Get deal details by ID
   */
  getDealById: async (dealId) => {
    try {
      const response = await apiClient.get(`/api/Deals/${dealId}`);
      return response;
    } catch (error) {
      console.error('[dealsService] getDealById Error:', error);
      throw error;
    }
  },

  /**
   * Get investment contract status
   */
  getContractStatus: async (dealId) => {
    try {
      const response = await apiClient.get(`/api/Deals/${dealId}/contract-status`);
      return response;
    } catch (error) {
      console.error('[dealsService] getContractStatus Error:', error);
      throw error;
    }
  },

  /**
   * Respond to a deal (approve or reject) - Used by Startups
   */
  respondToDeal: async (dealId, isAccepted) => {
    try {
      const response = await apiClient.patch(`/api/Deals/${dealId}/respond`, {
        isAccepted: isAccepted,
      });
      return response;
    } catch (error) {
      console.error('[dealsService] respondToDeal Error:', error);
      throw error;
    }
  },

  /**
   * Get deals for startup (pending to be responded)
   */
  getStartupDeals: async () => {
    try {
      const response = await apiClient.get('/api/Deals');
      return response;
    } catch (error) {
      console.error('[dealsService] getStartupDeals Error:', error);
      throw error;
    }
  },

  /**
   * Get contract preview (HTML template)
   */
  getContractPreview: async (dealId) => {
    try {
      const response = await apiClient.get(`/api/Deals/${dealId}/contract-preview`);
      return response;
    } catch (error) {
      console.error('[dealsService] getContractPreview Error:', error);
      throw error;
    }
  },

  /**
   * Sign a contract (Investor signing)
   */
  signContract: async (dealId, signData = {}) => {
    try {
      const payload = {
        finalAmount: signData.finalAmount || 0,
        finalEquityPercentage: signData.finalEquityPercentage || 0,
        additionalTerms: signData.additionalTerms || '',
        signatureBase64: signData.signatureBase64 || ''
      };
      const response = await apiClient.post(`/api/Deals/${dealId}/investor-sign`, payload);
      return response;
    } catch (error) {
      console.error('[dealsService] signContract (investor) Error:', error);
      throw error;
    }
  },

  /**
   * Sign a contract (Startup signing)
   */
  signContractStartup: async (dealId, signData = {}) => {
    try {
      const payload = {
        // Startup only needs to send signature if basic terms are already confirmed
        signatureBase64: signData.signatureBase64 || ''
      };
      const response = await apiClient.post(`/api/Deals/${dealId}/startup-sign`, payload);
      return response;
    } catch (error) {
      console.error('[dealsService] signContractStartup Error:', error);
      throw error;
    }
  },

  /**
   * Get status display info
   */
  getStatusInfo: (statusValue) => {
    let numericStatus = statusValue;
    if (typeof statusValue === 'string') {
      numericStatus = STRING_STATUS_MAP[statusValue] !== undefined ? STRING_STATUS_MAP[statusValue] : 0;
    } else {
      numericStatus = typeof statusValue === 'number' ? statusValue : 0;
    }
    return STATUS_MAP[numericStatus] || STATUS_MAP[0];
  },

  getAllStatuses: () => {
    return Object.values(STATUS_MAP);
  }
};

export default dealsService;
