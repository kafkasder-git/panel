/**
 * @fileoverview useMobileFormOptimized Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdvancedMobile } from './useAdvancedMobile';
import { usePerformanceOptimization } from './usePerformanceOptimization';

interface UseMobileFormProps {
  validateOnBlur?: boolean;
  submitOnEnter?: boolean;
  autosaveDelay?: number;
  enableHapticFeedback?: boolean;
}

interface MobileFormState {
  isKeyboardOpen: boolean;
  activeField: string | null;
  scrollPosition: number;
  formHeight: number;
  keyboardHeight: number;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: string) => string | null;
}

/**
 * useMobileFormOptimized function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function useMobileFormOptimized({
  validateOnBlur = true,
  submitOnEnter = false,
  autosaveDelay = 1000,
  enableHapticFeedback = true,
}: UseMobileFormProps = {}) {
  const {
    deviceInfo,
    optimizedSettings,
    triggerHapticFeedback,
    keyboardHeight,
    isKeyboardOpen: advancedKeyboardOpen,
    optimizeInputFocus,
  } = useAdvancedMobile();

  const { requestFrame } = usePerformanceOptimization();

  const [formState, setFormState] = useState<MobileFormState>({
    isKeyboardOpen: false,
    activeField: null,
    scrollPosition: 0,
    formHeight: 0,
    keyboardHeight: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout>();
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({});

  // Enhanced keyboard detection using advanced mobile hook
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      isKeyboardOpen: advancedKeyboardOpen,
      keyboardHeight,
    }));
  }, [advancedKeyboardOpen, keyboardHeight]);

  // Enhanced field validation with comprehensive rules
  const validateField = useCallback(
    (name: string, value: string, rules?: ValidationRule) => {
      if (!rules) return true;

      let errorMessage = '';

      // Required validation
      if (rules.required && !value.trim()) {
        errorMessage = 'Bu alan zorunludur';
      }
      // Length validations
      else if (rules.minLength && value.length < rules.minLength) {
        errorMessage = `En az ${rules.minLength} karakter olmalıdır`;
      } else if (rules.maxLength && value.length > rules.maxLength) {
        errorMessage = `En fazla ${rules.maxLength} karakter olmalıdır`;
      }
      // Email validation
      else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMessage = 'Geçerli bir e-posta adresi giriniz';
      }
      // Phone validation
      else if (rules.phone && value && !/^[+]?[\d\s\-()]{10,}$/.test(value.replace(/\s/g, ''))) {
        errorMessage = 'Geçerli bir telefon numarası giriniz';
      }
      // Pattern validation
      else if (rules.pattern && value && !rules.pattern.test(value)) {
        errorMessage = 'Geçersiz format';
      }
      // Custom validation
      else if (rules.custom && value) {
        const customError = rules.custom(value);
        if (customError) {
          errorMessage = customError;
        }
      }

      // Update errors state
      requestFrame(() => {
        if (errorMessage) {
          setErrors((prev) => ({ ...prev, [name]: errorMessage }));

          // Haptic feedback for validation errors
          if (enableHapticFeedback && deviceInfo.isMobile) {
            triggerHapticFeedback('medium');
          }
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
        }
      });

      return !errorMessage;
    },
    [requestFrame, enableHapticFeedback, deviceInfo.isMobile, triggerHapticFeedback],
  );

  // Enhanced field focus with mobile optimizations
  const handleFieldFocus = useCallback(
    (fieldName: string) => {
      const element = fieldRefs.current[fieldName];
      if (!element) return;

      requestFrame(() => {
        setFormState((prev) => ({
          ...prev,
          activeField: fieldName,
          scrollPosition: window.scrollY,
        }));

        // Mobile-specific optimizations
        if (deviceInfo.isMobile) {
          optimizeInputFocus(element);

          // Haptic feedback
          if (enableHapticFeedback) {
            triggerHapticFeedback('light');
          }
        }
      });
    },
    [
      requestFrame,
      deviceInfo.isMobile,
      optimizeInputFocus,
      enableHapticFeedback,
      triggerHapticFeedback,
    ],
  );

  // Enhanced field blur with validation
  const handleFieldBlur = useCallback(
    (fieldName: string, value: string, rules?: ValidationRule) => {
      requestFrame(() => {
        setTouched((prev) => ({ ...prev, [fieldName]: true }));

        if (validateOnBlur && rules) {
          validateField(fieldName, value, rules);
        }

        setFormState((prev) => ({
          ...prev,
          activeField: null,
        }));
      });
    },
    [requestFrame, validateOnBlur, validateField],
  );

  // Enhanced field change with optimized updates
  const handleFieldChange = useCallback(
    (fieldName: string, value: string, rules?: ValidationRule) => {
      // Update values immediately for better UX
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      // Clear errors on change (optimistic UX)
      if (errors[fieldName]) {
        requestFrame(() => {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        });
      }

      // Debounced autosave with performance optimization
      if (autosaveDelay > 0) {
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }

        autosaveTimeoutRef.current = setTimeout(() => {
          requestFrame(() => {
            // Trigger autosave event
            const event = new CustomEvent('form-autosave', {
              detail: { fieldName, value, timestamp: Date.now() },
            });
            document.dispatchEvent(event);
          });
        }, autosaveDelay);
      }
    },
    [errors, autosaveDelay, requestFrame],
  );

  // Enhanced input props with comprehensive mobile optimization
  const optimizeInputProps = useCallback(
    (fieldName: string, type = 'text', rules?: ValidationRule) => {
      const baseProps: any = {
        ref: (el: HTMLInputElement | HTMLTextAreaElement) => {
          if (el) fieldRefs.current[fieldName] = el;
        },
        name: fieldName,
        value: values[fieldName] || '',
        onFocus: () => {
          handleFieldFocus(fieldName);
        },
        onBlur: (e: any) => {
          handleFieldBlur(fieldName, e.target.value, rules);
        },
        onChange: (e: any) => {
          handleFieldChange(fieldName, e.target.value, rules);
        },
        'aria-invalid': Boolean(errors[fieldName]),
        'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined,
        className: `
        w-full min-h-[44px] px-3 py-2 border rounded-md
        focus:outline-none focus:ring-2 focus:ring-primary/20
        transition-colors duration-200
        ${
          errors[fieldName]
            ? 'border-red-500 focus:ring-red-200'
            : 'border-border focus:ring-primary/20'
        }
        ${deviceInfo.isMobile ? 'text-base' : ''}
      `.trim(),
      };

      // Mobile-specific optimizations
      if (deviceInfo.isMobile) {
        baseProps.autoComplete = 'on';
        baseProps.autoCorrect = type === 'text' ? 'on' : 'off';
        baseProps.autoCapitalize = type === 'email' ? 'none' : 'sentences';
        baseProps.spellCheck = type === 'text' || type === 'textarea';

        // Prevent iOS zoom
        if (deviceInfo.isIOS) {
          baseProps.style = { fontSize: '16px', ...baseProps.style };
        }

        // Enhanced input mode and type optimization
        switch (type) {
          case 'email':
            baseProps.inputMode = 'email';
            baseProps.type = 'email';
            baseProps.autoCapitalize = 'none';
            baseProps.autoCorrect = 'off';
            break;
          case 'tel':
          case 'phone':
            baseProps.inputMode = 'tel';
            baseProps.type = 'tel';
            baseProps.autoCapitalize = 'none';
            break;
          case 'number':
            baseProps.inputMode = 'numeric';
            baseProps.type = 'number';
            baseProps.pattern = '[0-9]*';
            break;
          case 'decimal':
            baseProps.inputMode = 'decimal';
            baseProps.type = 'number';
            baseProps.step = 'any';
            break;
          case 'search':
            baseProps.inputMode = 'search';
            baseProps.type = 'search';
            break;
          case 'url':
            baseProps.inputMode = 'url';
            baseProps.type = 'url';
            baseProps.autoCapitalize = 'none';
            baseProps.autoCorrect = 'off';
            break;
          case 'password':
            baseProps.type = 'password';
            baseProps.autoComplete = 'current-password';
            baseProps.autoCapitalize = 'none';
            baseProps.autoCorrect = 'off';
            break;
          case 'textarea':
            baseProps.rows = 3;
            baseProps.resize = 'vertical';
            break;
          default:
            baseProps.inputMode = 'text';
            baseProps.type = 'text';
        }

        // Enhanced keyboard behavior
        if (submitOnEnter && type !== 'textarea') {
          baseProps.onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const form = formRef.current;
              if (form) {
                const submitEvent = new Event('submit', { bubbles: true });
                form.dispatchEvent(submitEvent);
              }
            }
          };
        }
      }

      return baseProps;
    },
    [
      values,
      errors,
      handleFieldFocus,
      handleFieldBlur,
      handleFieldChange,
      deviceInfo.isMobile,
      deviceInfo.isIOS,
      submitOnEnter,
    ],
  );

  // Enhanced error retrieval
  const getFieldError = useCallback(
    (fieldName: string) => {
      return touched[fieldName] ? errors[fieldName] : undefined;
    },
    [touched, errors],
  );

  // Form validation helpers
  const validateForm = useCallback(
    (formData: Record<string, { value: string; rules?: ValidationRule }>) => {
      let isFormValid = true;

      Object.entries(formData).forEach(([fieldName, { value, rules }]) => {
        if (!validateField(fieldName, value, rules)) {
          isFormValid = false;
        }
      });

      return isFormValid;
    },
    [validateField],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  const isValid = Object.keys(errors).length === 0;
  const hasErrors = Object.keys(errors).length > 0;
  const hasValues = Object.keys(values).length > 0;

  return {
    // State
    formState,
    errors,
    touched,
    values,

    // Validation
    validateField,
    validateForm,
    isValid,
    hasErrors,
    hasValues,

    // Field helpers
    optimizeInputProps,
    getFieldError,

    // Refs
    formRef,
    fieldRefs,

    // Mobile-specific data
    isKeyboardOpen: formState.isKeyboardOpen,
    keyboardHeight: formState.keyboardHeight,
    activeField: formState.activeField,

    // Performance settings
    shouldReduceAnimations: !optimizedSettings.enableAnimations,
    adaptiveTimings: {
      animationDuration: optimizedSettings.animationDuration,
      debounceDelay: deviceInfo.isLowPowerMode ? autosaveDelay * 2 : autosaveDelay,
    },
  };
}
