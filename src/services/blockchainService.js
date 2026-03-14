/**
 * blockchainService.js
 * Handles blockchain integration for IP protection and document verification
 * Ported from web implementation for mobile consistency.
 */

class BlockchainService {
  /**
   * Simulate hash generation for a string/content
   */
  static _simpleHash(data) {
    let hash = 0;
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (str.length === 0) return '0x0';
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const hashHex = Math.abs(hash).toString(16).padStart(64, '0');
    return '0x' + hashHex;
  }

  static _generateTransactionHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  /**
   * Simulate IP protection on blockchain
   */
  static async protectDocumentsOnBlockchain(filenames, projectId) {
    if (!filenames || filenames.length === 0) {
      return { success: false, error: 'Không có tài liệu để bảo vệ' };
    }

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const combinedHash = filenames.join('|');
      const blockchainHash = this._simpleHash(combinedHash);
      const transactionHash = this._generateTransactionHash();
      const timestamp = new Date().toISOString();

      return {
        success: true,
        blockchainHash,
        transactionHash,
        timestamp,
        status: 'SUCCESS',
        verificationStatus: 'Verified'
      };
    } catch (error) {
      console.error('[BLOCKCHAIN] Protection failed:', error);
      return { success: false, error: error.message };
    }
  }

  static getBlockchainProof(project) {
    if (!project.blockchainHash || !project.transactionHash) {
      return { available: false, message: 'Chưa có bằng chứng blockchain' };
    }

    return {
      available: true,
      transactionHash: project.transactionHash,
      timestamp: new Date(project.ipProtectionDate || Date.now()).toLocaleString('vi-VN'),
      verificationStatus: 'Verified',
      shortHash: project.transactionHash.substring(0, 16) + '...'
    };
  }
}

export default BlockchainService;
