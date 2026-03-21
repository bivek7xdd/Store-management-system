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
        return '#dc2626';
      case 'medium':
        return '#d97706';
      case 'strong':
        return '#16a34a';
      default:
        return '#999';
    }
  };

  const getStrengthBarColor = () => {
    switch (strength) {
      case 'weak':
        return '#dc2626';
      case 'medium':
        return '#d97706';
      case 'strong':
        return '#16a34a';
      default:
        return '#ccc';
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
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Strength Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Password Strength</span>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              textTransform: 'capitalize',
              color: getStrengthColor(),
            }}
          >
            {strength}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            background: '#e5e0d1',
            borderRadius: '9999px',
            height: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '6px',
              borderRadius: '9999px',
              transition: 'all 0.3s ease',
              background: getStrengthBarColor(),
              width: getStrengthWidth(),
            }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>Requirements:</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: requirement.met
                    ? 'rgba(22, 163, 74, 0.12)'
                    : 'rgba(0, 0, 0, 0.04)',
                  color: requirement.met ? '#16a34a' : '#999',
                }}
              >
                {requirement.met ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span style={{ color: requirement.met ? '#16a34a' : '#999' }}>
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