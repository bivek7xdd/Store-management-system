import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { ValidationError } from '@/types/enhanced-signup';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: ValidationError;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  isPasswordVisible?: boolean;
  helperText?: string;
  required?: boolean;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    label,
    icon: Icon,
    error,
    showPasswordToggle = false,
    onTogglePassword,
    isPasswordVisible = false,
    helperText,
    required = false,
    className = '',
    type,
    ...props
  }, ref) => {
    const hasError = !!error;
    const inputType = showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={props.id || props.name}
            className="text-[#8F8F8F] text-[12px] font-normal uppercase tracking-[1px]"
          >
            {label}
            {required && <span className="text-[#DA291C] ml-1">*</span>}
          </Label>
        </div>

        <div className="relative">
          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            className={`w-full h-[44px] bg-transparent border ${
              hasError ? 'border-[#F13A2C] focus:border-[#F13A2C] focus:ring-[#F13A2C]/50' : 'border-[#CCCCCC] focus:border-[#1EAEDB] focus:ring-[#1EAEDB]/50'
            } rounded-[2px] ${Icon ? 'pl-10' : 'pl-3'} ${
              showPasswordToggle ? 'pr-10' : 'pr-3'
            } text-[16px] text-white placeholder:text-[#666666] transition-all focus:outline-none focus:ring-2 ${className}`}
            {...props}
          />

          {/* Icon */}
          {Icon && (
            <Icon
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                hasError ? 'text-[#F13A2C]' : 'text-[#666666]'
              }`}
            />
          )}

          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
            >
              {isPasswordVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <div className="flex items-start gap-3 p-3 bg-[#F13A2C]/10 border-l-2 border-[#F13A2C] mt-2">
            <span className="text-[#F13A2C] text-[13px] tracking-[0.195px]">{error.message}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !hasError && (
          <p className="text-[13px] text-[#8F8F8F] tracking-[0.195px] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;