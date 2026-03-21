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

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.4)',
    border: '1px solid #e5e0d1',
    borderRadius: '0.75rem',
    padding: '1rem',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  };

  const editBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    background: 'none',
    border: 'none',
    color: '#b89767',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div className="step-container space-y-6">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
          style={{ background: 'rgba(184, 151, 103, 0.12)' }}
        >
          <Lock className="w-6 h-6" style={{ color: '#b89767' }} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>
          Review & Confirm
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#888' }}>
          Please review your information and confirm your password to complete setup
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Account Information */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User className="w-4 h-4" style={{ color: '#b89767' }} />
              <h4 style={{ fontWeight: 500, color: '#1a1a1a', fontSize: '0.9rem' }}>Account Information</h4>
            </div>
            <button
              type="button"
              style={editBtnStyle}
              onClick={() => onEditStep(1)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184, 151, 103, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#999' }}>Full Name</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <span style={{ color: '#999' }}>Email</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <span style={{ color: '#999' }}>Phone</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <span style={{ color: '#999' }}>Password</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>••••••••</p>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store className="w-4 h-4" style={{ color: '#b89767' }} />
              <h4 style={{ fontWeight: 500, color: '#1a1a1a', fontSize: '0.9rem' }}>Store Information</h4>
            </div>
            <button
              type="button"
              style={editBtnStyle}
              onClick={() => onEditStep(2)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184, 151, 103, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#999' }}>Store Name</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{formData.store_name || 'Not provided'}</p>
            </div>
            <div>
              <span style={{ color: '#999' }}>Currency</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{formData.currency_code || 'NPR'}</p>
            </div>
            <div className="sm:col-span-2">
              <span style={{ color: '#999' }}>Address</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{formData.store_address || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Business Categories */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag className="w-4 h-4" style={{ color: '#b89767' }} />
              <h4 style={{ fontWeight: 500, color: '#1a1a1a', fontSize: '0.9rem' }}>Business Categories</h4>
            </div>
            <button
              type="button"
              style={editBtnStyle}
              onClick={() => onEditStep(3)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184, 151, 103, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          {formData.skip_categories ? (
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: '#999' }}>Configuration</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>Skipped - can be configured later</p>
            </div>
          ) : formData.business_category === 'other' ? (
            <div className="space-y-3" style={{ fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#999' }}>Primary Category</span>
                <p style={{ color: '#1a1a1a', fontWeight: 500 }}>
                  {formData.custom_category || 'Custom Category (not specified)'}
                </p>
              </div>
              {formData.custom_subcategories && formData.custom_subcategories.length > 0 && (
                <div>
                  <span style={{ color: '#999' }}>Product Types</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {formData.custom_subcategories.map((sub, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'rgba(217, 185, 155, 0.12)',
                          color: '#b89767',
                          border: '1px solid rgba(217, 185, 155, 0.25)',
                        }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : categoryDetails ? (
            <div className="space-y-3" style={{ fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#999' }}>Primary Category</span>
                <p style={{ color: '#1a1a1a', fontWeight: 500 }}>{categoryDetails.category.name}</p>
              </div>
              {(categoryDetails.selectedSubcategories.length > 0 || (formData.custom_subcategories && formData.custom_subcategories.length > 0)) && (
                <div>
                  <span style={{ color: '#999' }}>Product Types</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {categoryDetails.selectedSubcategories.map((sub) => (
                      <span
                        key={sub.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'rgba(184, 151, 103, 0.1)',
                          color: '#b89767',
                          border: '1px solid rgba(184, 151, 103, 0.2)',
                        }}
                      >
                        {sub.name}
                      </span>
                    ))}
                    {formData.custom_subcategories && formData.custom_subcategories.map((sub, index) => (
                      <span
                        key={`custom-${index}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'rgba(217, 185, 155, 0.12)',
                          color: '#c4956a',
                          border: '1px solid rgba(217, 185, 155, 0.25)',
                        }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: '#999' }}>Configuration</span>
              <p style={{ color: '#1a1a1a', fontWeight: 500 }}>No categories selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Confirmation */}
      <div style={sectionStyle}>
        <div style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ fontWeight: 500, color: '#1a1a1a', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Final Security Check</h4>
          <p style={{ fontSize: '0.85rem', color: '#888' }}>
            Please confirm your password to complete account creation
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="final-password-confirm"
            style={{ fontSize: '0.85rem', fontWeight: 500, color: '#444' }}
          >
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="final-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => onInputChange('confirmPassword', e.target.value)}
              onBlur={() => onFieldBlur('confirmPassword')}
              placeholder="Re-enter your password"
              style={{
                width: '100%',
                height: '2.75rem',
                paddingLeft: '1rem',
                paddingRight: '3rem',
                background: 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${validationErrors.confirmPassword ? 'rgba(220, 38, 38, 0.5)' : '#d4cbb8'}`,
                borderRadius: '0.75rem',
                color: '#1a1a1a',
                fontSize: '0.9rem',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'all 0.25s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#b89767';
                e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 3px rgba(184, 151, 103, 0.15)';
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = '#d4cbb8';
                e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
              }}
            />
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem' }}>
              {validationErrors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(184, 151, 103, 0.06)',
          border: '1px solid rgba(184, 151, 103, 0.15)',
          borderRadius: '0.75rem',
        }}
      >
        <p style={{ fontSize: '0.85rem', color: '#b89767' }}>
          Ready to create your StoreHub account? Click "Create Account" to complete setup.
        </p>
      </div>
    </div>
  );
};

export default ReviewConfirmationStep;