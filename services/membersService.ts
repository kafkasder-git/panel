import { supabase } from '../lib/supabase';
import { logger } from '../lib/logging/logger';

// Member types - Updated to match database schema (UUID-based)
export interface Member {
  id: string; // UUID
  name: string;
  surname: string; // Required in database
  email: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  country: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  occupation?: string;
  employer?: string;
  membership_type: 'standard' | 'premium' | 'corporate' | 'student' | 'senior' | 'honorary';
  membership_number: string;
  join_date: string;
  membership_status: 'active' | 'inactive' | 'suspended' | 'expired' | 'pending';
  expiry_date?: string;
  annual_fee?: number;
  fee_paid: boolean;
  last_payment_date?: string;
  payment_method?: string;
  profession?: string;
  specialization?: string;
  experience_years?: number;
  education_level?: 'high_school' | 'bachelor' | 'master' | 'phd' | 'other';
  certifications?: string[];
  languages?: string[];
  preferred_contact_method?: 'email' | 'phone' | 'sms' | 'mail';
  newsletter_subscription: boolean;
  event_notifications: boolean;
  marketing_consent: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  committee_memberships?: string[];
  volunteer_interests?: string[];
  leadership_positions?: string[];
  skills_and_expertise?: string[];
  last_activity_date?: string;
  event_attendance_count: number;
  volunteer_hours: number;
  contribution_amount: number;
  notes?: string;
  special_requirements?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  ip_address?: string;
  user_agent?: string;
  source?: string;
  referral_code?: string;
}

// API response type
export interface MembersApiResponse<T> {
  data?: T;
  error?: string;
  count?: number;
  totalPages?: number;
}

// Filters interface
export interface MembersFilters {
  searchTerm?: string;
  membershipStatus?: string;
  membershipType?: string;
  city?: string;
  profession?: string;
  dateFrom?: string;
  dateTo?: string;
  volunteerAvailable?: boolean;
  feePaid?: boolean;
}

// Member statistics interface
export interface MemberStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expired: number;
  pending: number;
  byMembershipType: Record<string, number>;
  byCity: Record<string, number>;
  byProfession: Record<string, number>;
  recentJoins: number;
  averageAge: number;
  totalVolunteerHours: number;
  totalContributions: number;
  feePaidPercentage: number;
}

export class MembersService {
  // Get all members with pagination and filters
  async getMembers(
    page = 1,
    pageSize = 10,
    filters: MembersFilters = {},
  ): Promise<MembersApiResponse<Member[]>> {
    try {
      logger.info('Fetching members with filters', { filters });

      let query = supabase.from('members').select('*', { count: 'exact' });

      // Search filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        query = query.or(
          `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,membership_number.ilike.%${term}%`,
        );
      }

      // Membership status filter
      if (filters.membershipStatus && filters.membershipStatus !== 'all') {
        query = query.eq('membership_status', filters.membershipStatus);
      }

      // Membership type filter
      if (filters.membershipType && filters.membershipType !== 'all') {
        query = query.eq('membership_type', filters.membershipType);
      }

      // City filter
      if (filters.city && filters.city !== 'all') {
        query = query.eq('city', filters.city);
      }

      // Profession filter
      if (filters.profession && filters.profession !== 'all') {
        query = query.eq('profession', filters.profession);
      }

      // Date range filter
      if (filters.dateFrom) {
        query = query.gte('join_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('join_date', filters.dateTo);
      }

      // Volunteer availability filter
      if (filters.volunteerAvailable !== undefined) {
        query = query.eq('volunteer_hours', filters.volunteerAvailable ? 0 : null);
      }

      // Fee paid filter
      if (filters.feePaid !== undefined) {
        query = query.eq('fee_paid', filters.feePaid);
      }

      // Pagination
      const startIndex = (page - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);

      // Order by join date (newest first)
      query = query.order('join_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching members', error);
        return { error: error.message };
      }

      logger.info(`Successfully fetched ${data?.length || 0} members`);

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error: any) {
      logger.error('Unexpected error in getMembers', error);
      return { error: error.message || 'Beklenmeyen hata oluştu' };
    }
  }

  // Get single member
  async getMember(id: number): Promise<MembersApiResponse<Member>> {
    try {
      logger.info('🔄 Fetching single member with id:', id);

      const { data, error } = await supabase.from('members').select('*').eq('id', id).single();

      if (error) {
        logger.error('❌ Error fetching single member:', error);
        return { error: error.message };
      }

      logger.info('✅ Successfully fetched member:', data?.name);
      return { data };
    } catch (error: any) {
      logger.error('❌ Unexpected error in getMember:', error);
      return { error: error.message || 'Üye bulunamadı' };
    }
  }

  // Get member statistics
  async getMemberStats(): Promise<MembersApiResponse<MemberStats>> {
    try {
      logger.info('🔄 Fetching member statistics');

      // Get all member data
      const { data: membersData, error } = await supabase
        .from('members')
        .select(
          'membership_status, membership_type, city, profession, join_date, birth_date, volunteer_hours, contribution_amount, fee_paid',
        );

      if (error) {
        logger.error('❌ Error fetching member stats:', error);
        return { error: error.message };
      }

      const members = membersData || [];

      // Calculate statistics
      const total = members.length;

      // Status breakdown
      const statusCounts = members.reduce<Record<string, number>>((acc, m) => {
        acc[m.membership_status] = (acc[m.membership_status] || 0) + 1;
        return acc;
      }, {});

      // Membership type breakdown
      const membershipTypeCounts = members.reduce<Record<string, number>>((acc, m) => {
        acc[m.membership_type] = (acc[m.membership_type] || 0) + 1;
        return acc;
      }, {});

      // City breakdown
      const cityCounts = members.reduce<Record<string, number>>((acc, m) => {
        if (m.city) {
          acc[m.city] = (acc[m.city] || 0) + 1;
        }
        return acc;
      }, {});

      // Profession breakdown
      const professionCounts = members.reduce<Record<string, number>>((acc, m) => {
        if (m.profession) {
          acc[m.profession] = (acc[m.profession] || 0) + 1;
        }
        return acc;
      }, {});

      // Recent joins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentJoins = members.filter((m) => new Date(m.join_date) >= thirtyDaysAgo).length;

      // Average age
      const membersWithAge = members.filter((m) => m.birth_date);
      const averageAge =
        membersWithAge.length > 0
          ? membersWithAge.reduce((sum, m) => {
              const age = new Date().getFullYear() - new Date(m.birth_date).getFullYear();
              return sum + age;
            }, 0) / membersWithAge.length
          : 0;

      // Total volunteer hours
      const totalVolunteerHours = members.reduce((sum, m) => sum + (m.volunteer_hours || 0), 0);

      // Total contributions
      const totalContributions = members.reduce((sum, m) => sum + (m.contribution_amount || 0), 0);

      // Fee paid percentage
      const feePaidPercentage =
        total > 0 ? (members.filter((m) => m.fee_paid).length / total) * 100 : 0;

      const stats: MemberStats = {
        total,
        active: statusCounts.active ?? 0,
        inactive: statusCounts.inactive ?? 0,
        suspended: statusCounts.suspended ?? 0,
        expired: statusCounts.expired ?? 0,
        pending: statusCounts.pending ?? 0,
        byMembershipType: membershipTypeCounts,
        byCity: cityCounts,
        byProfession: professionCounts,
        recentJoins,
        averageAge: Math.round(averageAge),
        totalVolunteerHours,
        totalContributions,
        feePaidPercentage: Math.round(feePaidPercentage),
      };

      logger.info('✅ Successfully calculated member statistics:', {
        total: stats.total,
        active: stats.active,
        averageAge: stats.averageAge,
      });

      return { data: stats };
    } catch (error: any) {
      logger.error('❌ Error calculating member statistics:', error);
      return { error: error.message || 'İstatistikler hesaplanamadı' };
    }
  }

  // Get cities for filter dropdown
  async getCities(): Promise<MembersApiResponse<string[]>> {
    try {
      const { data, error } = await supabase.from('members').select('city').not('city', 'is', null);

      if (error) {
        return { error: error.message };
      }

      const cities = [...new Set(data.map((item) => item.city))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      return { data: cities };
    } catch (error: any) {
      return { error: error.message || 'Şehirler getirilemedi' };
    }
  }

  // Get membership types for filter dropdown
  async getMembershipTypes(): Promise<MembersApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('membership_type')
        .not('membership_type', 'is', null);

      if (error) {
        return { error: error.message };
      }

      const membershipTypes = [...new Set(data.map((item) => item.membership_type))].sort((a, b) =>
        a.localeCompare(b),
      );
      return { data: membershipTypes };
    } catch (error: any) {
      return { error: error.message || 'Üyelik türleri getirilemedi' };
    }
  }

  // Get professions for filter dropdown
  async getProfessions(): Promise<MembersApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('profession')
        .not('profession', 'is', null);

      if (error) {
        return { error: error.message };
      }

      const professions = [...new Set(data.map((item) => item.profession))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      return { data: professions };
    } catch (error: any) {
      return { error: error.message || 'Meslekler getirilemedi' };
    }
  }

  // Create new member
  async createMember(memberData: Partial<Member>): Promise<MembersApiResponse<Member>> {
    try {
      logger.info('🔄 Creating new member:', memberData);

      // Generate membership number if not provided
      const membershipNumber =
        memberData.membership_number || (await this.generateMembershipNumber());

      const { data: newMember, error } = await supabase
        .from('members')
        .insert([
          {
            name: memberData.name!,
            surname: memberData.surname!,
            email: memberData.email!,
            phone: memberData.phone,
            avatar_url: memberData.avatar_url,
            address: memberData.address,
            city: memberData.city,
            district: memberData.district,
            postal_code: memberData.postal_code,
            country: memberData.country || 'Türkiye',
            birth_date: memberData.birth_date,
            gender: memberData.gender,
            marital_status: memberData.marital_status,
            occupation: memberData.occupation,
            employer: memberData.employer,
            membership_type: memberData.membership_type || 'standard',
            membership_number: membershipNumber,
            join_date: memberData.join_date || new Date().toISOString().split('T')[0],
            membership_status: memberData.membership_status || 'pending',
            expiry_date: memberData.expiry_date,
            annual_fee: memberData.annual_fee,
            fee_paid: memberData.fee_paid || false,
            payment_method: memberData.payment_method,
            profession: memberData.profession,
            specialization: memberData.specialization,
            experience_years: memberData.experience_years,
            education_level: memberData.education_level,
            certifications: memberData.certifications,
            languages: memberData.languages,
            preferred_contact_method: memberData.preferred_contact_method,
            newsletter_subscription: memberData.newsletter_subscription !== false,
            event_notifications: memberData.event_notifications !== false,
            marketing_consent: memberData.marketing_consent || false,
            emergency_contact_name: memberData.emergency_contact_name,
            emergency_contact_phone: memberData.emergency_contact_phone,
            emergency_contact_relation: memberData.emergency_contact_relation,
            committee_memberships: memberData.committee_memberships,
            volunteer_interests: memberData.volunteer_interests,
            leadership_positions: memberData.leadership_positions,
            skills_and_expertise: memberData.skills_and_expertise,
            event_attendance_count: memberData.event_attendance_count || 0,
            volunteer_hours: memberData.volunteer_hours || 0,
            contribution_amount: memberData.contribution_amount || 0,
            notes: memberData.notes,
            special_requirements: memberData.special_requirements,
            dietary_restrictions: memberData.dietary_restrictions,
            accessibility_needs: memberData.accessibility_needs,
            source: memberData.source,
            referral_code: memberData.referral_code,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating member:', error);
        return { error: error.message };
      }

      logger.info('✅ Successfully created member:', newMember?.name);
      return { data: newMember };
    } catch (error: any) {
      logger.error('❌ Unexpected error in createMember:', error);
      return { error: error.message || 'Üye oluşturulamadı' };
    }
  }

  // Update member
  async updateMember(id: number, updates: Partial<Member>): Promise<MembersApiResponse<Member>> {
    try {
      logger.info('🔄 Updating member:', id, updates);

      const { data, error } = await supabase
        .from('members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error updating member:', error);
        return { error: error.message };
      }

      logger.info('✅ Successfully updated member:', data?.name);
      return { data };
    } catch (error: any) {
      logger.error('❌ Unexpected error in updateMember:', error);
      return { error: error.message || 'Üye güncellenemedi' };
    }
  }

  // Delete member
  async deleteMember(id: number): Promise<MembersApiResponse<boolean>> {
    try {
      logger.info('🔄 Deleting member:', id);

      const { error } = await supabase.from('members').delete().eq('id', id);

      if (error) {
        logger.error('❌ Error deleting member:', error);
        return { error: error.message };
      }

      logger.info('✅ Successfully deleted member:', id);
      return { data: true };
    } catch (error: any) {
      logger.error('❌ Unexpected error in deleteMember:', error);
      return { error: error.message || 'Üye silinemedi' };
    }
  }

  // Generate unique membership number
  private async generateMembershipNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('membership_number')
        .order('membership_number', { ascending: false })
        .limit(1);

      if (error) {
        logger.error('❌ Error generating membership number:', error);
        return `UYE-${Date.now()}`;
      }

      if (data && data.length > 0) {
        const lastNumber = data[0]?.membership_number;
        const match = lastNumber.match(/UYE-(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          return `UYE-${nextNumber.toString().padStart(4, '0')}`;
        }
      }

      return 'UYE-0001';
    } catch (error) {
      logger.error('❌ Error in generateMembershipNumber:', error);
      return `UYE-${Date.now()}`;
    }
  }

  // Bulk update membership status
  async bulkUpdateStatus(ids: number[], status: string): Promise<MembersApiResponse<boolean>> {
    try {
      logger.info('🔄 Bulk updating member status:', ids, status);

      const { error } = await supabase
        .from('members')
        .update({
          membership_status: status,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) {
        logger.error('❌ Error bulk updating member status:', error);
        return { error: error.message };
      }

      logger.info('✅ Successfully bulk updated', ids.length, 'members');
      return { data: true };
    } catch (error: any) {
      logger.error('❌ Unexpected error in bulkUpdateStatus:', error);
      return { error: error.message || 'Toplu güncelleme başarısız' };
    }
  }

  // Export members to CSV
  async exportMembers(filters: MembersFilters = {}): Promise<MembersApiResponse<Member[]>> {
    try {
      logger.info('🔄 Exporting members with filters:', filters);

      let query = supabase.from('members').select('*');

      // Apply same filters as getMembers but without pagination
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        query = query.or(
          `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,membership_number.ilike.%${term}%`,
        );
      }

      if (filters.membershipStatus && filters.membershipStatus !== 'all') {
        query = query.eq('membership_status', filters.membershipStatus);
      }

      if (filters.membershipType && filters.membershipType !== 'all') {
        query = query.eq('membership_type', filters.membershipType);
      }

      if (filters.city && filters.city !== 'all') {
        query = query.eq('city', filters.city);
      }

      if (filters.profession && filters.profession !== 'all') {
        query = query.eq('profession', filters.profession);
      }

      if (filters.dateFrom) {
        query = query.gte('join_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('join_date', filters.dateTo);
      }

      query = query.order('join_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Error exporting members:', error);
        return { error: error.message };
      }

      logger.info('✅ Successfully exported', data?.length || 0, 'members');
      return { data: data || [] };
    } catch (error: any) {
      logger.error('❌ Unexpected error in exportMembers:', error);
      return { error: error.message || 'Dışa aktarma başarısız' };
    }
  }

  // Search members for autocomplete
  async searchMembers(searchTerm: string, limit = 10): Promise<MembersApiResponse<Member[]>> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, membership_number, membership_status')
        .or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,membership_number.ilike.%${searchTerm}%`,
        )
        .limit(limit)
        .order('name');

      if (error) {
        return { error: error.message };
      }

      return { data: (data || []) as Member[] };
    } catch (error: any) {
      return { error: error.message || 'Arama başarısız' };
    }
  }
}

// Singleton instance
export const membersService = new MembersService();

// Default export
export default membersService;
