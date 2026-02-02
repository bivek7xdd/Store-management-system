import React from 'react';
import { Check, X } from 'lucide-react';
import { PasswordRequirement } from '@/types/enhanced-signup';
import { getPasswordRequirements, calculatePasswordStrength } from '@/utils/signupValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = '',
}) => {
  const requirements = getPasswordRequirements(password);
  const strength = calculatePasswordStrength(password);
  
  const getStrengthColor = () => {
    switch (strength) {
      case 'weak':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'strong':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStrengthBarColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStrengthWidth = () => {
    const metCount = requirements.filter(req => req.met).length;
    return `${(metCount / requirements.length) * 100}%`;
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Password Strength</span>
          <span className={`text-sm font-medium capitalize ${getStrengthColor()}`}>
            {strength}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
            style={{ width: getStrengthWidth() }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <span className="text-sm text-gray-300">Requirements:</span>
        <div className="space-y-1">
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              className="flex items-center gap-2 text-sm"
            >
              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                requirement.met 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {requirement.met ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span className={requirement.met ? 'text-green-400' : 'text-gray-400'}>
                {requirement.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;