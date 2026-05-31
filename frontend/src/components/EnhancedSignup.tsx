import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Check, ArrowRight, ArrowLeft, Shield, Zap, BarChart3 } from 'lucide-react';
import gsap from 'gsap';

import { useToast } from '@/components/ui/use-toast';
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
import { cn } from '@/lib/utils';

const EnhancedSignup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power3.out' }
      );
    }

    if (heroRef.current) {
      gsap.from(heroRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        delay: 0.2,
        ease: 'power3.out',
      });
    }
  }, []);

  useEffect(() => {
    if (stepContentRef.current) {
      stepContentRef.current.style.opacity = '1';
      stepContentRef.current.style.transform = 'translateX(0)';
    }
  }, [state.currentStep]);

  const handleStepTransition = (direction: 'next' | 'prev' | number) => {
    if (direction === 'next') {
      nextStep();
    } else if (direction === 'prev') {
      prevStep();
    } else if (typeof direction === 'number') {
      goToStep(direction);
    }
  };

  const handleEditStep = (step: number) => {
    handleStepTransition(step);
  };

  const handleSubmit = async () => {
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
      await enhancedSignupAPI.register(state.formData);

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

      navigate('/otp', { state: { email: state.formData.email } });
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

  const handleCategorySelect = (categoryId: string) => {
    handleInputChange('business_category', categoryId);
    handleInputChange('product_subcategories', []);
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

  const getCurrentStepTitle = () => {
    const stepTitles = [
      'Personal Details',
      'Store Information',
      'Business Categories',
      'Review & Confirm'
    ];
    return stepTitles[state.currentStep - 1] || 'Setup';
  };

  const renderStepContent = () => {
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
          <div className="space-y-5">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[#b89767]/15">
                <Store className="w-8 h-8 text-[#b89767]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#1a1a1a]">Step {state.currentStep}</h3>
              <p className="text-[#888]">
                {getCurrentStepTitle()} - Implementation coming in next tasks
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#000000] font-sans text-white selection:bg-[#DA291C] selection:text-white">
      {/* Left Cinematic Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#000000] overflow-hidden">
        {/* Deep Overlay for Chiaroscuro Depth */}
        <div className="absolute inset-0 bg-[hsla(0,0%,7%,0.8)] z-10 pointer-events-none" />
        <img 
          src="/retail-interior.png" 
          alt="Retail Interior Cinematic" 
          className="w-full h-full object-cover relative z-0"
        />

        <div className="absolute top-12 left-14 z-20 flex items-center gap-3">
          <Store className="w-7 h-7 text-white" />
          <span className="text-[14px] font-medium tracking-[1px] text-white uppercase">Store sync</span>
        </div>

        <div className="absolute bottom-20 left-14 z-20 max-w-lg" ref={heroRef}>
          <div className="w-12 h-1 bg-[#DA291C] mb-8" />
          <h1 className="text-[26px] md:text-[36px] font-medium leading-[1.15] text-white mb-6">
            Start Your Business Journey
          </h1>
          <p className="text-[#8F8F8F] text-[13px] leading-[1.6] tracking-[0.195px] max-w-sm">
            Join thousands of store owners who trust Store sync to manage their inventory, sales, and analytics with precision.
          </p>

          <div className="flex flex-col gap-6 mt-10">
            {[
              { icon: Shield, text: 'Bank-level Security' },
              { icon: Zap, text: 'Setup in 2 Minutes' },
              { icon: BarChart3, text: 'Real-time Analytics' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-[#8F8F8F]" />
                <span className="font-normal text-[#8F8F8F] text-[12px] tracking-[1px] uppercase">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-[#000000]">
        
        {/* Mobile Logo */}
        <div className="absolute top-8 left-6 md:left-10 lg:hidden flex items-center gap-3">
          <Store className="w-6 h-6 text-white" />
          <span className="text-[13px] font-medium tracking-[1px] text-white uppercase">Store sync</span>
        </div>

        <div className="w-full max-w-xl" ref={containerRef}>
          <div className="mb-10 mt-12 lg:mt-0">
            <h2 className="text-[26px] font-medium text-white mb-2 tracking-tight">{getCurrentStepTitle()}</h2>
          </div>

          {/* Step Indicator */}
          <div className="mb-10">
             <StepIndicator
                steps={DEFAULT_STEPS}
                currentStep={state.currentStep}
                completedSteps={getCompletedSteps()}
                onStepClick={handleStepTransition}
                canNavigateToStep={canGoToStep}
                showProgress={true}
                progressPercentage={getProgressPercentage()}
                className="mb-8"
              />
          </div>

          {/* Step Content */}
          <div className="min-h-[320px] relative mb-10">
            <div ref={stepContentRef} className="opacity-100 transition-all duration-300">
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
              {canGoPrev() && (
                <button
                  type="button"
                  className="flex-1 h-[44px] rounded-[2px] border border-white text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-white hover:text-black flex items-center justify-center gap-2"
                  onClick={() => handleStepTransition('prev')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {state.currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  className="flex-1 h-[44px] rounded-[2px] bg-[#FFFFFF] text-[#000000] border border-[#000000] font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#1EAEDB] hover:text-white hover:border-[#1EAEDB] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handleStepTransition('next')}
                  disabled={!canGoNext()}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex-1 h-[44px] rounded-[2px] bg-[#DA291C] text-white font-normal uppercase tracking-[1.28px] text-[14px] transition-colors hover:bg-[#B01E0A] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={state.isSubmitting}
                >
                  {state.isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </button>
              )}
          </div>

          <div className="mt-14 text-center">
            <p className="text-[13px] text-[#8F8F8F] tracking-[0.195px]">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-[#3860BE] transition-colors font-medium ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSignup;