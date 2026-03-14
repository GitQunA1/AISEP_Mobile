/**
 * projectValidationService.js
 * Validates project creation and updates against business rules
 * Ported from web for validation consistency across platforms.
 */

// Mirrors PROJECT_STATUS from web
export const PROJECT_STATUS = {
  DRAFT: 'Draft',
  IP_PROTECTED: 'IP_Protected',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected'
};

class ProjectValidationService {
  /**
   * BR-19: Get publication checklist status
   */
  static getPublicationChecklist(project) {
    if (!project) return { canPublish: false, checklist: {}, remainingItems: ['Project data'] };

    const checklist = {
      ipProtected: {
        complete: !!project.blockchainHash && !!project.ipProtectionDate,
        label: 'Đã bảo vệ IP',
        message: 'Tài liệu đã được bảo vệ trên blockchain'
      },
      aiEvaluated: {
        complete: !!project.aiEvaluation,
        label: 'Đã đánh giá AI',
        message: 'Phân tích AI đã hoàn thành'
      },
      staffApproved: {
        complete: project.status === PROJECT_STATUS.APPROVED || project.status === 'Approved',
        label: 'Đã được duyệt',
        message: 'Đã được đội ngũ vận hành phê duyệt'
      }
    };

    const canPublish = Object.values(checklist).every(item => item.complete);

    return {
      canPublish,
      checklist,
      remainingItems: Object.entries(checklist)
        .filter(([_, item]) => !item.complete)
        .map(([_, item]) => item.label)
    };
  }

  /**
   * BR-05: Basic field validation
   */
  static validateProjectData(data) {
    const errors = {};
    if (!data.projectName?.trim()) errors.projectName = 'Tên dự án là bắt buộc';
    if (!data.industry) errors.industry = 'Lĩnh vực là bắt buộc';
    if (!data.shortDescription?.trim()) errors.shortDescription = 'Mô tả ngắn là bắt buộc';
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default ProjectValidationService;
