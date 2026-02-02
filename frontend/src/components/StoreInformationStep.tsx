import React from 'react';
import { Building2, MapPin, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const StoreInformationStep: React.FC<StoreInformationStepProps> = ({
  formData,
  validationErrors,
  onInputChange,
  onSelectChange,
  onFieldBlur,
}) => {
  const inputClassName = (hasError: boolean) => `
    h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 transition-colors
    ${hasError ? 'border-red-500/50 focus:border-red-500' : ''}
  `;

  return (
    <div className="step-container space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-400" />
          Store Name
        </Label>
        <Input
          name="store_name"
          placeholder="Your awesome store name"
          value={formData.store_name}
          onChange={(e) => onInputChange('store_name', e.target.value)}
          onBlur={() => onFieldBlur('store_name')}
          className={inputClassName(!!validationErrors.store_name)}
        />
        {validationErrors.store_name && (
          <p className="text-xs text-red-400">{validationErrors.store_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-400" />
          Store Address
        </Label>
        <Input
          name="store_address"
          placeholder="Street address, City, Country"
          value={formData.store_address}
          onChange={(e) => onInputChange('store_address', e.target.value)}
          onBlur={() => onFieldBlur('store_address')}
          className={inputClassName(!!validationErrors.store_address)}
        />
        {validationErrors.store_address && (
          <p className="text-xs text-red-400">{validationErrors.store_address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-teal-400" />
          Currency
        </Label>
        <Select 
          value={formData.currency_code} 
          onValueChange={(value) => onSelectChange('currency_code', value)}
        >
          <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800 text-white">
            {CURRENCIES.map((currency) => (
              <SelectItem 
                key={currency.code} 
                value={currency.code} 
                className="focus:bg-white/10 focus:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium text-teal-400">{currency.symbol}</span>
                  <span>{currency.name}</span>
                  <span className="text-gray-500">({currency.code})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.currency_code && (
          <p className="text-xs text-red-400">{validationErrors.currency_code.message}</p>
        )}
      </div>
    </div>
  );
};

export default StoreInformationStep;