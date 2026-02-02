import React from 'react';
import { Check, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BUSINESS_CATEGORIES, getIconComponent } from '@/data/businessCategories';
import { EnhancedSignupFormData, ValidationErrors } from '@/types/enhanced-signup';

interface BusinessCategoryStepProps {
  formData: EnhancedSignupFormData;
  validationErrors: ValidationErrors;
  onCategorySelect: (categoryId: string) => void;
  onSubcategoryToggle: (subcategoryId: string) => void;
  onSelectAllSubcategories: () => void;
  onSkipCategories: () => void;
}

const BusinessCategoryStep: React.FC<BusinessCategoryStepProps> = ({
  formData,
  validationErrors,
  onCategorySelect,
  onSubcategoryToggle,
  onSelectAllSubcategories,
  onSkipCategories,
}) => {
  const selectedCategory = BUSINESS_CATEGORIES.find(cat => cat.id === formData.business_category);
  const selectedSubcategoriesCount = formData.product_subcategories.length;
  const totalSubcategories = selectedCategory?.subcategories.length || 0;

  return (
    <div className="step-container space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Choose Your Business Category</h3>
        <p className="text-gray-400 text-sm">
          Select the category that best describes your business to help us customize your experience
        </p>
      </div>

      {/* Skip Option */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkipCategories}
          className="text-gray-400 hover:text-white hover:bg-white/5 text-sm"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip for now
        </Button>
      </div>

      {/* Business Category Selection */}
      {!formData.business_category ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Select Your Primary Business Category</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUSINESS_CATEGORIES.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategorySelect(category.id)}
                  className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 text-left transform hover:scale-[1.02] hover:-translate-y-1"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 group-hover:scale-110 transition-all duration-300">
                      <IconComponent className="w-5 h-5 text-teal-400 group-hover:text-teal-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-white group-hover:text-teal-300 transition-colors">
                        {category.name}
                      </h5>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Product Subcategory Selection */
        <div className="space-y-4">
          {/* Selected Category Display */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                {React.createElement(getIconComponent(selectedCategory!.icon), {
                  className: "w-5 h-5 text-teal-400"
                })}
              </div>
              <div>
                <h4 className="font-semibold text-white">{selectedCategory!.name}</h4>
                <p className="text-sm text-teal-300">{selectedCategory!.description}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onCategorySelect('')}
              className="text-gray-400 hover:text-white hover:bg-white/5 text-sm"
            >
              Change
            </Button>
          </div>

          {/* Subcategory Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">
                What products do you sell?
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-gray-300">
                  {selectedSubcategoriesCount} of {totalSubcategories} selected
                </Badge>
                {selectedSubcategoriesCount < totalSubcategories && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onSelectAllSubcategories}
                    className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 text-sm"
                  >
                    Select all
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Select all product types that apply to your business. This helps us set up your inventory categories.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedCategory!.subcategories.map((subcategory) => {
                const isSelected = formData.product_subcategories.includes(subcategory.id);
                
                return (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => onSubcategoryToggle(subcategory.id)}
                    className={`
                      group p-3 rounded-lg border transition-all duration-300 text-left transform hover:scale-[1.02]
                      ${isSelected 
                        ? 'border-teal-500/50 bg-teal-500/10 text-white shadow-md shadow-teal-500/20' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-gray-300 hover:shadow-lg hover:shadow-white/5'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300
                        ${isSelected 
                          ? 'border-teal-500 bg-teal-500 scale-110' 
                          : 'border-gray-400 group-hover:border-gray-300 group-hover:scale-105'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white animate-in zoom-in duration-200" />}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                        {subcategory.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedSubcategoriesCount > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-white">
                  {selectedSubcategoriesCount} product {selectedSubcategoriesCount === 1 ? 'category' : 'categories'} selected
                </span>
              </div>
              <p className="text-xs text-gray-400">
                We'll create these categories in your inventory system to help you organize your products.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.business_category && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{validationErrors.business_category.message}</p>
        </div>
      )}
    </div>
  );
};

export default BusinessCategoryStep;