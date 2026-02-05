import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SpaceBackground from '@/components/SpaceBackground';
import StepIndicator, { DEFAULT_STEPS } from '@/components/StepIndicator';
import PersonalDetailsStep from '@/components/PersonalDetailsStep';
import StoreInformationStep from '@/components/StoreInformationStep';
import BusinessCategoryStep from '@/components/BusinessCategoryStep';
import ReviewConfirmationStep from '@/components/ReviewConfirmationStep';

import { useEnhancedSignup } from '@/hooks/useEnhancedSignup';
import { useStepNavigation } from '@/hooks/useStepNavigation';
import { TOTAL_STEPS } from '@/types/enhanced-signup';
import { BUSINESS_CATEGORIES } from '@/data/businessCategories';
import { validateStep } from '@/utils/signupValidation';
import { enhancedSignupAPI } from '@/services/api';
import categoryPreferencesService from '@/services/categoryPreferences';

// Remove the old STEPS configuration since we're using DEFAULT_STEPS from StepIndicator
const EnhancedSignup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const {
    state,
    setCurrentStep,
    setValidationErrors,
    setSubmitting,
    resetForm,
    handleInputChange,
    handleFieldBlur,
    handleSelectChange,
    togglePasswordVisibility,
  } = useEnhancedSignup();

  // Step navigation
  const {
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,
    canGoToStep,
    validateCurrentStep,
    getProgressPercentage,
    getCompletedSteps,
  } = useStepNavigation({
    currentStep: state.currentStep,
    formData: state.formData,
    setCurrentStep,
    setValidationErrors,
  });

  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Initialize animations
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' }
      );
    }

    if (contentRef.current) {
      gsap.from(contentRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        delay: 0.2,
        ease: 'power2.out',
      });
    }
  }, []);

  // Animate step content when step changes
  useEffect(() => {
    if (stepContentRef.current) {
      // Simple fade-in animation without complex GSAP logic
      stepContentRef.current.style.opacity = '1';
      stepContentRef.current.style.transform = 'translateX(0)';
    }
  }, [state.currentStep]);

  // Handle step transitions with simple logic
  const handleStepTransition = (direction: 'next' | 'prev' | number) => {
    // Execute step change immediately without complex animations
    if (direction === 'next') {
      nextStep();
    } else if (direction === 'prev') {
      prevStep();
    } else if (typeof direction === 'number') {
      goToStep(direction);
    }
  };

  // Handle edit functionality - navigate to specific step
  const handleEditStep = (step: number) => {
    handleStepTransition(step);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Final validation before submission
    const finalValidationErrors = validateStep(4, state.formData);

    if (Object.keys(finalValidationErrors).length > 0) {
      setValidationErrors(finalValidationErrors);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors before submitting.',
      });
      return;
    }

    // Additional password confirmation check
    if (!state.formData.confirmPassword) {
      setValidationErrors({
        confirmPassword: {
          message: 'Please confirm your password',
          type: 'required',
          severity: 'error'
        }
      });
      return;
    }

    if (state.formData.password !== state.formData.confirmPassword) {
      setValidationErrors({
        confirmPassword: {
          message: 'Passwords do not match',
          type: 'match',
          severity: 'error'
        }
      });
      return;
    }

    setSubmitting(true);

    try {
      // Register user with enhanced signup API
      await enhancedSignupAPI.register(state.formData);

      // Store category preferences in localStorage if not skipped
      if (!state.formData.skip_categories && state.formData.business_category) {
        categoryPreferencesService.store({
          business_category: state.formData.business_category,
          product_subcategories: state.formData.product_subcategories,
        });
      }

      toast({
        title: 'Success!',
        description: 'Account created successfully. Please check your email for verification.',
      });

      // Navigate to OTP verification
      navigate('/otp', { state: { email: state.formData.email } });

      // Reset form after successful submission
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Business category handlers
  const handleCategorySelect = (categoryId: string) => {
    handleInputChange('business_category', categoryId);
    // Reset subcategories when changing primary category
    handleInputChange('product_subcategories', []);
    // Reset custom fields when changing category
    if (categoryId !== 'other') {
      handleInputChange('custom_category', '');
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    const currentSubcategories = state.formData.product_subcategories;
    const updatedSubcategories = currentSubcategories.includes(subcategoryId)
      ? currentSubcategories.filter(id => id !== subcategoryId)
      : [...currentSubcategories, subcategoryId];

    handleInputChange('product_subcategories', updatedSubcategories);
  };

  const handleSelectAllSubcategories = () => {
    const selectedCategory = BUSINESS_CATEGORIES.find(cat => cat.id === state.formData.business_category);
    if (selectedCategory) {
      const allSubcategoryIds = selectedCategory.subcategories.map(sub => sub.id);
      handleInputChange('product_subcategories', allSubcategoryIds);
    }
  };

  const handleSkipCategories = () => {
    handleInputChange('skip_categories', true);
    handleInputChange('business_category', '');
    handleInputChange('product_subcategories', []);
    handleInputChange('custom_category', '');
    handleInputChange('custom_subcategories', []);
  };

  // Custom category/subcategory handlers
  const handleCustomCategoryChange = (value: string) => {
    handleInputChange('custom_category', value);
  };

  const handleAddCustomSubcategory = (value: string) => {
    const currentCustomSubs = state.formData.custom_subcategories || [];
    if (!currentCustomSubs.includes(value)) {
      handleInputChange('custom_subcategories', [...currentCustomSubs, value]);
    }
  };

  const handleRemoveCustomSubcategory = (value: string) => {
    const currentCustomSubs = state.formData.custom_subcategories || [];
    handleInputChange('custom_subcategories', currentCustomSubs.filter(sub => sub !== value));
  };

  // Get current step title
  const getCurrentStepTitle = () => {
    const stepTitles = [
      'Personal Details',
      'Store Information',
      'Business Categories',
      'Review & Confirm'
    ];
    return stepTitles[state.currentStep - 1] || 'Setup';
  };

  // Render step content
  const renderStepContent = () => {
    console.log('Rendering step:', state.currentStep); // Debug log

    switch (state.currentStep) {
      case 1:
        return (
          <PersonalDetailsStep
            formData={state.formData}
            validationErrors={state.validation}
            showPassword={state.showPassword}
            showConfirmPassword={state.showConfirmPassword}
            onInputChange={handleInputChange}
            onTogglePassword={togglePasswordVisibility}
            onFieldBlur={handleFieldBlur}
          />
        );

      case 2:
        return (
          <StoreInformationStep
            formData={state.formData}
            validationErrors={state.validation}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onFieldBlur={handleFieldBlur}
          />
        );

      case 3:
        return (
          <BusinessCategoryStep
            formData={state.formData}
            validationErrors={state.validation}
            onCategorySelect={handleCategorySelect}
            onSubcategoryToggle={handleSubcategoryToggle}
            onSelectAllSubcategories={handleSelectAllSubcategories}
            onSkipCategories={handleSkipCategories}
            onCustomCategoryChange={handleCustomCategoryChange}
            onAddCustomSubcategory={handleAddCustomSubcategory}
            onRemoveCustomSubcategory={handleRemoveCustomSubcategory}
          />
        );

      case 4:
        return (
          <ReviewConfirmationStep
            formData={state.formData}
            validationErrors={state.validation}
            showConfirmPassword={state.showConfirmPassword}
            onInputChange={handleInputChange}
            onToggleConfirmPassword={() => togglePasswordVisibility('confirmPassword')}
            onEditStep={handleEditStep}
            onFieldBlur={handleFieldBlur}
          />
        );

      default:
        return (
          <div className="step-container space-y-5">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-teal-500/20">
                <Store className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Step {state.currentStep}</h3>
              <p className="text-gray-400">
                {getCurrentStepTitle()} - Implementation coming in next tasks
              </p>
              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-300">
                  Current form data: {Object.keys(state.formData).length} fields
                </p>
                <p className="text-sm text-gray-300">
                  Progress: {getProgressPercentage()}%
                </p>
                <p className="text-sm text-gray-300">
                  Completed steps: {getCompletedSteps().join(', ') || 'None'}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <SpaceBackground className="flex">
      {/* Left Panel - Hero Content */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative z-10">
        <div ref={contentRef} className="text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-md bg-white/10">
              <Store className="h-8 w-8 text-teal-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight">StoreHub</span>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight shadow-teal-500/20 drop-shadow-lg">
            Start Your<br />
            <span className="text-teal-400">Business Journey</span>
          </h1>

          <p className="text-lg text-gray-300 max-w-md leading-relaxed mb-12">
            Join thousands of store owners who trust StoreHub to manage their inventory and grow their business.
          </p>

          <div className="space-y-4">
            {[
              { icon: Store, text: 'Multi-step Setup' },
              { icon: Check, text: 'Smart Validation' },
              { icon: User, text: 'Personalized Experience' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md bg-white/10">
                  <item.icon className="w-5 h-5 text-teal-300" />
                </div>
                <span className="font-medium text-gray-200">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative z-10 backdrop-blur-sm lg:backdrop-blur-none bg-black/30 lg:bg-transparent">
        <div className="w-full max-w-lg relative z-10" ref={containerRef}>
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Store className="h-6 w-6 text-teal-400" />
            </div>
            <span className="text-xl font-bold text-white">StoreHub</span>
          </div>

          <div
            className="rounded-3xl p-8 shadow-2xl border border-white/10 backdrop-blur-xl"
            style={{ background: 'rgba(15, 23, 42, 0.7)' }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-teal-500/10 border border-teal-500/20">
                <Store className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-teal-300">Create Account</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{getCurrentStepTitle()}</h2>
            </div>

            {/* Step Indicator */}
            <StepIndicator
              steps={DEFAULT_STEPS}
              currentStep={state.currentStep}
              completedSteps={getCompletedSteps()}
              onStepClick={handleStepTransition}
              canNavigateToStep={canGoToStep}
              showProgress={true}
              progressPercentage={getProgressPercentage()}
              className="mb-8 px-2"
            />

            {/* Step Content */}
            <div className="min-h-[320px] relative">
              <div ref={stepContentRef} className="step-content opacity-100">
                {renderStepContent()}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {canGoPrev() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStepTransition('prev')}
                  className="flex-1 h-12 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white font-semibold hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                  Back
                </Button>
              )}

              {state.currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={() => handleStepTransition('next')}
                  disabled={!canGoNext()}
                  className="flex-1 h-12 rounded-xl text-base font-semibold shadow-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-xl transition-all duration-200 group"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={state.isSubmitting}
                  className="flex-1 h-12 rounded-xl text-base font-semibold shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-xl transition-all duration-200 group"
                >
                  {state.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="relative">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-white/50 rounded-full animate-spin animate-reverse" />
                      </div>
                      <span className="animate-pulse">Creating...</span>
                    </span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="text-center mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-teal-400 hover:text-teal-300 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">© 2024 StoreHub. All rights reserved.</p>
        </div>
      </div>
    </SpaceBackground>
  );
};

export default EnhancedSignup;