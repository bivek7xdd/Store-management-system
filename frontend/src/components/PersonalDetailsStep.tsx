import React from 'react';
import { User, Mail, Phone, Lock } from 'lucide-react';
import EnhancedInput from '@/components/EnhancedInput';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { EnhancedSignupFormData, ValidationErrors } from '@/types/enhanced-signup';

interface PersonalDetailsStepProps {
  formData: EnhancedSignupFormData;
  validationErrors: ValidationErrors;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onInputChange: (field: keyof EnhancedSignupFormData, value: string) => void;
  onTogglePassword: (field: 'password' | 'confirmPassword') => void;
  onFieldBlur?: (field: keyof EnhancedSignupFormData) => void;
}

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  formData,
  validationErrors,
  showPassword,
  showConfirmPassword,
  onInputChange,
  onTogglePassword,
  onFieldBlur,
}) => {
  const handleInputChange = (field: keyof EnhancedSignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onInputChange(field, e.target.value);
  };

  const handleInputBlur = (field: keyof EnhancedSignupFormData) => () => {
    if (onFieldBlur) {
      onFieldBlur(field);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[2px] bg-[#303030] mb-4">
          <User className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[20px] font-medium text-white mb-2 tracking-tight">
          Personal Details
        </h3>
        <p className="text-[#8F8F8F] text-[13px] tracking-[0.195px]">
          Let's start with your basic information
        </p>
      </div>

      <div className="space-y-5">
        {/* Full Name */}
        <EnhancedInput
          id="name"
          name="name"
          label="Full Name"
          icon={User}
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange('name')}
          onBlur={handleInputBlur('name')}
          error={validationErrors.name}
          required
          autoComplete="name"
        />

        {/* Email */}
        <EnhancedInput
          id="email"
          name="email"
          label="Email Address"
          icon={Mail}
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleInputChange('email')}
          onBlur={handleInputBlur('email')}
          error={validationErrors.email}
          required
          autoComplete="email"
        />

        {/* Phone */}
        <EnhancedInput
          id="phone"
          name="phone"
          label="Phone Number"
          icon={Phone}
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleInputChange('phone')}
          onBlur={handleInputBlur('phone')}
          error={validationErrors.phone}
          required
          autoComplete="tel"
        />

        {/* Password */}
        <div className="space-y-3">
          <EnhancedInput
            id="password"
            name="password"
            label="Password"
            icon={Lock}
            type="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleInputChange('password')}
            onBlur={handleInputBlur('password')}
            error={validationErrors.password}
            showPasswordToggle
            isPasswordVisible={showPassword}
            onTogglePassword={() => onTogglePassword('password')}
            required
            autoComplete="new-password"
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <PasswordStrengthIndicator
              password={formData.password}
              className="mt-3"
            />
          )}
        </div>

        {/* Confirm Password */}
        <EnhancedInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          icon={Lock}
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          onBlur={handleInputBlur('confirmPassword')}
          error={validationErrors.confirmPassword}
          showPasswordToggle
          isPasswordVisible={showConfirmPassword}
          onTogglePassword={() => onTogglePassword('confirmPassword')}
          required
          autoComplete="new-password"
        />
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-4 border border-[#303030] rounded-[2px] bg-[#181818]">
        <p className="text-[12px] text-center text-[#8F8F8F] uppercase tracking-[1px]">
          Your information is secure and will only be used to create your StoreHub account.
        </p>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;