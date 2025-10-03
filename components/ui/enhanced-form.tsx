/**
 * @fileoverview enhanced-form Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  FormProvider as ReactHookFormProvider,
  useFormContext,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import type { z } from 'zod';
import {
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Calendar,
  Phone,
  Save,
  X,
  Plus,
  Minus,
  Upload,
  Loader2,
} from 'lucide-react';

import { cn } from './utils';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch } from './switch';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar as CalendarComponent } from './calendar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { logger } from '../lib/logging/logger';
// Enhanced Form Context
interface EnhancedFormContextValue {
  formId: string;
  isSubmitting: boolean;
  isDirty: boolean;
  validationMode: 'onChange' | 'onBlur' | 'onSubmit';
  showValidationIcons: boolean;
  autoSave: boolean;
  compactMode: boolean;
}

const EnhancedFormContext = createContext<EnhancedFormContextValue | null>(null);

// Enhanced Form Provider
interface EnhancedFormProviderProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  showValidationIcons?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  compactMode?: boolean;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * EnhancedFormProvider function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function EnhancedFormProvider<T extends FieldValues = FieldValues>({
  form,
  onSubmit,
  children,
  className,
  validationMode = 'onChange',
  showValidationIcons = true,
  autoSave = false,
  autoSaveDelay = 2000,
  compactMode = false,
  title,
  description,
  actions,
}: EnhancedFormProviderProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const formId = useMemo(() => `form-${Math.random().toString(36).substr(2, 9)}`, []);

  const {
    watch,
    formState: { isDirty, errors },
  } = form;
  const watchedValues = watch();

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const timer = setTimeout(async () => {
      try {
        const isValid = await form.trigger();
        if (isValid) {
          await onSubmit(form.getValues());
          setLastSaved(new Date());
        }
      } catch (error) {
        logger.error('Auto-save failed:', error);
      }
    }, autoSaveDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [watchedValues, autoSave, autoSaveDelay, isDirty, form, onSubmit]);

  const handleSubmit = async (data: T) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      setLastSaved(new Date());
    } catch (error) {
      logger.error('Form submission failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue: EnhancedFormContextValue = {
    formId,
    isSubmitting,
    isDirty,
    validationMode,
    showValidationIcons,
    autoSave,
    compactMode,
  };

  return (
    <EnhancedFormContext.Provider value={contextValue}>
      <ReactHookFormProvider {...form}>
        <Card className={cn('w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm', className)}>
          {(title ?? (description || autoSave)) && (
            <CardHeader className={cn('pb-4', compactMode && 'pb-2')}>
              <div className="flex items-center justify-between">
                <div>
                  {title && (
                    <CardTitle className="text-xl font-semibold text-gray-900">{title}</CardTitle>
                  )}
                  {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
                </div>

                {autoSave && lastSaved && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Son kaydedilme: {format(lastSaved, 'HH:mm', { locale: tr })}</span>
                  </div>
                )}
              </div>

              {Object.keys(errors).length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    Lütfen formdaki hataları düzeltin.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
          )}

          <CardContent className={cn('space-y-6', compactMode && 'space-y-4')}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {children}

              {actions && (
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  {actions}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </ReactHookFormProvider>
    </EnhancedFormContext.Provider>
  );
}

// Enhanced Form Field Hook
export const useEnhancedForm = () => {
  const context = useContext(EnhancedFormContext);
  if (!context) {
    throw new Error('useEnhancedForm must be used within EnhancedFormProvider');
  }
  return context;
};

// Field Types
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'currency'
  | 'search'
  | 'custom';

/**
 * SelectOption Interface
 *
 * @interface SelectOption
 */
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * EnhancedFieldProps Interface
 *
 * @interface EnhancedFieldProps
 */
export interface EnhancedFieldProps {
  name: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options?: SelectOption[];
  validation?: z.ZodSchema;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  rows?: number;
  multiple?: boolean;
  accept?: string;
  min?: number | string;
  max?: number | string;
  step?: number;
  autoComplete?: string;
  onChange?: (value: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  render?: (field: any) => React.ReactNode;
}

// Enhanced Form Field Component
/**
 * EnhancedField function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function EnhancedField({
  name,
  type,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  readOnly = false,
  options = [],
  className,
  size = 'md',
  icon,
  prefix,
  suffix,
  rows = 3,
  multiple = false,
  accept,
  min,
  max,
  step,
  autoComplete,
  onChange,
  onFocus,
  onBlur,
  render,
}: EnhancedFieldProps) {
  const form = useFormContext();
  const enhancedForm = useEnhancedForm();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const field = form.register(name);
  const fieldState = form.formState.errors[name];
  const error = fieldState?.message;
  const invalid = Boolean(error);
  const isDirty = form.formState.dirtyFields[name];

  const sizeClasses = {
    sm: 'text-sm py-2',
    md: 'text-base py-3',
    lg: 'text-lg py-4',
  };

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
    field.onBlur();
  };

  const handleChange = (value: any) => {
    field.onChange(value);
    onChange?.(value);
  };

  const getValidationIcon = () => {
    if (!enhancedForm.showValidationIcons || !isDirty) return null;

    if (error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }

    if (!invalid && form.getValues(name)) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    return null;
  };

  const fieldId = `${enhancedForm.formId}-${name}`;

  // Custom render function
  if (render) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={fieldId} className="flex items-center gap-2">
            {icon}
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        {render(field)}
        {description && <p className="text-sm text-gray-600">{description}</p>}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error.message}
          </motion.p>
        )}
      </div>
    );
  }

  // Render different field types
  const renderField = () => {
    const baseInputProps = {
      ...field,
      id: fieldId,
      placeholder,
      disabled,
      readOnly,
      className: cn(
        'transition-all duration-200',
        sizeClasses[size],
        focused && 'ring-2 ring-blue-500 ring-offset-2',
        error && 'border-red-500 focus:border-red-500',
        !error && isDirty && 'border-green-500',
        icon && 'pl-10',
        (prefix ?? getValidationIcon()) && 'pl-8',
        (suffix ?? type === 'password') && 'pr-10',
      ),
      onFocus: handleFocus,
      onBlur: handleBlur,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(e.target.value);
      },
      autoComplete,
      min,
      max,
      step,
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...baseInputProps}
            rows={rows}
            onChange={(e) => {
              handleChange(e.target.value);
            }}
          />
        );

      case 'select':
        return (
          <Select
            value={form.getValues(name) || ''}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(sizeClasses[size], error && 'border-red-500')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={String(option.value)}
                  disabled={option.disabled}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500">{option.description}</div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={form.getValues(name) || false}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            {label && <Label htmlFor={fieldId}>{label}</Label>}
          </div>
        );

      case 'radio':
        return (
          <RadioGroup value={form.getValues(name)} onValueChange={handleChange} disabled={disabled}>
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={String(option.value)} id={`${fieldId}-${option.value}`} />
                <Label htmlFor={`${fieldId}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={form.getValues(name) || false}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            {label && <Label htmlFor={fieldId}>{label}</Label>}
          </div>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !form.getValues(name) && 'text-muted-foreground',
                  sizeClasses[size],
                  error && 'border-red-500',
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {form.getValues(name)
                  ? format(form.getValues(name), 'dd/MM/yyyy', { locale: tr })
                  : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={form.getValues(name)}
                onSelect={handleChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              ₺
            </span>
            <Input
              {...baseInputProps}
              type="number"
              className={cn(baseInputProps.className, 'pl-8')}
              onChange={(e) => {
                handleChange(parseFloat(e.target.value) || 0);
              }}
            />
          </div>
        );

      case 'phone':
        return (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              {...baseInputProps}
              type="tel"
              onChange={(e) => {
                // Turkish phone number formatting
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) value = value.slice(0, 10);
                handleChange(value);
              }}
            />
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <Input {...baseInputProps} type={showPassword ? 'text' : 'password'} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                setShowPassword(!showPassword);
              }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById(fieldId)?.click()}
              >
                <Upload className="w-4 h-4" />
                Dosya Seç
              </Button>
              {form.getValues(name) && (
                <span className="text-sm text-gray-600">
                  {Array.isArray(form.getValues(name))
                    ? `${form.getValues(name).length} dosya`
                    : form.getValues(name).name}
                </span>
              )}
            </div>
            <input
              id={fieldId}
              type="file"
              className="hidden"
              multiple={multiple}
              accept={accept}
              onChange={(e) => {
                const { files } = e.target;
                if (files) {
                  handleChange(multiple ? Array.from(files) : files[0]);
                }
              }}
            />
          </div>
        );

      default:
        return <Input {...baseInputProps} type={type} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-2', className)}
    >
      {label && type !== 'checkbox' && type !== 'switch' && (
        <Label htmlFor={fieldId} className="flex items-center gap-2 font-medium">
          {icon}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}

        {renderField()}

        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}

        {getValidationIcon() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {description && !error && (
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {description}
        </p>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error.message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Form Section Component
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

/**
 * FormSection function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: FormSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          {collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCollapsed(!collapsed);
              }}
            >
              {collapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </Button>
          )}
        </div>
      )}

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Form Actions
interface FormActionsProps {
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showCancel?: boolean;
  variant?: 'default' | 'split' | 'right';
  additionalActions?: React.ReactNode;
  className?: string;
}

/**
 * FormActions function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function FormActions({
  loading = false,
  submitLabel = 'Kaydet',
  cancelLabel = 'İptal',
  onCancel,
  showCancel = true,
  variant = 'right',
  additionalActions,
  className,
}: FormActionsProps) {
  const enhancedForm = useEnhancedForm();

  const submitButton = (
    <Button
      type="submit"
      disabled={loading ?? enhancedForm.isSubmitting}
      className="gap-2 min-w-24"
    >
      {(loading ?? enhancedForm.isSubmitting) ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {submitLabel}
    </Button>
  );

  const cancelButton = showCancel && (
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={loading ?? enhancedForm.isSubmitting}
    >
      <X className="w-4 h-4 mr-2" />
      {cancelLabel}
    </Button>
  );

  if (variant === 'split') {
    return (
      <div className={cn('flex justify-between items-center', className)}>
        <div className="flex gap-2">{additionalActions}</div>
        <div className="flex gap-2">
          {cancelButton}
          {submitButton}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex justify-end items-center gap-2', className)}>
      {additionalActions}
      {cancelButton}
      {submitButton}
    </div>
  );
}

// Export all components with unique names
export {
  EnhancedFormProvider as FormProvider,
  EnhancedField as Field,
  FormSection as EnhancedFormSection,
  FormActions as EnhancedFormActions,
};
