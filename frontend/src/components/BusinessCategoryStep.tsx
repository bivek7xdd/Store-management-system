import React, { useState } from 'react';
import { Check, ChevronRight, SkipForward, Plus, X, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BUSINESS_CATEGORIES, getIconComponent } from '@/data/businessCategories';
import { EnhancedSignupFormData, ValidationErrors, ProductSubcategory } from '@/types/enhanced-signup';

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
    <div className="step-container space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a', fontFamily: "'Playfair Display', serif" }}>
          Choose Your Business Category
        </h3>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Select the category that best describes your business to help us customize your experience
        </p>
      </div>

      {/* Skip Option */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSkipCategories}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(184, 151, 103, 0.08)';
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          <SkipForward className="w-4 h-4" />
          Skip for now
        </button>
      </div>

      {/* Business Category Selection */}
      {!formData.business_category ? (
        <div className="space-y-4">
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a1a1a' }}>
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
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e0d1',
                    background: 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(184, 151, 103, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(184, 151, 103, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(184, 151, 103, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.borderColor = '#e5e0d1';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      style={{
                        flexShrink: 0,
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(184, 151, 103, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: '#b89767' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                        {category.name}
                      </h5>
                      <p style={{ fontSize: '0.8rem', color: '#888', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: '#ccc', flexShrink: 0 }} />
                  </div>
                </button>
              );
            })}

            {/* "Other" Category Option */}
            <button
              type="button"
              onClick={handleOtherCategoryClick}
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px dashed #d4cbb8',
                background: 'rgba(255, 255, 255, 0.3)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(217, 185, 155, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(217, 185, 155, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.borderColor = '#d4cbb8';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  style={{
                    flexShrink: 0,
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(217, 185, 155, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PenLine className="w-5 h-5" style={{ color: '#c4956a' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Other</h5>
                  <p style={{ fontSize: '0.8rem', color: '#888' }}>Don't see your category? Type it in!</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: '#ccc', flexShrink: 0 }} />
              </div>
            </button>
          </div>
        </div>
      ) : isOtherCategory ? (
        /* Custom "Other" Category */
        <div className="space-y-4">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: '0.75rem',
              background: 'rgba(217, 185, 155, 0.08)',
              border: '1px solid rgba(217, 185, 155, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(217, 185, 155, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PenLine className="w-5 h-5" style={{ color: '#c4956a' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Custom Category</h4>
                <input
                  type="text"
                  placeholder="Enter your business category..."
                  value={formData.custom_category || ''}
                  onChange={handleCustomCategoryInputChange}
                  style={{
                    height: '2.25rem',
                    width: '100%',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid #d4cbb8',
                    color: '#1a1a1a',
                    fontSize: '0.85rem',
                    padding: '0 0.75rem',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onCategorySelect('');
                setShowCustomCategoryInput(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: "'Inter', sans-serif",
                marginLeft: '0.5rem',
              }}
            >
              Change
            </button>
          </div>

          {/* Custom Subcategory Section */}
          <div className="space-y-3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a1a1a' }}>
                Add your product categories
              </h4>
              <Badge
                variant="secondary"
                style={{
                  background: 'rgba(184, 151, 103, 0.1)',
                  color: '#b89767',
                  border: '1px solid rgba(184, 151, 103, 0.2)',
                }}
              >
                {formData.custom_subcategories?.length || 0} added
              </Badge>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
              Add the product types you sell. This helps us set up your inventory categories.
            </p>

            {/* Custom Subcategories List */}
            {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {formData.custom_subcategories.map((subcategory, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(217, 185, 155, 0.1)',
                      border: '1px solid rgba(217, 185, 155, 0.3)',
                      color: '#b89767',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{subcategory}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSubcategory(subcategory)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.6,
                        color: '#b89767',
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Input */}
            {showAddSubcategoryInput ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Enter product category name..."
                  value={customSubcategoryInput}
                  onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  style={{
                    flex: 1,
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid #d4cbb8',
                    color: '#1a1a1a',
                    padding: '0 0.75rem',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubcategory}
                  disabled={!customSubcategoryInput.trim()}
                  style={{
                    height: '2.5rem',
                    padding: '0 1rem',
                    borderRadius: '0.5rem',
                    background: '#b89767',
                    color: 'white',
                    border: 'none',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: customSubcategoryInput.trim() ? 1 : 0.5,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.85rem',
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubcategoryInput(false);
                    setCustomSubcategoryInput('');
                  }}
                  style={{
                    height: '2.5rem',
                    padding: '0 0.75rem',
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddSubcategoryInput(true)}
                style={{
                  width: '100%',
                  height: '3rem',
                  borderRadius: '0.75rem',
                  border: '1px dashed #d4cbb8',
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: '#888',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(184, 151, 103, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(184, 151, 103, 0.4)';
                  e.currentTarget.style.color = '#666';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.borderColor = '#d4cbb8';
                  e.currentTarget.style.color = '#888';
                }}
              >
                <Plus className="w-4 h-4" />
                Add Product Category
              </button>
            )}
          </div>

          {/* Summary */}
          {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: 'rgba(184, 151, 103, 0.06)',
                border: '1px solid rgba(184, 151, 103, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Check className="w-4 h-4" style={{ color: '#b89767' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a' }}>
                  {formData.custom_subcategories.length} custom {formData.custom_subcategories.length === 1 ? 'category' : 'categories'} added
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>
                We'll create these categories in your inventory system to help you organize your products.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Predefined Category - Subcategory Selection */
        <div className="space-y-4">
          {/* Selected Category Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderRadius: '0.75rem',
              background: 'rgba(184, 151, 103, 0.06)',
              border: '1px solid rgba(184, 151, 103, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(184, 151, 103, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.createElement(getIconComponent(selectedCategory!.icon), {
                  className: 'w-5 h-5',
                  style: { color: '#b89767' },
                })}
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.9rem' }}>{selectedCategory!.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#b89767' }}>{selectedCategory!.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCategorySelect('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Change
            </button>
          </div>

          {/* Subcategory Selection */}
          <div className="space-y-3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a1a1a' }}>
                What products do you sell?
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge
                  variant="secondary"
                  style={{
                    background: 'rgba(184, 151, 103, 0.1)',
                    color: '#b89767',
                    border: '1px solid rgba(184, 151, 103, 0.2)',
                  }}
                >
                  {selectedSubcategoriesCount} selected
                </Badge>
                {formData.product_subcategories.length < totalSubcategories && (
                  <button
                    type="button"
                    onClick={onSelectAllSubcategories}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b89767',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Select all
                  </button>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
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
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${isSelected ? 'rgba(184, 151, 103, 0.4)' : '#e5e0d1'}`,
                      background: isSelected ? 'rgba(184, 151, 103, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          flexShrink: 0,
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '4px',
                          border: `2px solid ${isSelected ? '#b89767' : '#ccc'}`,
                          background: isSelected ? '#b89767' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3" style={{ color: 'white' }} />}
                      </div>
                      <span style={{ fontWeight: 500, color: isSelected ? '#1a1a1a' : '#666', fontSize: '0.9rem' }}>
                        {subcategory.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Subcategories */}
            {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 500, color: '#999', marginBottom: '0.5rem' }}>Custom categories:</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.custom_subcategories.map((subcategory, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(217, 185, 155, 0.1)',
                        border: '1px solid rgba(217, 185, 155, 0.3)',
                        color: '#b89767',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{subcategory}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSubcategory(subcategory)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, color: '#b89767', display: 'flex', padding: 0 }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Other */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e0d1' }}>
              {showAddSubcategoryInput ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter custom product category..."
                    value={customSubcategoryInput}
                    onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    style={{
                      flex: 1,
                      height: '2.5rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid #d4cbb8',
                      color: '#1a1a1a',
                      padding: '0 0.75rem',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubcategory}
                    disabled={!customSubcategoryInput.trim()}
                    style={{
                      height: '2.5rem',
                      padding: '0 1rem',
                      borderRadius: '0.5rem',
                      background: '#b89767',
                      color: 'white',
                      border: 'none',
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: customSubcategoryInput.trim() ? 1 : 0.5,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.85rem',
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubcategoryInput(false);
                      setCustomSubcategoryInput('');
                    }}
                    style={{ height: '2.5rem', padding: '0 0.75rem', background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSubcategoryInput(true)}
                  style={{
                    width: '100%',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px dashed #d4cbb8',
                    background: 'rgba(255, 255, 255, 0.3)',
                    color: '#888',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(184, 151, 103, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(184, 151, 103, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.borderColor = '#d4cbb8';
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Other Product Category
                </button>
              )}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedSubcategoriesCount > 0 && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: 'rgba(184, 151, 103, 0.06)',
                border: '1px solid rgba(184, 151, 103, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Check className="w-4 h-4" style={{ color: '#b89767' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a' }}>
                  {selectedSubcategoriesCount} product {selectedSubcategoriesCount === 1 ? 'category' : 'categories'} selected
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>
                We'll create these categories in your inventory system to help you organize your products.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.business_category && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.15)',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: '#dc2626' }}>{validationErrors.business_category.message}</p>
        </div>
      )}
    </div>
  );
};

export default BusinessCategoryStep;