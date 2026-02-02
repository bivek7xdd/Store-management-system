import React from 'react';
import { User, Store, Tag, Edit2, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  // Get business category details
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
    <div className="step-container space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-emerald-500/20">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Review & Confirm</h3>
        <p className="text-sm text-gray-400">
          Please review your information and confirm your password to complete setup
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Account Information */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-400" />
              <h4 className="font-medium text-white">Account Information</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(1)}
              className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-8 px-2"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Full Name</span>
              <p className="text-white font-medium">{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-400">Email</span>
              <p className="text-white font-medium">{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-400">Phone</span>
              <p className="text-white font-medium">{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-400">Password</span>
              <p className="text-white font-medium">••••••••</p>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-teal-400" />
              <h4 className="font-medium text-white">Store Information</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(2)}
              className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-8 px-2"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Store Name</span>
              <p className="text-white font-medium">{formData.store_name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-400">Currency</span>
              <p className="text-white font-medium">{formData.currency_code || 'NPR'}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-400">Address</span>
              <p className="text-white font-medium">{formData.store_address || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Business Categories */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-400" />
              <h4 className="font-medium text-white">Business Categories</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(3)}
              className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-8 px-2"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
          
          {formData.skip_categories ? (
            <div className="text-sm">
              <span className="text-gray-400">Configuration</span>
              <p className="text-white font-medium">Skipped - can be configured later</p>
            </div>
          ) : categoryDetails ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Primary Category</span>
                <p className="text-white font-medium">{categoryDetails.category.name}</p>
              </div>
              {categoryDetails.selectedSubcategories.length > 0 && (
                <div>
                  <span className="text-gray-400">Product Types</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categoryDetails.selectedSubcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-gray-400">Configuration</span>
              <p className="text-white font-medium">No categories selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Confirmation */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="mb-3">
          <h4 className="font-medium text-white mb-1">Final Security Check</h4>
          <p className="text-sm text-gray-400">
            Please confirm your password to complete account creation
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="final-password-confirm" className="text-sm font-medium text-gray-300">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="final-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => onInputChange('confirmPassword', e.target.value)}
              onBlur={() => onFieldBlur('confirmPassword')}
              placeholder="Re-enter your password"
              className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500/20"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleConfirmPassword}
              className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-sm text-red-400 mt-1">
              {validationErrors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <p className="text-sm text-emerald-300">
          Ready to create your StoreHub account? Click "Create Account" to complete setup.
        </p>
      </div>
    </div>
  );
};

export default ReviewConfirmationStep;