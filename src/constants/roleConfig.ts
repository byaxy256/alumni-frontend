// Role configuration for office roles
export const INTERNAL_OFFICE_ROLES = {
  ADMINISTRATOR: 'administrator',
  GENERAL_SECRETARY: 'general_secretary',
  FINANCE: 'finance',
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  PUBLICITY: 'publicity',
  SECRETARY_ACADEMICS: 'secretary_academics',
  PROJECTS_MANAGER: 'projects_manager',
} as const;

export type InternalOfficeRole = typeof INTERNAL_OFFICE_ROLES[keyof typeof INTERNAL_OFFICE_ROLES];

export const ROLE_DISPLAY_NAMES: Record<InternalOfficeRole, string> = {
  administrator: 'Administrator Dashboard',
  general_secretary: 'General Secretary Dashboard',
  finance: 'Finance Dashboard',
  president: 'President Dashboard',
  vice_president: 'Vice President Dashboard',
  publicity: 'Publicity Dashboard',
  secretary_academics: 'Secretary Academics Dashboard',
  projects_manager: 'Projects Manager Dashboard',
};

export const WORKFLOW_STAGES = {
  ADMINISTRATOR: 'administrator',
  GENERAL_SECRETARY: 'general_secretary',
  FINANCE_REVIEW: 'finance_review',
  EXECUTIVE_REVIEW: 'executive_review',
  FINANCE_DISBURSEMENT: 'finance_disbursement',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

export const WORKFLOW_STAGE_ORDER = [
  'administrator',
  'general_secretary',
  'finance_review',
  'executive_review',
  'finance_disbursement',
] as const;

export const EXECUTIVE_ROLES = ['president', 'vice_president'] as const;
