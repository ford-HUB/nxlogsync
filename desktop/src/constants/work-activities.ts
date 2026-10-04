import type { WorkActivity } from '@/types/daily-log'

/**
 * The N-PAX Work Activity lookup (27 rows), copied as the site lists it. Must
 * match the server's WORK_ACTIVITIES, which only accepts these codes.
 */
export const WORK_ACTIVITIES: WorkActivity[] = [
  { code: 'ACCT', category: 'B', name: 'ACCOUNTING', details: '', fbsCode: 'ACCT' },
  { code: 'ADMIN', category: 'B', name: 'ADMINISTRATION', details: 'Clerical Works, Interview, Sales, Liaison works, Performance Evaluation', fbsCode: 'ADMIN' },
  { code: 'COMPACT', category: 'B', name: 'COMPANY ACTIVITY', details: '', fbsCode: 'COMPACT' },
  { code: 'CRM', category: 'B', name: 'CUSTOMER RELATION MGT', details: 'Chat Support,Email Support,Call Support,Onsite Support, Bug Trace & Investigation', fbsCode: 'CRM' },
  { code: 'DEPCOMP', category: 'B', name: 'DEPLOYMENT AT COMPANY', details: '', fbsCode: 'DEPCOMP' },
  { code: 'DEPSITE', category: 'B', name: 'DEPLOYMENT ON-SITE', details: 'Users Training, Systems Implementation', fbsCode: 'DEPSITE' },
  { code: 'DEV', category: 'B', name: 'DEVELOPMENT', details: 'Development, Unit Testing', fbsCode: 'DEV|$|' },
  { code: 'DOCU', category: 'B', name: 'DOCUMENTATION', details: '', fbsCode: 'DOCU' },
  { code: 'DSG', category: 'B', name: 'DESIGN & ANALYSIS', details: '', fbsCode: 'DSG' },
  { code: 'DTADM', category: 'B', name: 'BACK DOOR OR DATA INVESTIGATION', details: 'Backdoor, Data Investigation', fbsCode: 'DTADM' },
  { code: 'EMPCONS', category: 'B', name: 'EMPLOYEE CONSULTATION', details: '', fbsCode: 'EMPCONS' },
  { code: 'EMPORTN', category: 'B', name: 'EMPLOYEE ORIENTATION', details: '', fbsCode: 'EMPORTN' },
  { code: 'HR', category: 'B', name: 'HUMAN RESOURCE', details: '', fbsCode: 'HR' },
  { code: 'HRNG', category: 'B', name: 'HIRING', details: '', fbsCode: 'HRNG' },
  { code: 'MTGCLNT', category: 'B', name: 'MEETING AT CLIENT', details: 'Kick Off Meeting, Closing Meeting, Project Meeting', fbsCode: 'MTGCLNT' },
  { code: 'MTGCOMP', category: 'B', name: 'MEETING AT N-PAX', details: 'New Hire Orientation,Managers Meeting,Group Meeting,Company Announcement Meeting,Performance Feedback Discussion, Specification Discussion', fbsCode: 'MTGCOMP' },
  { code: 'NVA', category: 'B', name: 'NON VALUE ADDED WORK', details: 'Idle, No assigned task, monthly activity preparation, Corporate Social Responsibility, Annual Physical Examination,HMO and other Providers Orientation,Company Initiated Work Stoppage', fbsCode: 'NVA' },
  { code: 'PROJMGT', category: 'B', name: 'PROJECT MANAGEMENT', details: '', fbsCode: 'PROJMGT' },
  { code: 'QA', category: 'B', name: 'QA TESTING', details: 'System Testing, Merge Source,Build Solution, Test Data Creation,Test Specification Creation', fbsCode: 'QA|$|' },
  { code: 'REV', category: 'B', name: 'SYSTEMS REVIEW/CONSULTATION', details: '', fbsCode: 'REV' },
  { code: 'RSRCH', category: 'B', name: 'RESEARCH', details: '', fbsCode: 'RSRCH' },
  { code: 'SALES', category: 'B', name: 'SALES ACTIVITY', details: '', fbsCode: 'SALES' },
  { code: 'SERVER', category: 'B', name: 'SERVER MIGRATION AND SUPPORT', details: '', fbsCode: 'SERVER' },
  { code: 'STUDY', category: 'B', name: 'SYSTEMS STUDY', details: '', fbsCode: 'STUDY' },
  { code: 'TRNCOMP', category: 'B', name: 'TRAINING AT N-PAX', details: '', fbsCode: 'TRNCOMP' },
  { code: 'TRNOUTS', category: 'B', name: 'TRAINING OUTSIDE', details: '', fbsCode: 'TRNOUTS' },
  { code: 'TRV', category: 'B', name: 'TRAVEL', details: '', fbsCode: 'TRV' },
]

export function findWorkActivity(code: string | null): WorkActivity | null {
  return WORK_ACTIVITIES.find((a) => a.code === code) ?? null
}

/** Rows per page in the work activity lookup table. */
export const WORK_ACTIVITY_LOOKUP_PAGE_SIZE = 30
