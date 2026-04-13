import React, { useState } from 'react';
import { Check, ChevronRight, SkipForward, Plus, X, PenLine } from 'lucide-react';
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
  onCustomCategoryChange?: (value: string) => void;
  onAddCustomSubcategory?: (value: string) => void;
  onRemoveCustomSubcategory?: (value: string) => void;
}

const BusinessCategoryStep: React.FC<BusinessCategoryStepProps> = ({
  formData,
  validationErrors,
  onCategorySelect,
  onSubcategoryToggle,
  onSelectAllSubcategories,
  onSkipCategories,
  onCustomCategoryChange,
  onAddCustomSubcategory,
  onRemoveCustomSubcategory,
}) => {
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(formData.business_category === 'other');
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');
  const [showAddSubcategoryInput, setShowAddSubcategoryInput] = useState(false);

  const selectedCategory = BUSINESS_CATEGORIES.find(cat => cat.id === formData.business_category);
  const isOtherCategory = formData.business_category === 'other';

  const selectedSubcategoriesCount = formData.product_subcategories.length + (formData.custom_subcategories?.length || 0);
  const totalSubcategories = selectedCategory?.subcategories.length || 0;

  const handleOtherCategoryClick = () => {
    onCategorySelect('other');
    setShowCustomCategoryInput(true);
  };

  const handleCustomCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomCategoryChange) {
      onCustomCategoryChange(e.target.value);
    }
  };

  const handleAddCustomSubcategory = () => {
    if (customSubcategoryInput.trim() && onAddCustomSubcategory) {
      onAddCustomSubcategory(customSubcategoryInput.trim());
      setCustomSubcategoryInput('');
      setShowAddSubcategoryInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSubcategory();
    }
  };

  const handleRemoveCustomSubcategory = (subcategory: string) => {
    if (onRemoveCustomSubcategory) {
      onRemoveCustomSubcategory(subcategory);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-[20px] font-medium text-white mb-2 tracking-tight">
          Choose Your Business Category
        </h3>
        <p className="text-[#8F8F8F] text-[13px] tracking-[0.195px]">
          Select the category that best describes your business to help us customize your experience
        </p>
      </div>

      {/* Skip Option */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSkipCategories}
          className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-[#8F8F8F] text-[12px] uppercase font-normal tracking-[1px] hover:bg-[#303030] hover:text-white transition-all"
        >
          <SkipForward className="w-4 h-4" />
          Skip for now
        </button>
      </div>

      {/* Business Category Selection */}
      {!formData.business_category ? (
        <div className="space-y-4">
          <h4 className="text-[12px] font-normal text-[#8F8F8F] tracking-[1px] uppercase">
            Select Your Primary Business Category
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUSINESS_CATEGORIES.map((category) => {
              const IconComponent = getIconComponent(category.icon);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategorySelect(category.id)}
                  className="p-4 rounded-[2px] border border-[#303030] bg-[#181818] text-left transition-all hover:bg-[#303030] hover:border-[#CCCCCC] group"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-[2px] bg-[#303030] flex items-center justify-center group-hover:bg-[#181818] transition-colors">
                      <IconComponent className="w-5 h-5 text-[#8F8F8F] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-white mb-1 text-[14px]">{category.name}</h5>
                      <p className="text-[12px] text-[#8F8F8F] overflow-hidden line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#303030] shrink-0 group-hover:text-white transition-colors" />
                  </div>
                </button>
              );
            })}

            {/* "Other" Category Option */}
            <button
              type="button"
              onClick={handleOtherCategoryClick}
              className="p-4 rounded-[2px] border border-dashed border-[#303030] bg-transparent text-left transition-all hover:bg-[#181818] hover:border-[#8F8F8F] group"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-[2px] bg-[#303030] flex items-center justify-center group-hover:bg-[#404040] transition-colors">
                  <PenLine className="w-5 h-5 text-[#8F8F8F] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-white mb-1 text-[14px]">Other</h5>
                  <p className="text-[12px] text-[#8F8F8F]">Don't see your category? Type it in!</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#303030] shrink-0 group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>
        </div>
      ) : isOtherCategory ? (
        /* Custom "Other" Category */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-[2px] bg-[#181818] border border-[#303030]">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-[2px] bg-[#303030] flex items-center justify-center">
                <PenLine className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 mr-4">
                <h4 className="font-normal text-[#8F8F8F] text-[12px] uppercase tracking-[1px] mb-2">Custom Category</h4>
                <input
                  type="text"
                  placeholder="Enter your business category..."
                  value={formData.custom_category || ''}
                  onChange={handleCustomCategoryInputChange}
                  className="w-full h-[40px] rounded-[2px] bg-transparent border border-[#CCCCCC] focus:border-[#1EAEDB] focus:ring-1 focus:ring-[#1EAEDB] text-[15px] text-white px-3 outline-none transition-all placeholder:text-[#666666]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onCategorySelect('');
                setShowCustomCategoryInput(false);
              }}
              className="text-[#8F8F8F] text-[12px] hover:text-white uppercase tracking-[1px] transition-colors whitespace-nowrap ml-4"
            >
              Change
            </button>
          </div>

          {/* Custom Subcategory Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium text-white">Add your product categories</h4>
              <Badge className="bg-[#181818] border-[#303030] text-[#8F8F8F] hover:bg-[#181818] rounded-[2px]">
                {formData.custom_subcategories?.length || 0} added
              </Badge>
            </div>

            <p className="text-[13px] text-[#8F8F8F]">
              Add the product types you sell. This helps us set up your inventory categories.
            </p>

            {/* Custom Subcategories List */}
            {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.custom_subcategories.map((subcategory, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#181818] border border-[#303030] text-white"
                  >
                    <span className="text-[13px]">{subcategory}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSubcategory(subcategory)}
                      className="text-[#8F8F8F] hover:text-[#DA291C] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Input */}
            {showAddSubcategoryInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter product category name..."
                  value={customSubcategoryInput}
                  onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  className="flex-1 h-[40px] rounded-[2px] bg-transparent border border-[#CCCCCC] focus:border-[#1EAEDB] focus:ring-1 focus:ring-[#1EAEDB] text-[14px] text-white px-3 outline-none transition-all placeholder:text-[#666666]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubcategory}
                  disabled={!customSubcategoryInput.trim()}
                  className="h-[40px] px-4 rounded-[2px] bg-[#DA291C] text-white text-[12px] uppercase tracking-[1px] disabled:opacity-50 hover:bg-[#B01E0A] transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubcategoryInput(false);
                    setCustomSubcategoryInput('');
                  }}
                  className="h-[40px] px-3 text-[#8F8F8F] hover:text-white transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddSubcategoryInput(true)}
                className="w-full h-[48px] rounded-[2px] border border-dashed border-[#303030] text-[#8F8F8F] hover:bg-[#181818] hover:text-white transition-colors flex items-center justify-center gap-2 text-[13px]"
              >
                <Plus className="w-4 h-4" />
                Add Product Category
              </button>
            )}
          </div>

          {/* Summary */}
          {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
            <div className="p-4 rounded-[2px] bg-[#181818] border border-[#303030]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-[#DA291C]" />
                <span className="text-[13px] font-medium text-white">
                  {formData.custom_subcategories.length} custom {formData.custom_subcategories.length === 1 ? 'category' : 'categories'} added
                </span>
              </div>
              <p className="text-[12px] text-[#8F8F8F]">
                We'll create these categories in your inventory system to help you organize your products.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Predefined Category - Subcategory Selection */
        <div className="space-y-6">
          {/* Selected Category Display */}
          <div className="flex items-center justify-between p-4 rounded-[2px] bg-[#181818] border border-[#303030]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[2px] bg-[#303030] flex items-center justify-center">
                {React.createElement(getIconComponent(selectedCategory!.icon), {
                  className: 'w-5 h-5 text-white',
                })}
              </div>
              <div>
                <h4 className="font-medium text-white text-[14px] mb-1">{selectedCategory!.name}</h4>
                <p className="text-[12px] text-[#8F8F8F]">{selectedCategory!.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCategorySelect('')}
              className="text-[#8F8F8F] text-[12px] hover:text-white uppercase tracking-[1px] transition-colors"
            >
              Change
            </button>
          </div>

          {/* Subcategory Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium text-white">What products do you sell?</h4>
              <div className="flex items-center gap-3">
                <Badge className="bg-[#181818] border-[#303030] text-[#8F8F8F] hover:bg-[#181818] rounded-[2px]">
                  {selectedSubcategoriesCount} selected
                </Badge>
                {formData.product_subcategories.length < totalSubcategories && (
                  <button
                    type="button"
                    onClick={onSelectAllSubcategories}
                    className="text-[#1EAEDB] text-[12px] uppercase tracking-[1px] hover:text-white transition-colors"
                  >
                    Select all
                  </button>
                )}
              </div>
            </div>

            <p className="text-[13px] text-[#8F8F8F]">
              Select all product types that apply to your business.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedCategory!.subcategories.map((subcategory) => {
                const isSelected = formData.product_subcategories.includes(subcategory.id);

                return (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => onSubcategoryToggle(subcategory.id)}
                    className={`p-3 rounded-[2px] border text-left transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'border-[#DA291C] bg-[#DA291C]/10' 
                        : 'border-[#303030] bg-[#181818] hover:border-[#8F8F8F]'
                    }`}
                  >
                    <div
                      className={`shrink-0 w-5 h-5 rounded-[2px] border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-[#DA291C] bg-[#DA291C]' : 'border-[#666666] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[13px] ${isSelected ? 'text-white font-medium' : 'text-[#8F8F8F]'}`}>
                      {subcategory.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Subcategories */}
            {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
              <div className="pt-4">
                <h5 className="text-[12px] font-normal text-[#8F8F8F] tracking-[1px] uppercase mb-3">Custom categories:</h5>
                <div className="flex flex-wrap gap-2">
                  {formData.custom_subcategories.map((subcategory, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#181818] border border-[#303030] text-white"
                    >
                      <span className="text-[13px]">{subcategory}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSubcategory(subcategory)}
                        className="text-[#8F8F8F] hover:text-[#DA291C] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Other */}
            <div className="pt-4 border-t border-[#303030]">
              {showAddSubcategoryInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom product category..."
                    value={customSubcategoryInput}
                    onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="flex-1 h-[40px] rounded-[2px] bg-transparent border border-[#CCCCCC] focus:border-[#1EAEDB] focus:ring-1 focus:ring-[#1EAEDB] text-[14px] text-white px-3 outline-none transition-all placeholder:text-[#666666]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubcategory}
                    disabled={!customSubcategoryInput.trim()}
                    className="h-[40px] px-4 rounded-[2px] bg-[#DA291C] text-white text-[12px] uppercase tracking-[1px] disabled:opacity-50 hover:bg-[#B01E0A] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubcategoryInput(false);
                      setCustomSubcategoryInput('');
                    }}
                    className="h-[40px] px-3 text-[#8F8F8F] hover:text-white transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSubcategoryInput(true)}
                  className="w-full h-[40px] rounded-[2px] border border-dashed border-[#303030] text-[#8F8F8F] hover:bg-[#181818] hover:text-white transition-colors flex items-center justify-center gap-2 text-[13px]"
                >
                  <Plus className="w-4 h-4" />
                  Add Other Product Category
                </button>
              )}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedSubcategoriesCount > 0 && (
            <div className="p-4 rounded-[2px] bg-[#181818] border border-[#303030]">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-[#DA291C]" />
                <span className="text-[13px] font-medium text-white">
                  {selectedSubcategoriesCount} product {selectedSubcategoriesCount === 1 ? 'category' : 'categories'} selected
                </span>
              </div>
              <p className="text-[12px] text-[#8F8F8F]">
                We'll create these categories in your inventory system to help you organize your products.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.business_category && (
        <div className="flex items-start gap-3 p-3 bg-[#F13A2C]/10 border-l-2 border-[#F13A2C]">
          <p className="text-[#F13A2C] text-[13px] tracking-[0.195px]">{validationErrors.business_category.message}</p>
        </div>
      )}
    </div>
  );
};

export default BusinessCategoryStep;
