/**
 * @fileoverview useBeneficiaryData Hook - Beneficiary data management
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ihtiyacSahipleriService } from '../services/ihtiyacSahipleriService';

export interface BeneficiaryDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  url?: string;
}

export interface BeneficiaryPhoto {
  id: number;
  name: string;
  url: string;
  uploadDate?: string;
  description?: string;
}

export interface BeneficiaryDependent {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  ad_soyad?: string;
  tur?: string;
  yakinlik?: string;
  kimlik_no?: string;
  telefon_no?: string;
  baglanti_tarihi?: string;
  relationship_id?: string;
  sehri?: string;
  uyruk?: string;
}

export interface BeneficiaryRelationship {
  id: string;
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

/**
 * Custom hook for managing beneficiary data including documents, photos, dependents, and relationships
 */
export function useBeneficiaryData(beneficiaryId?: string) {
  const [beneficiaryData, setBeneficiaryData] = useState<Record<string, unknown> | null>(null);
  const [documents, setDocuments] = useState<BeneficiaryDocument[]>([]);
  const [photos, setPhotos] = useState<BeneficiaryPhoto[]>([]);
  const [dependents, setDependents] = useState<BeneficiaryDependent[]>([]);
  const [relationships, setRelationships] = useState<BeneficiaryRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load related data for the beneficiary
   */
  const loadRelatedData = useCallback(async (_id: string) => {
    try {
      // Load documents, photos, dependents, and relationships
      // This would typically make API calls to load related data
      
      // Mock implementation for now
      setDocuments([
        {
          id: '1',
          name: 'kimlik_fotokopisi.pdf',
          type: 'Kimlik',
          size: '2.1 MB',
          uploadDate: '15.03.2024',
          url: '/mock-document.pdf'
        }
      ]);

      setPhotos([
        {
          id: 1,
          name: 'profil_foto.jpg',
          url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20photo%20of%20a%20person&image_size=square',
          uploadDate: '15.03.2024',
          description: 'Profil fotoğrafı'
        }
      ]);

      setDependents([]);
      setRelationships([]);
    } catch (err) {
      // console.error('Error loading related data:', err);
      setError('İlgili veriler yüklenirken hata oluştu');
    }
  }, []);

  /**
   * Load beneficiary data by ID
   */
  const loadBeneficiaryData = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await ihtiyacSahipleriService.getById(Number(id));
      
      if (result.success && result.data) {
        setBeneficiaryData(result.data);
        await loadRelatedData(result.data.id);
      } else {
        setError(result.error || 'İhtiyaç sahibi bilgileri alınamadı');
        toast.error(result.error || 'İhtiyaç sahibi bilgileri alınamadı');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadRelatedData]);

  const updateDocuments = useCallback((newDocuments: BeneficiaryDocument[]) => {
    setDocuments(newDocuments);
  }, []);

  const updatePhotos = useCallback((newPhotos: BeneficiaryPhoto[]) => {
    setPhotos(newPhotos);
  }, []);

  const updateDependents = useCallback((newDependents: BeneficiaryDependent[]) => {
    setDependents(newDependents);
  }, []);

  const updateRelationships = useCallback((newRelationships: BeneficiaryRelationship[]) => {
    setRelationships(newRelationships);
  }, []);

  const updateBeneficiaryData = useCallback((updates: Partial<Record<string, unknown>>) => {
    setBeneficiaryData(prev => prev ? { ...prev, ...updates } : updates as Record<string, unknown>);
  }, []);

  // Load data when beneficiaryId changes
  useEffect(() => {
    if (beneficiaryId) {
      loadBeneficiaryData(beneficiaryId);
    }
  }, [beneficiaryId, loadBeneficiaryData]);

  return {
    // Data
    beneficiaryData,
    documents,
    photos,
    dependents,
    relationships,
    loading,
    error,

    // Actions
    loadBeneficiaryData,
    updateBeneficiaryData,
    updateDocuments,
    updatePhotos,
    updateDependents,
    updateRelationships,
    
    // Utilities
    clearError: () => {
      setError(null);
    },
    refresh: () => beneficiaryId && loadBeneficiaryData(beneficiaryId)
  };
}