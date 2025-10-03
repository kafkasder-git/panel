/**
 * @fileoverview ResponsiveCard Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { forwardRef } from 'react';
import { cn } from './ui/utils';
import { Card } from './ui/card';
import { motion } from 'motion/react';

interface ResponsiveCardProps {
  variant?: 'default' | 'mobile' | 'compact';
  hoverable?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ResponsiveCard = forwardRef<HTMLDivElement, ResponsiveCardProps>(
  (
    { className, variant = 'default', hoverable = false, interactive = false, children, ...props },
    ref,
  ) => {
    const baseClasses = cn(
      'transition-all duration-200',
      // Responsive padding
      variant === 'mobile' && 'p-3 sm:p-4 md:p-6',
      variant === 'compact' && 'p-2 sm:p-3',
      variant === 'default' && 'p-4 sm:p-6',
      // Hover effects
      hoverable && 'hover:shadow-lg hover:-translate-y-1',
      // Interactive states
      interactive && 'cursor-pointer hover:bg-slate-50 active:scale-95',
      className,
    );

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Card className={baseClasses} {...props}>
            {children}
          </Card>
        </motion.div>
      );
    }

    return (
      <Card ref={ref} className={baseClasses} {...props}>
        {children}
      </Card>
    );
  },
);

ResponsiveCard.displayName = 'ResponsiveCard';

// Grid wrapper for responsive card layouts
interface ResponsiveCardGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * ResponsiveCardGrid function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function ResponsiveCardGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
}: ResponsiveCardGridProps) {
  const gridClasses = cn(
    'grid',
    // Grid columns responsive
    cols.default === 1 && 'grid-cols-1',
    cols.default === 2 && 'grid-cols-2',
    cols.default === 3 && 'grid-cols-3',
    cols.default === 4 && 'grid-cols-4',
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    // Gap sizes
    gap === 'sm' && 'gap-3 sm:gap-4',
    gap === 'md' && 'gap-4 sm:gap-6',
    gap === 'lg' && 'gap-6 sm:gap-8',
    className,
  );

  return <div className={gridClasses}>{children}</div>;
}

// Info card specifically for mobile optimization
interface MobileInfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  badge?: string | number;
  color?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * MobileInfoCard function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function MobileInfoCard({
  icon,
  title,
  value,
  badge,
  color = 'text-primary',
  onClick,
  className,
}: MobileInfoCardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <ResponsiveCard
      variant="mobile"
      interactive={isInteractive}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden',
        // Mobile optimized sizing
        'min-h-[100px] sm:min-h-[120px]',
        'w-full',
        className,
      )}
    >
      {/* Background pattern for visual interest */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
        <div className={cn('w-full h-full', color.replace('text-', 'bg-'))}>{icon}</div>
      </div>

      <div className="relative flex flex-col h-full">
        {/* Icon and Badge */}
        <div className="flex items-start justify-between mb-2">
          <div className={cn('p-2 rounded-lg bg-slate-50', color)}>{icon}</div>
          {badge && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{value}</div>
          <div className="text-sm text-slate-600 font-medium">{title}</div>
        </div>
      </div>
    </ResponsiveCard>
  );
}

// Touch-friendly button card for mobile actions
interface TouchActionCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

/**
 * TouchActionCard function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function TouchActionCard({
  icon,
  title,
  description,
  onClick,
  variant = 'primary',
  className,
}: TouchActionCardProps) {
  const variantClasses = {
    primary: 'border-primary/20 hover:border-primary/40 hover:bg-primary/5',
    secondary: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
    success: 'border-green-200 hover:border-green-300 hover:bg-green-50',
    warning: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50',
    danger: 'border-red-200 hover:border-red-300 hover:bg-red-50',
  };

  const iconColors = {
    primary: 'text-primary',
    secondary: 'text-slate-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full p-6 rounded-xl border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        'min-h-[88px]', // Touch-friendly minimum height
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn('text-xl', iconColors[variant])}>{icon}</div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-slate-900 mb-1">{title}</div>
          {description && <div className="text-sm text-slate-600">{description}</div>}
        </div>
        <div className="text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.button>
  );
}
