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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f8f4eb] font-sans text-[#1a1a1a]">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-8%] right-[-4%] w-[450px] h-[450px] border-[0.5px] border-[#e5e0d1]/50 rounded-full animate-[spin_40s_linear_infinite]" />
        <div className="absolute bottom-[-8%] left-[-4%] w-[380px] h-[380px] border-[0.5px] border-[#d9b99b]/30 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
        <div className="absolute top-[35%] right-[25%] w-[180px] h-[180px] bg-[radial-gradient(circle,rgba(217,185,155,0.08)_0%,transparent_70%)] rounded-full" />
        
        {/* Float Dots */}
        {[
          { top: '12%', left: '8%', delay: '0s' },
          { top: '65%', left: '20%', delay: '1.2s' },
          { top: '25%', right: '12%', delay: '2.4s' },
          { bottom: '25%', right: '8%', delay: '3.6s' },
        ].map((dot, i) => (
          <div 
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#d9b99b]/30 animate-[float_6s_ease-in-out_infinite]"
            style={{ ...dot, animationDelay: dot.delay }}
          />
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(229,224,209,0.5)_0%,transparent_40%),radial-gradient(circle_at_0%_100%,rgba(217,185,155,0.3)_0%,transparent_40%),radial-gradient(circle_at_50%_50%,rgba(248,244,235,0.8)_0%,transparent_80%)]" />
      </div>

      {/* SVG Patterns */}
      <svg className="absolute top-0 right-0 w-[22rem] h-[22rem] text-[#e5e0d1]/35 pointer-events-none translate-x-1/4 -translate-y-1/4" fill="none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" />
        <line x1="10" x2="90" y1="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" x2="50" y1="10" y2="90" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[22rem] h-[22rem] text-[#e5e0d1]/35 pointer-events-none -translate-x-1/4 translate-y-1/4" fill="none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 0 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-16 relative z-10">
        {/* Left — Hero */}
        <section className="hidden lg:flex w-full lg:w-[38%] flex-col justify-center sticky top-8">
          <div className="relative z-10" ref={heroRef}>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f0ecde] to-[#e5e0d1] flex items-center justify-center shadow-sm border border-[#e5e0d1]">
                <Store className="w-5 h-5 text-[#888]" />
              </div>
              <span className="text-[1.35rem] font-semibold tracking-tight">StoreHub</span>
            </div>

            <h1 className="text-5xl font-serif font-bold leading-[1.1] mb-5 tracking-tight">
              Start Your
              <span className="block bg-gradient-to-br from-[#b89767] via-[#d9b99b] to-[#c4956a] bg-clip-text text-transparent">Business Journey</span>
            </h1>

            <p className="text-[#666] text-lg leading-relaxed max-w-xs mb-10">
              Join thousands of store owners who trust StoreHub to manage their inventory and grow their business.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { icon: Shield, text: 'Bank-level Security' },
                { icon: Zap, text: 'Setup in 2 Minutes' },
                { icon: BarChart3, text: 'Real-time Analytics' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#b89767]/12 border border-[#b89767]/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#b89767]" />
                  </div>
                  <span className="font-medium text-[#444] text-[0.95rem]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right — Form */}
        <section className="w-full lg:w-[58%] flex justify-center relative z-20">
          <div className="w-full max-w-xl bg-white/85 backdrop-blur-[20px] rounded-[1.5rem] p-8 lg:p-9 border border-[#e5e0d1] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(217,185,155,0.1),0_0_40px_rgba(217,185,155,0.08)]" ref={containerRef}>
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f0ecde] to-[#e5e0d1] flex items-center justify-center shadow-sm border border-[#e5e0d1]">
                <Store className="w-5 h-5 text-[#888]" />
              </div>
              <span className="text-[1.35rem] font-semibold tracking-tight">StoreHub</span>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#b89767]/10 border border-[#b89767]/20 mb-3">
                <Store className="w-4 h-4 text-[#b89767]" />
                <span className="text-[0.85rem] font-medium text-[#b89767]">Create Account</span>
              </div>
              <h2 className="text-[1.6rem] font-serif font-bold text-[#1a1a1a]">{getCurrentStepTitle()}</h2>
            </div>

            {/* Step Indicator */}
            <div className="mb-6 px-1">
              <StepIndicator
                steps={DEFAULT_STEPS}
                currentStep={state.currentStep}
                completedSteps={getCompletedSteps()}
                onStepClick={handleStepTransition}
                canNavigateToStep={canGoToStep}
                showProgress={true}
                progressPercentage={getProgressPercentage()}
                className="mb-6"
              />
            </div>

            {/* Step Content */}
            <div className="min-h-[320px] relative">
              <div ref={stepContentRef} className="opacity-100 transition-all duration-300">
                {renderStepContent()}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-7">
              {canGoPrev() && (
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl border border-[#d4cbb8] bg-transparent text-[#666] font-medium transition-all hover:bg-[#e5e0d1]/40 hover:text-[#1a1a1a] hover:border-[#c4b9a3] flex items-center justify-center gap-2"
                  onClick={() => handleStepTransition('prev')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {state.currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-[#3a3a3a] to-[#1a1a1a] text-white font-medium transition-all duration-300 hover:bg-gradient-to-br hover:from-[#4a4a4a] hover:to-[#2a2a2a] hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(184,151,107,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_32px_rgba(184,151,107,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={() => handleStepTransition('next')}
                  disabled={!canGoNext()}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-[#b89767] to-[#c4956a] text-white font-semibold transition-all duration-300 hover:bg-gradient-to-br hover:from-[#c9a577] hover:to-[#d4a57a] hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(184,151,107,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_12px_32px_rgba(184,151,107,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleSubmit}
                  disabled={state.isSubmitting}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  {state.isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

            <div className="text-center text-[0.9rem] text-[#888] mt-6 pt-6 border-t border-[#e5e0d1]">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#1a1a1a] border-b-2 border-transparent hover:border-[#d9b99b] transition-all">Sign in</Link>
              </p>
            </div>

            <p className="text-center text-[0.8rem] text-[#aaa] mt-5">© 2025 StoreHub. All rights reserved.</p>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedSignup;