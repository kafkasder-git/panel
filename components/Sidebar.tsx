/**
 * @fileoverview Sidebar Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import {
  BarChart3,
  Building2,
  Calendar,
  GraduationCap,
  Heart,
  HelpingHand,
  Home,
  MessageSquare,
  Scale,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';
// Auth imports removed for simplified implementation
// useNotificationStore removed - no more fake notification badges

interface Module {
  id: string;
  name: string;
  icon: React.ReactNode;
  subPages: { name: string; href: string }[];
  badge?: number;
}

// Permission mapping removed - all modules accessible

// Static modules array removed - using dynamicModules only

interface SidebarProps {
  activeModule?: string;
  onModuleChange?: (moduleId: string) => void;
  onSubPageChange?: (href: string) => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToUserManagement?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

/**
 * Sidebar function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function Sidebar({
  activeModule = 'genel',
  onModuleChange,
  onSubPageChange,
  onNavigateToUserManagement,
  isMobileOpen = false,
  onMobileToggle,
}: SidebarProps) {
  // Auth removed for simplified implementation
  // notificationStore removed - no more fake notification badges
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [isPopoverHovered, setIsPopoverHovered] = useState(false);

  // Auth context for permission checks
  const { user } = useSupabaseAuth();

  // Permission checks
  const canViewReports =
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.role === 'operator' ||
    user?.role === 'viewer';

  // Dynamic modules with notification badges - CLEANED UP
  const dynamicModules: Module[] = [
    {
      id: 'genel',
      name: 'Ana Sayfa',
      icon: <Home className="h-5 w-5" />,
      subPages: [{ name: 'Dashboard', href: '/dashboard' }],
      // badge removed - no unnecessary notifications
    },
    {
      id: 'bagis',
      name: 'Bağışlar',
      icon: <Heart className="h-5 w-5" />,
      subPages: [
        { name: 'Bağış Listesi', href: '/bagis/liste' },
        { name: 'Bağış Raporları', href: '/bagis/raporlar' },
        { name: 'Kumbara Takibi', href: '/bagis/kumbara' },
      ],
      // badge: 3 removed - no fake notification
    },
    {
      id: 'uye',
      name: 'Üyeler',
      icon: <Users className="h-5 w-5" />,
      subPages: [
        { name: 'Üye Listesi', href: '/uye/liste' },
        { name: 'Aidat Takibi', href: '/uye/aidat' },
        { name: 'Yeni Üye', href: '/uye/yeni' },
      ],
    },
    {
      id: 'yardim',
      name: 'Yardım',
      icon: <HelpingHand className="h-5 w-5" />,
      subPages: [
        { name: 'İhtiyaç Sahipleri', href: '/yardim/ihtiyac-sahipleri' },
        { name: 'Başvurular', href: '/yardim/basvurular' },
        { name: 'Yardım Listesi', href: '/yardim/liste' },
        { name: 'Nakit Yardım Vezne', href: '/yardim/nakdi-vezne' },
        { name: 'Banka Ödeme Emirleri', href: '/yardim/banka-odeme' },
        { name: 'Nakit Yardım İşlemleri', href: '/yardim/nakdi-islemler' },
        { name: 'Ayni Yardım İşlemleri', href: '/yardim/ayni-islemler' },
        { name: 'Hizmet Takibi', href: '/yardim/hizmet-takip' },
        { name: 'Hastane Sevk', href: '/yardim/hastane-sevk' },
        { name: 'Envanter Yönetimi', href: '/yardim/envanter' },
      ],
    },
    {
      id: 'burs',
      name: 'Burs',
      icon: <GraduationCap className="h-5 w-5" />,
      subPages: [
        { name: 'Öğrenci Listesi', href: '/burs/ogrenciler' },
        { name: 'Burs Başvuruları', href: '/burs/basvurular' },
      ],
    },
    {
      id: 'fon',
      name: 'Fon',
      icon: <Wallet className="h-5 w-5" />,
      subPages: [
        { name: 'Gelir Gider', href: '/fon/gelir-gider' },
        { name: 'Raporlar', href: '/fon/raporlar' },
      ],
    },
    {
      id: 'mesaj',
      name: 'Mesaj',
      icon: <MessageSquare className="h-5 w-5" />,
      subPages: [
        { name: 'Toplu Mesaj', href: '/mesaj/toplu' },
        { name: 'Kurum İçi Mesajlaşma', href: '/mesaj/kurum-ici' },
      ],
    },
    {
      id: 'is',
      name: 'İş',
      icon: <Calendar className="h-5 w-5" />,
      subPages: [
        { name: 'Etkinlikler', href: '/is/etkinlikler' },
        { name: 'Toplantılar', href: '/is/toplantilar' },
        { name: 'Görevlerim', href: '/is/gorevler' },
      ],
    },
    {
      id: 'partner',
      name: 'Partner Yönetimi',
      icon: <Building2 className="h-5 w-5" />,
      subPages: [
        { name: 'Tüm Partnerler', href: '/partner/liste' },
        { name: 'Bağışçı Kurumlar', href: '/partner/bagiscilar' },
        { name: 'Devlet Kurumları', href: '/partner/kurumlar' },
        { name: 'Tedarikçiler', href: '/partner/tedarikci' },
        { name: 'Sponsor Kuruluşlar', href: '/partner/sponsorlar' },
        { name: 'İş Birliği Anlaşmaları', href: '/partner/anlasmalar' },
        { name: 'Diğer Dernekler', href: '/partner/dernekler' },
      ],
      // badge: 2 removed - no fake notification
    },
    {
      id: 'hukuki',
      name: 'Hukuki Yardım',
      icon: <Scale className="h-5 w-5" />,
      subPages: [
        { name: 'Hukuki Danışmanlık', href: '/hukuki/danismanlik' },
        { name: 'Avukat Atamaları', href: '/hukuki/avukatlar' },
        { name: 'Dava Takipleri', href: '/hukuki/davalar' },
        { name: 'Hukuki Belgeler', href: '/hukuki/belgeler' },
        { name: 'Hukuki Raporlar', href: '/hukuki/raporlar' },
      ],
      // badge: 1 removed - no fake notification
    },
    {
      id: 'user-management',
      name: 'Kullanıcı Yönetimi',
      icon: <Shield className="h-5 w-5" />,
      subPages: [
        { name: 'Kullanıcılar', href: '/user-management/users' },
        { name: 'Roller', href: '/user-management/roles' },
        { name: 'İzinler', href: '/user-management/permissions' },
      ],
    },
    // Conditionally show reporting module based on permissions
    ...(canViewReports
      ? [
          {
            id: 'raporlama',
            name: 'Raporlama & Analitik',
            icon: <BarChart3 className="h-5 w-5" />,
            subPages: [
              { name: 'Ana Dashboard', href: '/raporlama/dashboard' },
              { name: 'Mali Raporlar', href: '/raporlama/mali' },
              { name: 'Bağış Analitiği', href: '/raporlama/bagis' },
              { name: 'Üye Analitiği', href: '/raporlama/uye' },
              { name: 'Sosyal Etki', href: '/raporlama/etki' },
              { name: 'Rapor Oluşturucu', href: '/raporlama/builder' },
              { name: 'Zamanlanmış Raporlar', href: '/raporlama/zamanli' },
            ],
          },
        ]
      : []),
  ];

  // Timing refs for better control
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
      if (popoverLeaveTimeoutRef.current) clearTimeout(popoverLeaveTimeoutRef.current);
    };
  }, []);

  const handleModuleMouseEnter = (moduleId: string) => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (popoverLeaveTimeoutRef.current) {
      clearTimeout(popoverLeaveTimeoutRef.current);
      popoverLeaveTimeoutRef.current = null;
    }

    setHoveredModule(moduleId);

    // Delay before opening popover for smoother experience
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenPopover(moduleId);
    }, 150); // Short delay to prevent accidental opens
  };

  const handleModuleMouseLeave = () => {
    // Clear hover timeout if mouse leaves before delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setHoveredModule(null);

    // Delay before closing to allow mouse to move to popover
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isPopoverHovered) {
        setOpenPopover(null);
      }
    }, 100); // Quick delay to allow moving to popover
  };

  const handlePopoverMouseEnter = () => {
    // Clear any pending close timeout when entering popover
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (popoverLeaveTimeoutRef.current) {
      clearTimeout(popoverLeaveTimeoutRef.current);
      popoverLeaveTimeoutRef.current = null;
    }

    setIsPopoverHovered(true);
  };

  const handlePopoverMouseLeave = () => {
    setIsPopoverHovered(false);

    // Close popover after a short delay
    popoverLeaveTimeoutRef.current = setTimeout(() => {
      setOpenPopover(null);
    }, 150);
  };

  const handleModuleClick = (moduleId: string) => {
    // On click, immediately show popover and keep it open
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    if (popoverLeaveTimeoutRef.current) clearTimeout(popoverLeaveTimeoutRef.current);

    setOpenPopover(openPopover === moduleId ? null : moduleId);
    setHoveredModule(moduleId);
  };

  const handleSubPageClick = (href: string, moduleId: string) => {
    // Special handling for user management module
    if (moduleId === 'user-management') {
      onNavigateToUserManagement?.();
    } else {
      onModuleChange?.(moduleId);
      onSubPageChange?.(href);
    }

    // Close popover after selection
    setOpenPopover(null);
    setHoveredModule(null);
    setIsPopoverHovered(false);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const popoverElement = target.closest('[data-radix-popper-content-wrapper]');
      const triggerElement = target.closest('[data-sidebar-trigger]');

      if (!popoverElement && !triggerElement) {
        setOpenPopover(null);
        setHoveredModule(null);
        setIsPopoverHovered(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={500}>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black md:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden h-full w-20 flex-col border-r border-gray-800 bg-gray-900 md:flex ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 !flex w-64' : ''} `}
      >
        {/* Navigation Icons */}
        <div className="flex-1 px-2 pt-6">
          <div className="space-y-2">
            {dynamicModules.map((module) => (
              <div
                key={module.id}
                className="relative"
                onMouseEnter={() => {
                  handleModuleMouseEnter(module.id);
                }}
                onMouseLeave={handleModuleMouseLeave}
              >
                <Popover
                  open={openPopover === module.id}
                  onOpenChange={(open: boolean) => {
                    if (!open) {
                      setOpenPopover(null);
                      setIsPopoverHovered(false);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <div data-sidebar-trigger>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              handleModuleClick(module.id);
                            }}
                            className={cn(
                              'group relative flex w-full items-center justify-center rounded-lg p-4 transition-all duration-200',
                              activeModule === module.id
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
                              hoveredModule === module.id &&
                                activeModule !== module.id &&
                                'bg-gray-800',
                            )}
                          >
                            <div className="relative flex-shrink-0">
                              {module.icon}
                              {module.badge && (
                                <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-blue-500 p-0 text-xs text-white">
                                  {module.badge}
                                </Badge>
                              )}
                            </div>

                            {activeModule === module.id && (
                              <div className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={8}
                          className="border border-gray-700 bg-gray-800 text-white"
                        >
                          <p className="font-medium">{module.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </PopoverTrigger>

                  <PopoverContent
                    side="right"
                    align="start"
                    className="animate-in slide-in-from-left-2 fade-in-0 ml-3 w-auto border border-gray-200 bg-white p-0 duration-200"
                    sideOffset={8}
                    onMouseEnter={handlePopoverMouseEnter}
                    onMouseLeave={handlePopoverMouseLeave}
                    onInteractOutside={(e: Event) => {
                      // Prevent closing when clicking on trigger
                      const target = e.target as Element;
                      const isTrigger = target.closest('[data-sidebar-trigger]');
                      if (isTrigger) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="min-w-[220px] overflow-hidden rounded-lg">
                      {/* Header */}
                      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                        <h4 className="flex items-center gap-2 font-semibold text-gray-800">
                          {module.icon}
                          {module.name}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {module.subPages.length} seçenek
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-1 p-2">
                        {module.subPages.map((subPage, index) => (
                          <button
                            key={subPage.href}
                            onClick={() => {
                              handleSubPageClick(subPage.href, module.id);
                            }}
                            className={`group animate-in fade-in-0 slide-in-from-left-1 animate-fill-both flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 ${
                              index === 0
                                ? 'animate-delay-0'
                                : index === 1
                                  ? 'animate-delay-50'
                                  : index === 2
                                    ? 'animate-delay-100'
                                    : index === 3
                                      ? 'animate-delay-150'
                                      : index === 4
                                        ? 'animate-delay-200'
                                        : index === 5
                                          ? 'animate-delay-250'
                                          : index === 6
                                            ? 'animate-delay-300'
                                            : index === 7
                                              ? 'animate-delay-350'
                                              : index === 8
                                                ? 'animate-delay-400'
                                                : index === 9
                                                  ? 'animate-delay-450'
                                                  : 'animate-delay-500'
                            }`}
                          >
                            <span className="font-medium">{subPage.name}</span>
                            <div className="h-1.5 w-1.5 transform rounded-full bg-gray-400 opacity-0 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
