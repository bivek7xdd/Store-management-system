import React from 'react';
import { User, Store, Tag, Edit2, Eye, EyeOff, Lock } from 'lucide-react';
import { EnhancedSignupFormData, ValidationErrors } from '@/types/enhanced-signup';
import { BUSINESS_CATEGORIES } from '@/data/businessCategories';

interface ReviewConfirmationStepProps {
  formData: EnhancedSignupFormData;
  validationErrors: ValidationErrors;
  showConfirmPassword: boolean;
  onInputChange: (field: keyof EnhancedSignupFormData, value: string | string[] | boolean) => void;
  onToggleConfirmPassword: () => void;
  onEditStep: (step: number) => void;
  onFieldBlur: (field: keyof EnhancedSignupFormData) => void;
}

const ReviewConfirmationStep: React.FC<ReviewConfirmationStepProps> = ({
  formData,
  validationErrors,
  showConfirmPassword,
  onInputChange,
  onToggleConfirmPassword,
  onEditStep,
  onFieldBlur,
}) => {
  const getBusinessCategoryDetails = () => {
    if (!formData.business_category) return null;

    const category = BUSINESS_CATEGORIES.find(cat => cat.id === formData.business_category);
    if (!category) return null;

    const selectedSubcategories = category.subcategories.filter(sub =>
      formData.product_subcategories.includes(sub.id)
    );

    return {
      category,
      selectedSubcategories,
    };
  };

  const categoryDetails = getBusinessCategoryDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[2px] bg-[#303030] mb-4">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-[20px] font-medium text-white mb-2 tracking-tight">
          Review & Confirm
        </h3>
        <p className="text-[#8F8F8F] text-[13px] tracking-[0.195px]">
          Please review your information and confirm your password to complete setup
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Account Information */}
        <div className="bg-[#181818] border border-[#303030] rounded-[2px] p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#303030]">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#8F8F8F]" />
              <h4 className="font-normal text-[#8F8F8F] text-[12px] uppercase tracking-[1px]">Account Information</h4>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 text-[#8F8F8F] hover:text-white transition-colors text-[12px] uppercase tracking-[1px]"
              onClick={() => onEditStep(1)}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Full Name</span>
              <p className="text-[13px] text-white font-medium">{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Email</span>
              <p className="text-[13px] text-white font-medium">{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Phone</span>
              <p className="text-[13px] text-white font-medium">{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Password</span>
              <p className="text-[13px] text-white font-medium">••••••••</p>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-[#181818] border border-[#303030] rounded-[2px] p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#303030]">
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4 text-[#8F8F8F]" />
              <h4 className="font-normal text-[#8F8F8F] text-[12px] uppercase tracking-[1px]">Store Information</h4>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 text-[#8F8F8F] hover:text-white transition-colors text-[12px] uppercase tracking-[1px]"
              onClick={() => onEditStep(2)}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Store Name</span>
              <p className="text-[13px] text-white font-medium">{formData.store_name || 'Not provided'}</p>
            </div>
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Currency</span>
              <p className="text-[13px] text-white font-medium">{formData.currency_code || 'NPR'}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Address</span>
              <p className="text-[13px] text-white font-medium">{formData.store_address || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Business Categories */}
        <div className="bg-[#181818] border border-[#303030] rounded-[2px] p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#303030]">
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-[#8F8F8F]" />
              <h4 className="font-normal text-[#8F8F8F] text-[12px] uppercase tracking-[1px]">Business Categories</h4>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 text-[#8F8F8F] hover:text-white transition-colors text-[12px] uppercase tracking-[1px]"
              onClick={() => onEditStep(3)}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          {formData.skip_categories ? (
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Configuration</span>
              <p className="text-[13px] text-[#8F8F8F] font-medium">Skipped - can be configured later</p>
            </div>
          ) : formData.business_category === 'other' ? (
            <div className="space-y-4">
              <div>
                <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Primary Category</span>
                <p className="text-[13px] text-white font-medium">
                  {formData.custom_category || 'Custom Category (not specified)'}
                </p>
              </div>
              {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
                <div>
                  <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-2">Product Types</span>
                  <div className="flex flex-wrap gap-2">
                    {formData.custom_subcategories.map((sub, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-[2px] text-[11px] font-medium bg-[#303030] text-white"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : categoryDetails ? (
            <div className="space-y-4">
              <div>
                <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Primary Category</span>
                <p className="text-[13px] text-white font-medium">{categoryDetails.category.name}</p>
              </div>
              {(categoryDetails.selectedSubcategories.length > 0 || (formData.custom_subcategories && formData.custom_subcategories.length > 0)) && (
                <div>
                  <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-2">Product Types</span>
                  <div className="flex flex-wrap gap-2">
                    {categoryDetails.selectedSubcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center px-2 py-1 rounded-[2px] text-[11px] font-medium bg-[#303030] text-white"
                      >
                        {sub.name}
                      </span>
                    ))}
                    {formData.custom_subcategories && formData.custom_subcategories.map((sub, index) => (
                      <span
                        key={`custom-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-[2px] text-[11px] font-medium bg-transparent border border-[#303030] text-white"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="block text-[11px] text-[#8F8F8F] uppercase tracking-[1px] mb-1">Configuration</span>
              <p className="text-[13px] text-[#8F8F8F] font-medium">No categories selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Confirmation */}
      <div className="bg-[#181818] border border-[#303030] rounded-[2px] p-4">
        <div className="mb-4 pb-3 border-b border-[#303030]">
          <h4 className="font-normal text-white text-[14px]">Final Security Check</h4>
          <p className="text-[12px] text-[#8F8F8F] mt-1">
            Please confirm your password to complete account creation
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="final-password-confirm"
            className="text-[11px] font-normal text-[#8F8F8F] uppercase tracking-[1px]"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="final-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => onInputChange('confirmPassword', e.target.value)}
              onBlur={() => onFieldBlur('confirmPassword')}
              placeholder="Re-enter your password"
              className={`w-full h-[44px] bg-transparent border ${
                validationErrors.confirmPassword ? 'border-[#F13A2C] focus:border-[#F13A2C]' : 'border-[#CCCCCC] focus:border-[#1EAEDB]'
              } rounded-[2px] pl-3 pr-10 text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/50 transition-all`}
            />
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-[13px] text-[#F13A2C] mt-2">
              {validationErrors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewConfirmationStep;