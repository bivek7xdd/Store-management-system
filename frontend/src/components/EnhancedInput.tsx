import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    const [isFocused, setIsFocused] = useState(false);
    
    const hasError = !!error;
    const inputType = showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;

    const getInputClasses = () => {
      const baseClasses = 'h-12 pl-12 pr-4 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 focus:bg-white/10 hover:bg-white/8';
      
      if (hasError) {
        return `${baseClasses} border-red-500/50 focus:border-red-500 focus:ring-red-500/20 focus:bg-red-500/5`;
      }
      
      if (isFocused) {
        return `${baseClasses} border-teal-500/50 shadow-lg shadow-teal-500/10`;
      }
      
      return baseClasses;
    };

    const getIconClasses = () => {
      if (hasError) {
        return 'text-red-400';
      }
      
      if (isFocused) {
        return 'text-teal-400';
      }
      
      return 'text-gray-400';
    };

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={props.id || props.name} 
          className="text-sm font-medium text-gray-200 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-400">*</span>}
        </Label>
        
        <div className="relative">
          {/* Icon */}
          {Icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <Icon className={`w-5 h-5 transition-all duration-300 ${getIconClasses()} ${isFocused ? 'scale-110' : ''}`} />
            </div>
          )}
          
          {/* Input */}
          <Input
            ref={ref}
            type={inputType}
            className={`${getInputClasses()} ${showPasswordToggle ? 'pr-12' : ''} ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 hover:scale-110 transition-all duration-200"
            >
              {isPasswordVisible ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        {/* Error Message */}
        {hasError && (
          <div className="flex items-start gap-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="flex-shrink-0 w-1 h-1 rounded-full bg-red-400 mt-2" />
            <span>{error.message}</span>
          </div>
        )}
        
        {/* Helper Text */}
        {helperText && !hasError && (
          <p className="text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;