import React from 'react';
import { Building2, MapPin, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedSignupFormData, ValidationErrors } from '@/types/enhanced-signup';

interface StoreInformationStepProps {
  formData: EnhancedSignupFormData;
  validationErrors: ValidationErrors;
  onInputChange: (field: keyof EnhancedSignupFormData, value: string) => void;
  onSelectChange: (field: keyof EnhancedSignupFormData, value: string) => void;
  onFieldBlur: (field: keyof EnhancedSignupFormData) => void;
}

const CURRENCIES = [
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

const inputStyle = (hasError: boolean, isFocused?: boolean): React.CSSProperties => ({
  width: '100%',
  height: '3rem',
  paddingLeft: '3rem',
  paddingRight: '1rem',
  background: 'rgba(255, 255, 255, 0.5)',
  border: `1px solid ${hasError ? 'rgba(220, 38, 38, 0.5)' : '#d4cbb8'}`,
  borderRadius: '0.75rem',
  color: '#1a1a1a',
  fontSize: '0.9rem',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  transition: 'all 0.25s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
});

const StoreInformationStep: React.FC<StoreInformationStepProps> = ({
  formData,
  validationErrors,
  onInputChange,
  onSelectChange,
  onFieldBlur,
}) => {
  return (
    <div className="step-container space-y-5">
      {/* Header */}
      <div className="text-center mb-4">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
          style={{ background: 'rgba(184, 151, 103, 0.12)' }}
        >
          <Building2 className="w-6 h-6" style={{ color: '#b89767' }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a', fontFamily: "'Playfair Display', serif" }}>
          Store Information
        </h3>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Tell us about your business
        </p>
      </div>

      {/* Store Name */}
      <div className="space-y-2">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a' }}>
          <Building2 className="w-4 h-4" style={{ color: '#b89767' }} />
          Store Name
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
            <Building2 className="w-5 h-5" style={{ color: '#999' }} />
          </div>
          <input
            name="store_name"
            placeholder="Your awesome store name"
            value={formData.store_name}
            onChange={(e) => onInputChange('store_name', e.target.value)}
            onBlur={() => onFieldBlur('store_name')}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#b89767';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 3px rgba(184, 151, 103, 0.15)';
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = '#d4cbb8';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
            }}
            style={inputStyle(!!validationErrors.store_name)}
          />
        </div>
        {validationErrors.store_name && (
          <p style={{ fontSize: '0.8rem', color: '#dc2626' }}>{validationErrors.store_name.message}</p>
        )}
      </div>

      {/* Store Address */}
      <div className="space-y-2">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a' }}>
          <MapPin className="w-4 h-4" style={{ color: '#b89767' }} />
          Store Address
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
            <MapPin className="w-5 h-5" style={{ color: '#999' }} />
          </div>
          <input
            name="store_address"
            placeholder="Street address, City, Country"
            value={formData.store_address}
            onChange={(e) => onInputChange('store_address', e.target.value)}
            onBlur={() => onFieldBlur('store_address')}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#b89767';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 3px rgba(184, 151, 103, 0.15)';
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = '#d4cbb8';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
            }}
            style={inputStyle(!!validationErrors.store_address)}
          />
        </div>
        {validationErrors.store_address && (
          <p style={{ fontSize: '0.8rem', color: '#dc2626' }}>{validationErrors.store_address.message}</p>
        )}
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a' }}>
          <DollarSign className="w-4 h-4" style={{ color: '#b89767' }} />
          Currency
        </label>
        <Select
          value={formData.currency_code}
          onValueChange={(value) => onSelectChange('currency_code', value)}
        >
          <SelectTrigger
            className="h-12 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid #d4cbb8',
              color: '#1a1a1a',
            }}
          >
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent
            style={{
              background: '#fdfbf7',
              border: '1px solid #e5e0d1',
              color: '#1a1a1a',
            }}
          >
            {CURRENCIES.map((currency) => (
              <SelectItem
                key={currency.code}
                value={currency.code}
                className="focus:bg-[#f0ecde] focus:text-[#1a1a1a]"
              >
                <span className="flex items-center gap-2">
                  <span style={{ fontWeight: 500, color: '#b89767' }}>{currency.symbol}</span>
                  <span>{currency.name}</span>
                  <span style={{ color: '#999' }}>({currency.code})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.currency_code && (
          <p style={{ fontSize: '0.8rem', color: '#dc2626' }}>{validationErrors.currency_code.message}</p>
        )}
      </div>
    </div>
  );
};

export default StoreInformationStep;