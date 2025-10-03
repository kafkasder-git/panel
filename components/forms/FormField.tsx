/**
 * @fileoverview FormField Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { forwardRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import type { ValidationError, ValidationWarning } from '../../types/validation';

/**
 * FormFieldProps Interface
 *
 * @interface FormFieldProps
 */
export interface FormFieldProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'time'
    | 'url'
    | 'search';
  variant?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch' | 'file';
  value?: any;
  defaultValue?: any;
  options?: { value: string; label: string; disabled?: boolean }[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  rows?: number;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  description?: string;
  tooltip?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  touched?: boolean;
  dirty?: boolean;
  isValidating?: boolean;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  children?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  (
    {
      id,
      name,
      label,
      placeholder,
      type = 'text',
      variant = 'input',
      value,
      defaultValue: _defaultValue,
      options,
      required,
      disabled,
      readOnly,
      autoFocus,
      autoComplete,
      rows = 3,
      className: _className,
      containerClassName,
      labelClassName,
      inputClassName,
      errorClassName,
      description,
      tooltip: _tooltip,
      prefix,
      suffix,
      errors = [],
      warnings = [],
      touched = false,
      dirty: _dirty = false,
      isValidating = false,
      showValidationIcon = true,
      onChange,
      onBlur,
      onFocus,
      children,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const hasError = errors.length > 0;
    const hasWarning = warnings.length > 0 && !hasError;
    const isValid = touched && !hasError && !isValidating && value;

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const handleChange = (newValue: any) => {
      onChange?.(newValue);
    };

    const renderValidationIcon = () => {
      if (!showValidationIcon) return null;

      if (isValidating) {
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      }

      if (hasError) {
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      }

      if (isValid) {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }

      return null;
    };

    const renderInput = () => {
      const baseInputProps = {
        id,
        name,
        placeholder,
        disabled,
        readOnly,
        autoFocus,
        autoComplete,
        value: value ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          handleChange(e.target.value);
        },
        onFocus: handleFocus,
        onBlur: handleBlur,
        className: cn(
          'transition-all duration-200',
          hasError && 'border-red-300 focus:border-red-400 focus:ring-red-200',
          hasWarning && 'border-amber-300 focus:border-amber-400 focus:ring-amber-200',
          isValid && 'border-green-300 focus:border-green-400 focus:ring-green-200',
          disabled && 'opacity-50 cursor-not-allowed',
          inputClassName,
        ),
        'aria-invalid': hasError,
        'aria-describedby': hasError ? `${id}-error` : undefined,
        ...props,
      };

      switch (variant) {
        case 'textarea':
          return (
            <Textarea
              {...baseInputProps}
              rows={rows}
              ref={ref as React.RefObject<HTMLTextAreaElement>}
            />
          );

        case 'select':
          return (
            <Select value={value ?? ''} onValueChange={handleChange} disabled={disabled}>
              <SelectTrigger
                className={cn(
                  'transition-all duration-200',
                  hasError && 'border-red-300 focus:border-red-400 focus:ring-red-200',
                  hasWarning && 'border-amber-300 focus:border-amber-400 focus:ring-amber-200',
                  isValid && 'border-green-300 focus:border-green-400 focus:ring-green-200',
                  inputClassName,
                )}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={id}
                name={name}
                checked={Boolean(value)}
                onCheckedChange={handleChange}
                disabled={disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn(
                  hasError && 'border-red-300 data-[state=checked]:bg-red-500',
                  inputClassName,
                )}
              />
              {label && (
                <Label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-medium cursor-pointer',
                    disabled && 'opacity-50 cursor-not-allowed',
                    labelClassName,
                  )}
                >
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
            </div>
          );

        case 'radio':
          return (
            <RadioGroup
              value={value ?? ''}
              onValueChange={handleChange}
              disabled={disabled}
              className="flex flex-col space-y-2"
            >
              {options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${id}-${option.value}`}
                    disabled={option.disabled}
                    className={cn(hasError && 'border-red-300 text-red-500', inputClassName)}
                  />
                  <Label
                    htmlFor={`${id}-${option.value}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );

        case 'switch':
          return (
            <div className="flex items-center space-x-2">
              <Switch
                id={id}
                name={name}
                checked={Boolean(value)}
                onCheckedChange={handleChange}
                disabled={disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={inputClassName}
              />
              {label && (
                <Label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-medium cursor-pointer',
                    disabled && 'opacity-50 cursor-not-allowed',
                    labelClassName,
                  )}
                >
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
            </div>
          );

        case 'file':
          return (
            <Input
              {...baseInputProps}
              type="file"
              onChange={(e) => {
                handleChange(e.target.files);
              }}
              ref={ref as React.RefObject<HTMLInputElement>}
            />
          );

        default:
          // Regular input with password toggle support
          return (
            <div className="relative">
              <Input
                {...baseInputProps}
                type={type === 'password' && showPassword ? 'text' : type}
                ref={ref as React.RefObject<HTMLInputElement>}
                className={cn(
                  ((prefix ?? suffix) || type === 'password' || showValidationIcon) && 'pr-10',
                  prefix && 'pl-10',
                )}
              />

              {/* Prefix */}
              {prefix && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  {prefix}
                </div>
              )}

              {/* Password toggle, suffix, or validation icon */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {type === 'password' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 hover:bg-transparent"
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                )}

                {suffix && <div className="text-slate-500">{suffix}</div>}
                {renderValidationIcon()}
              </div>
            </div>
          );
      }
    };

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && variant !== 'checkbox' && variant !== 'switch' && (
          <Label
            htmlFor={id}
            className={cn(
              'text-sm font-medium text-slate-700 block',
              required && "after:content-['*'] after:text-red-500 after:ml-1",
              disabled && 'opacity-50',
              labelClassName,
            )}
          >
            {label}
          </Label>
        )}

        {/* Input */}
        <div className="relative">
          {renderInput()}

          {/* Focus ring animation */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'absolute inset-0 rounded-md pointer-events-none',
                  hasError
                    ? 'ring-2 ring-red-200'
                    : hasWarning
                      ? 'ring-2 ring-amber-200'
                      : 'ring-2 ring-blue-200',
                )}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Description */}
        {description && <p className="text-sm text-slate-600">{description}</p>}

        {/* Validation Messages */}
        <AnimatePresence mode="wait">
          {hasError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn('space-y-1', errorClassName)}
            >
              {errors.map((error, index) => (
                <div
                  key={index}
                  id={`${id}-error`}
                  className="flex items-center gap-2 text-sm text-red-600"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error.message}</span>
                </div>
              ))}
            </motion.div>
          )}

          {hasWarning && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{warning.message}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Children (for additional content) */}
        {children}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
