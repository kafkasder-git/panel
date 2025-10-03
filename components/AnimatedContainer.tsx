/**
 * @fileoverview AnimatedContainer Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { logger } from '../lib/logging/logger';
interface AnimatedContainerProps {
  children: ReactNode;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'stagger';
  delay?: number;
  duration?: number;
  className?: string;
  staggerChildren?: number;
}

/**
 * AnimatedContainer function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function AnimatedContainer({
  children,
  variant = 'fadeIn',
  delay = 0,
  duration = 0.5,
  className = '',
  staggerChildren = 0.1,
}: AnimatedContainerProps) {
  const variants = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -30 },
    },
    slideDown: {
      initial: { opacity: 0, y: -30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 30 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -30 },
    },
    slideRight: {
      initial: { opacity: 0, x: -30 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 30 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },
    stagger: {
      animate: {
        transition: { staggerChildren },
      },
    },
  };

  const currentVariant = variants[variant];

  try {
    if (variant === 'stagger') {
      return (
        <motion.div
          className={className}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={currentVariant}
          transition={{ duration, delay }}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={currentVariant}
        transition={{
          duration,
          delay,
          ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth animations
        }}
      >
        {children}
      </motion.div>
    );
  } catch (error) {
    // Fallback to regular div if motion fails
    logger.warn('Motion animation failed, falling back to static content:', error);
    return <div className={className}>{children}</div>;
  }
}

// Specialized animation components
export const FadeIn = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <AnimatedContainer variant="fadeIn" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

export const SlideUp = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <AnimatedContainer variant="slideUp" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

export const SlideLeft = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <AnimatedContainer variant="slideLeft" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

export const ScaleIn = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <AnimatedContainer variant="scale" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

// Staggered animation for lists
export const StaggerContainer = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <AnimatedContainer variant="stagger" className={className}>
    {children}
  </AnimatedContainer>
);

export const StaggerItem = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={{
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

// Page transition wrapper
export const PageTransition = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    }}
  >
    {children}
  </motion.div>
);
