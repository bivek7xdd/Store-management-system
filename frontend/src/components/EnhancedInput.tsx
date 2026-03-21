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
    const [isFocused, setIsFocused] = useState(false);

    const hasError = !!error;
    const inputType = showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={props.id || props.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: '#1a1a1a',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {label}
          {required && <span style={{ color: '#c4956a' }}>*</span>}
        </Label>

        <div style={{ position: 'relative' }}>
          {/* Icon */}
          {Icon && (
            <div
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                transition: 'all 0.25s ease',
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: hasError ? '#dc2626' : isFocused ? '#b89767' : '#999',
                  transition: 'color 0.25s ease',
                  transform: isFocused ? 'scale(1.05)' : 'scale(1)',
                }}
              />
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            style={{
              width: '100%',
              height: '3rem',
              paddingLeft: Icon ? '3rem' : '1rem',
              paddingRight: showPasswordToggle ? '3rem' : '1rem',
              background: 'rgba(255, 255, 255, 0.5)',
              border: `1px solid ${hasError ? 'rgba(220, 38, 38, 0.5)' : isFocused ? '#b89767' : '#d4cbb8'}`,
              borderRadius: '0.75rem',
              color: '#1a1a1a',
              fontSize: '0.9rem',
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
              transition: 'all 0.25s ease',
              boxShadow: hasError
                ? 'inset 0 2px 4px rgba(220,38,38,0.05), 0 0 0 3px rgba(220,38,38,0.1)'
                : isFocused
                ? 'inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 3px rgba(184, 151, 103, 0.15)'
                : 'inset 0 2px 4px rgba(0,0,0,0.02)',
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e as any);
            }}
            {...props}
          />

          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#999',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: '#dc2626',
              animation: 'slideDown 0.2s ease',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#dc2626',
                marginTop: '0.5rem',
              }}
            />
            <span>{error.message}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !hasError && (
          <p style={{ fontSize: '0.85rem', color: '#999' }}>{helperText}</p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;