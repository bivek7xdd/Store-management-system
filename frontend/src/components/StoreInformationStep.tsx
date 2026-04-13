import React from 'react';
import { Building2, MapPin, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedInput from '@/components/EnhancedInput';
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[2px] bg-[#303030] mb-4">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[20px] font-medium text-white mb-2 tracking-tight">
          Store Information
        </h3>
        <p className="text-[#8F8F8F] text-[13px] tracking-[0.195px]">
          Tell us about your business
        </p>
      </div>

      <div className="space-y-5">
        {/* Store Name */}
        <EnhancedInput
          id="store_name"
          name="store_name"
          label="Store Name"
          icon={Building2}
          type="text"
          placeholder="Your awesome store name"
          value={formData.store_name}
          onChange={(e) => onInputChange('store_name', e.target.value)}
          onBlur={() => onFieldBlur('store_name')}
          error={validationErrors.store_name}
        />

        {/* Store Address */}
        <EnhancedInput
          id="store_address"
          name="store_address"
          label="Store Address"
          icon={MapPin}
          type="text"
          placeholder="Street address, City, Country"
          value={formData.store_address}
          onChange={(e) => onInputChange('store_address', e.target.value)}
          onBlur={() => onFieldBlur('store_address')}
          error={validationErrors.store_address}
        />

        {/* Currency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[#8F8F8F] text-[12px] font-normal uppercase tracking-[1px]">
              Currency
            </label>
          </div>
          
          <Select
            value={formData.currency_code}
            onValueChange={(value) => onSelectChange('currency_code', value)}
          >
            <SelectTrigger
              className="w-full h-[44px] bg-transparent border border-[#CCCCCC] rounded-[2px] px-3 text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 focus:border-[#1EAEDB]"
            >
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent
              className="bg-[#181818] border-[#303030] rounded-[2px]"
            >
              {CURRENCIES.map((currency) => (
                <SelectItem
                  key={currency.code}
                  value={currency.code}
                  className="focus:bg-[#303030] focus:text-white text-white rounded-none border-b border-[#303030] last:border-0 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-[#DA291C]">{currency.symbol}</span>
                    <span>{currency.name}</span>
                    <span className="text-[#8F8F8F]">({currency.code})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.currency_code && (
            <div className="flex items-start gap-3 p-3 bg-[#F13A2C]/10 border-l-2 border-[#F13A2C] mt-2">
              <span className="text-[#F13A2C] text-[13px] tracking-[0.195px]">{validationErrors.currency_code.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreInformationStep;