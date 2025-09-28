/**
 * @fileoverview useBeneficiaryData Hook - Custom hook for beneficiary data operations
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ihtiyacSahipleriService } from '../services';
import { DependentPerson } from '../components/beneficiary/BeneficiaryDependentManager';
import { useAuthStore } from '../stores';

/**
 * BeneficiaryData interface for hook state
 */
export interface BeneficiaryData {
  id: string | number;
  ad_soyad?: string;
  name?: string;
  surname?: string;
  tc_kimlik_no?: string;
  id_number?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  education_level?: string;
  occupation?: string;
  income?: number | string;
  health_status?: string;
  disability_status?: string;
  disability_rate?: number | string;
  notes?: string;
  durum?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Extended fields
  [key: string]: any;
}

/**
 * HookOptions interface for configuring hook behavior
 */
interface HookOptions {
  /** Whether to auto-load beneficiary data when id changes */
  autoLoad?: boolean;
  /** Callback when loading starts */
  onLoadStart?: () => void;
  /** Callback when loading ends */
  onLoadEnd?: (success: boolean) => void;
  /** Callback when saving starts */
  onSaveStart?: () => void;
  /** Callback when saving ends */
  onSaveEnd?: (success: boolean) => void;
}

/**
 * Custom hook for managing beneficiary data
 * 
 * @param beneficiaryId - ID of the beneficiary to load
 * @param options - Hook options
 */
export const useBeneficiaryData = (
  beneficiaryId?: string | number | null,
  options: HookOptions = {}
) => {
  const {
    autoLoad = true,
    onLoadStart,
    onLoadEnd,
    onSaveStart,
    onSaveEnd,
  } = options;

  // Core beneficiary state
  const [data, setData] = useState<BeneficiaryData | null>(null);
  const [originalData, setOriginalData] = useState<BeneficiaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Related data states
  const [documents, setDocuments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [dependents, setDependents] = useState<DependentPerson[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);

  // Get current user for audit logs
  const user = useAuthStore((state) => state.user);

  /**
   * Load beneficiary data from server
   */
  const loadBeneficiaryData = useCallback(async () => {
    if (!beneficiaryId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();
      
      // Get beneficiary data
      const result = await ihtiyacSahipleriService.getIhtiyacSahibiById(beneficiaryId);
      
      if (result.error) {
        setError(`Veri yüklenirken hata: ${result.error}`);
        console.error('❌ Error loading beneficiary data:', result.error);
        toast.error(`İhtiyaç sahibi verileri yüklenirken hata oluştu: ${result.error}`);
        onLoadEnd?.(false);
        return;
      }
      
      if (result.data) {
        setData(result.data);
        setOriginalData(result.data);
        console.log('✅ Beneficiary data loaded:', result.data);
        
        // Load related data - documents, photos, etc.
        loadRelatedData(result.data.id);
      }
      
      onLoadEnd?.(true);
    } catch (err: any) {
      console.error('❌ Error loading beneficiary data:', err);
      setError(`Veri yüklenirken beklenmeyen hata: ${err.message}`);
      toast.error('İhtiyaç sahibi verileri yüklenirken beklenmeyen hata');
      onLoadEnd?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [beneficiaryId, onLoadStart, onLoadEnd]);

  /**
   * Load related data (documents, photos, dependencies, etc.)
   */
  const loadRelatedData = async (id: string | number) => {
    try {
      // Load documents
      const documentsResult = await ihtiyacSahipleriService.getIhtiyacSahibiDocuments(id);
      if (documentsResult.data) {
        setDocuments(documentsResult.data);
      }
      
      // Load photos
      const photosResult = await ihtiyacSahipleriService.getIhtiyacSahibiPhotos(id);
      if (photosResult.data) {
        setPhotos(photosResult.data);
      }
      
      // Load dependents and relationships
      // This would be actual API calls in a real implementation
      console.log('📋 Loading related data for beneficiary ID:', id);
      
    } catch (err: any) {
      console.error('❌ Error loading related data:', err);
      toast.error('İlişkili veriler yüklenirken hata oluştu');
    }
  };

  /**
   * Update beneficiary data locally
   * 
   * @param newData - Partial data to update
   */
  const updateData = useCallback((newData: Partial<BeneficiaryData>) => {
    setData((prevData) => {
      if (!prevData) return prevData;
      return { ...prevData, ...newData };
    });
  }, []);

  /**
   * Save beneficiary data to server
   */
  const saveBeneficiaryData = useCallback(async () => {
    if (!data || !data.id) {
      toast.error('Kaydedilecek veri bulunamadı');
      return false;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      onSaveStart?.();
      
      // Compare with original data to see if there are changes
      const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);
      
      if (!hasChanges) {
        toast.info('Değişiklik yapılmadı');
        onSaveEnd?.(true);
        return true;
      }
      
      // Save the beneficiary data
      const result = await ihtiyacSahipleriService.updateIhtiyacSahibi(data.id, data);
      
      if (result.error) {
        setError(`Kayıt sırasında hata: ${result.error}`);
        console.error('❌ Error saving beneficiary data:', result.error);
        toast.error(`İhtiyaç sahibi kaydedilirken hata: ${result.error}`);
        onSaveEnd?.(false);
        return false;
      }
      
      // Update original data reference
      setOriginalData(data);
      
      // Log the save action for audit
      console.log(`✅ Beneficiary data saved by ${user?.email || 'unknown user'}:`, data);
      
      toast.success('İhtiyaç sahibi bilgileri başarıyla kaydedildi');
      onSaveEnd?.(true);
      return true;
      
    } catch (err: any) {
      console.error('❌ Error saving beneficiary data:', err);
      setError(`Kayıt sırasında beklenmeyen hata: ${err.message}`);
      toast.error('İhtiyaç sahibi kaydedilirken beklenmeyen hata');
      onSaveEnd?.(false);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data, originalData, user, onSaveStart, onSaveEnd]);

  /**
   * Reset data to original state
   */
  const resetData = useCallback(() => {
    setData(originalData);
    toast.info('Değişiklikler geri alındı');
  }, [originalData]);

  /**
   * Handle document updates
   */
  const updateDocuments = useCallback((newDocuments: any[]) => {
    setDocuments(newDocuments);
  }, []);

  /**
   * Handle photo updates
   */
  const updatePhotos = useCallback((newPhotos: any[]) => {
    setPhotos(newPhotos);
  }, []);

  /**
   * Handle dependent updates
   */
  const updateDependents = useCallback((newDependents: DependentPerson[]) => {
    setDependents(newDependents);
  }, []);

  /**
   * Handle relationship updates
   */
  const updateRelationships = useCallback((newRelationships: any[]) => {
    setRelationships(newRelationships);
  }, []);

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(originalData);
  }, [data, originalData]);

  // Load data when beneficiaryId changes (if autoLoad is true)
  useEffect(() => {
    if (beneficiaryId && autoLoad) {
      loadBeneficiaryData();
    }
  }, [beneficiaryId, autoLoad, loadBeneficiaryData]);

  return {
    data,
    isLoading,
    isSaving,
    error,
    documents,
    photos,
    dependents,
    relationships,
    updateData,
    saveBeneficiaryData,
    resetData,
    loadBeneficiaryData,
    updateDocuments,
    updatePhotos,
    updateDependents,
    updateRelationships,
    hasUnsavedChanges,
  };
};

// Export as named export (not default export) to match project pattern