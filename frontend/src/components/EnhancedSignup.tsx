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
          <div className="step-container space-y-5">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'rgba(184,151,103,0.15)' }}>
                <Store className="w-8 h-8" style={{ color: '#b89767' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Step {state.currentStep}</h3>
              <p style={{ color: '#888' }}>
                {getCurrentStepTitle()} - Implementation coming in next tasks
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="register-page">
      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          background-color: #f8f4eb;
          background-image:
            radial-gradient(circle at 100% 0%, rgba(229, 224, 209, 0.5) 0%, transparent 40%),
            radial-gradient(circle at 0% 100%, rgba(217, 185, 155, 0.3) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(248, 244, 235, 0.8) 0%, transparent 80%);
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
        }

        .register-page * {
          box-sizing: border-box;
        }

        .register-main {
          width: 100%;
          max-width: 80rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          position: relative;
          z-index: 10;
        }

        @media (min-width: 1024px) {
          .register-main {
            flex-direction: row;
            align-items: flex-start;
            gap: 4rem;
          }
        }

        /* Hero */
        .register-hero {
          width: 100%;
          display: none;
          flex-direction: column;
          justify-content: center;
          position: relative;
          padding-top: 2rem;
        }

        @media (min-width: 1024px) {
          .register-hero {
            display: flex;
            width: 38%;
            position: sticky;
            top: 2rem;
          }
        }

        .hero-content-reg {
          position: relative;
          z-index: 10;
        }

        .logo-container-reg {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 3rem;
        }

        .logo-icon-reg {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #f0ecde 0%, #e5e0d1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e5e0d1;
        }

        .logo-text-reg {
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          font-family: 'Inter', sans-serif;
        }

        .hero-heading-reg {
          font-size: 3rem;
          line-height: 1.1;
          margin-bottom: 1.25rem;
          color: #1a1a1a;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .hero-heading-reg .accent-text {
          display: block;
          background: linear-gradient(135deg, #b89767 0%, #d9b99b 50%, #c4956a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle-reg {
          color: #666;
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 22rem;
          margin-bottom: 2.5rem;
        }

        .hero-features-reg {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item-reg {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .feature-icon-reg {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          background: rgba(184, 151, 103, 0.12);
          border: 1px solid rgba(184, 151, 103, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-text-reg {
          font-weight: 500;
          color: #444;
          font-size: 0.95rem;
        }

        /* Form Section */
        .form-section-reg {
          width: 100%;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 20;
        }

        @media (min-width: 1024px) {
          .form-section-reg {
            width: 58%;
            justify-content: center;
          }
        }

        .form-card-reg {
          width: 100%;
          max-width: 36rem;
          background: rgba(253, 251, 247, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2rem 2.25rem;
          border: 1px solid #e5e0d1;
          box-shadow:
            0 20px 60px -12px rgba(0,0,0,0.08),
            0 0 0 1px rgba(217, 185, 155, 0.1),
            0 0 40px rgba(217, 185, 155, 0.08);
        }

        .form-header-reg {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .form-badge-reg {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          margin-bottom: 0.75rem;
          background: rgba(184, 151, 103, 0.1);
          border: 1px solid rgba(184, 151, 103, 0.2);
        }

        .form-badge-reg span {
          font-size: 0.85rem;
          font-weight: 500;
          color: #b89767;
        }

        .form-title-reg {
          font-size: 1.6rem;
          font-family: 'Playfair Display', serif;
          color: #1a1a1a;
          font-weight: 600;
        }

        /* Step Indicator override for warm theme */
        .warm-step-indicator [role="tablist"] {
          margin-bottom: 1.5rem;
        }

        /* Navigation Buttons */
        .nav-buttons-reg {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.75rem;
        }

        .btn-back-reg {
          flex: 1;
          height: 3rem;
          border-radius: 0.75rem;
          border: 1px solid #d4cbb8;
          background: transparent;
          color: #666;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-back-reg:hover {
          background: rgba(229, 224, 209, 0.4);
          color: #1a1a1a;
          border-color: #c4b9a3;
        }

        .btn-continue-reg {
          flex: 1;
          height: 3rem;
          border-radius: 0.75rem;
          border: 1px solid #444;
          background: linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%);
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow:
            0 8px 24px rgba(184, 151, 107, 0.35),
            inset 0 1px 0 rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }

        .btn-continue-reg::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }

        .btn-continue-reg:hover::before {
          left: 100%;
        }

        .btn-continue-reg:hover {
          background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%);
          transform: translateY(-1px);
          box-shadow:
            0 12px 32px rgba(184, 151, 107, 0.4),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .btn-continue-reg:active {
          transform: translateY(0);
        }

        .btn-continue-reg:disabled,
        .btn-back-reg:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-create-reg {
          flex: 1;
          height: 3rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(184, 151, 103, 0.4);
          background: linear-gradient(135deg, #b89767 0%, #c4956a 100%);
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow:
            0 8px 24px rgba(184, 151, 107, 0.4),
            inset 0 1px 0 rgba(255,255,255,0.2);
          position: relative;
          overflow: hidden;
        }

        .btn-create-reg::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s ease;
        }

        .btn-create-reg:hover::before {
          left: 100%;
        }

        .btn-create-reg:hover {
          background: linear-gradient(135deg, #c9a577 0%, #d4a57a 100%);
          transform: translateY(-1px);
          box-shadow:
            0 12px 32px rgba(184, 151, 107, 0.5),
            inset 0 1px 0 rgba(255,255,255,0.25);
        }

        .btn-create-reg:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner-reg {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin-reg 0.6s linear infinite;
        }

        @keyframes spin-reg {
          to { transform: rotate(360deg); }
        }

        /* Divider & Sign In */
        .signin-link-reg {
          text-align: center;
          font-size: 0.9rem;
          color: #888;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e0d1;
        }

        .signin-link-reg a {
          font-weight: 600;
          color: #1a1a1a;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          padding-bottom: 1px;
          transition: all 0.2s ease;
        }

        .signin-link-reg a:hover {
          border-bottom-color: #d9b99b;
        }

        .copyright-reg {
          text-align: center;
          font-size: 0.8rem;
          color: #aaa;
          margin-top: 1.25rem;
        }

        /* Background decorations */
        .bg-deco {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .bg-deco-1 {
          top: -8%;
          right: -4%;
          width: 450px;
          height: 450px;
          border: 0.5px solid rgba(229, 224, 209, 0.5);
          animation: spin-slow 40s linear infinite;
        }

        .bg-deco-2 {
          bottom: -8%;
          left: -4%;
          width: 380px;
          height: 380px;
          border: 0.5px solid rgba(217, 185, 155, 0.3);
          animation: spin-slow 30s linear infinite reverse;
        }

        .bg-deco-3 {
          top: 35%;
          right: 25%;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(217, 185, 155, 0.08) 0%, transparent 70%);
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .float-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(217, 185, 155, 0.3);
          pointer-events: none;
          animation: float-anim 6s ease-in-out infinite;
        }

        .float-dot:nth-child(2) { animation-delay: 1.2s; }
        .float-dot:nth-child(3) { animation-delay: 2.4s; }
        .float-dot:nth-child(4) { animation-delay: 3.6s; }

        @keyframes float-anim {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {/* Background Decorations */}
      <div className="bg-deco bg-deco-1" />
      <div className="bg-deco bg-deco-2" />
      <div className="bg-deco bg-deco-3" />

      <div className="float-dot" style={{ top: '12%', left: '8%' }} />
      <div className="float-dot" style={{ top: '65%', left: '20%' }} />
      <div className="float-dot" style={{ top: '25%', right: '12%' }} />
      <div className="float-dot" style={{ bottom: '25%', right: '8%' }} />

      {/* SVG Patterns */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '22rem',
          height: '22rem',
          color: 'rgba(229, 224, 209, 0.35)',
          pointerEvents: 'none',
          transform: 'translate(25%, -25%)',
        }}
        fill="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" />
        <line x1="10" x2="90" y1="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" x2="50" y1="10" y2="90" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '22rem',
          height: '22rem',
          color: 'rgba(229, 224, 209, 0.35)',
          pointerEvents: 'none',
          transform: 'translate(-25%, 25%)',
        }}
        fill="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <path d="M5 50 A 45 45 0 0 0 95 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      <main className="register-main">
        {/* Left — Hero */}
        <section className="register-hero">
          <div className="hero-content-reg" ref={heroRef}>
            <div className="logo-container-reg">
              <div className="logo-icon-reg">
                <Store className="w-5 h-5" style={{ color: '#888' }} />
              </div>
              <span className="logo-text-reg">StoreHub</span>
            </div>

            <h1 className="hero-heading-reg">
              Start Your
              <span className="accent-text">Business Journey</span>
            </h1>

            <p className="hero-subtitle-reg">
              Join thousands of store owners who trust StoreHub to manage their inventory and grow their business.
            </p>

            <div className="hero-features-reg">
              {[
                { icon: Shield, text: 'Bank-level Security' },
                { icon: Zap, text: 'Setup in 2 Minutes' },
                { icon: BarChart3, text: 'Real-time Analytics' },
              ].map((item, i) => (
                <div key={i} className="feature-item-reg">
                  <div className="feature-icon-reg">
                    <item.icon className="w-5 h-5" style={{ color: '#b89767' }} />
                  </div>
                  <span className="feature-text-reg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right — Form */}
        <section className="form-section-reg">
          <div className="form-card-reg" ref={containerRef}>
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
              <div className="logo-icon-reg">
                <Store className="w-5 h-5" style={{ color: '#888' }} />
              </div>
              <span className="logo-text-reg">StoreHub</span>
            </div>

            <div className="form-header-reg">
              <div className="form-badge-reg">
                <Store className="w-4 h-4" style={{ color: '#b89767' }} />
                <span>Create Account</span>
              </div>
              <h2 className="form-title-reg">{getCurrentStepTitle()}</h2>
            </div>

            {/* Step Indicator */}
            <div className="warm-step-indicator">
              <StepIndicator
                steps={DEFAULT_STEPS}
                currentStep={state.currentStep}
                completedSteps={getCompletedSteps()}
                onStepClick={handleStepTransition}
                canNavigateToStep={canGoToStep}
                showProgress={true}
                progressPercentage={getProgressPercentage()}
                className="mb-6 px-1"
              />
            </div>

            {/* Step Content */}
            <div style={{ minHeight: '320px', position: 'relative' }}>
              <div ref={stepContentRef} style={{ opacity: 1 }}>
                {renderStepContent()}
              </div>
            </div>

            {/* Navigation */}
            <div className="nav-buttons-reg">
              {canGoPrev() && (
                <button
                  type="button"
                  className="btn-back-reg"
                  onClick={() => handleStepTransition('prev')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {state.currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  className="btn-continue-reg"
                  onClick={() => handleStepTransition('next')}
                  disabled={!canGoNext()}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-create-reg"
                  onClick={handleSubmit}
                  disabled={state.isSubmitting}
                >
                  {state.isSubmitting ? (
                    <>
                      <span className="spinner-reg" />
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

            <div className="signin-link-reg">
              <p>
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </p>
            </div>

            <p className="copyright-reg">© 2025 StoreHub. All rights reserved.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EnhancedSignup;