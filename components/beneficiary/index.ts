/**
 * @fileoverview index Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

// Beneficiary Module - Optimized Components
// Split from BeneficiaryDetailPageComprehensive for better performance

export { BeneficiaryAidHistory } from './BeneficiaryAidHistory';
export { BeneficiaryDocuments } from './BeneficiaryDocuments';
export { BeneficiaryFamily } from './BeneficiaryFamily';
export { BeneficiaryFinancial } from './BeneficiaryFinancial';
export { BeneficiaryHeader } from './BeneficiaryHeader';
export { BeneficiaryHealthInfo } from './BeneficiaryHealthInfo';
// export { BeneficiaryOptimized } from './BeneficiaryOptimized'; // File deleted
export { BeneficiaryPersonalInfo } from './BeneficiaryPersonalInfo';

// New extracted components from BeneficiaryDetailPageComprehensive
export { default as BeneficiaryDocumentManager } from './BeneficiaryDocumentManager';
export { default as BeneficiaryPhotoGallery } from './BeneficiaryPhotoGallery';
export { default as BeneficiaryDependentManager } from './BeneficiaryDependentManager';
export { default as BeneficiaryRelationshipManager } from './BeneficiaryRelationshipManager';

// Types
/**
 * BeneficiaryData Interface
 * 
 * @interface BeneficiaryData
 */
export interface BeneficiaryData {
  id: string;
  name: string;
  tcNo: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  district: string;
  birthDate: string;
  gender: 'Erkek' | 'Kadın';
  maritalStatus: string;
  education: string;
  occupation: string;
  status: 'Aktif' | 'Pasif' | 'Beklemede';
  registrationDate: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savings?: number;
  debts?: number;
  incomeSource?: string;
  bloodType?: string;
  emergencyContact?: string;
  healthConditions?: Record<string, boolean>;
  healthNotes?: string;
  familyMembers?: FamilyMember[];
  documents?: Document[];
  aidHistory?: AidRecord[];
}

/**
 * FamilyMember Interface
 * 
 * @interface FamilyMember
 */
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  occupation?: string;
  income?: number;
  healthStatus?: string;
}

/**
 * AidRecord Interface
 * 
 * @interface AidRecord
 */
export interface AidRecord {
  id: string;
  date: string;
  type: 'Nakdi' | 'Ayni' | 'Hizmet';
  category: string;
  amount?: number;
  description: string;
  status: 'Tamamlandı' | 'Beklemede' | 'İptal';
  approvedBy: string;
}
