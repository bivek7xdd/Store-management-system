import { useCallback } from 'react';
import { EnhancedSignupFormData, TOTAL_STEPS } from '@/types/enhanced-signup';
import { validateStep, canProgressToStep } from '@/utils/signupValidation';

interface UseStepNavigationProps {
  currentStep: number;
  formData: EnhancedSignupFormData;
  setCurrentStep: (step: number) => void;
  setValidationErrors: (errors: any) => void;
}

export function useStepNavigation({
  currentStep,
  formData,
  setCurrentStep,
  setValidationErrors,
}: UseStepNavigationProps) {

  // Navigate to next step with validation
  const nextStep = useCallback(() => {
    // Validate current step before proceeding
    const errors = validateStep(currentStep, formData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }

    // Clear any existing validation errors
    setValidationErrors({});

    // Move to next step if not at the end
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      return true;
    }

    return false;
  }, [currentStep, formData, setCurrentStep, setValidationErrors]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  }, [currentStep, setCurrentStep]);

  // Navigate to specific step with validation gating
  const goToStep = useCallback((targetStep: number) => {
    // Validate target step is within bounds
    if (targetStep < 1 || targetStep > TOTAL_STEPS) {
      return false;
    }

    // Check if we can progress to the target step
    if (!canProgressToStep(targetStep, formData)) {
      // If trying to go forward, validate current step and show errors
      if (targetStep > currentStep) {
        const errors = validateStep(currentStep, formData);
        setValidationErrors(errors);
      }
      return false;
    }

    // Clear validation errors and navigate
    setValidationErrors({});
    setCurrentStep(targetStep);
    return true;
  }, [currentStep, formData, setCurrentStep, setValidationErrors]);

  // Check if we can navigate to next step
  const canGoNext = useCallback(() => {
    return currentStep < TOTAL_STEPS && canProgressToStep(currentStep + 1, formData);
  }, [currentStep, formData]);

  // Check if we can navigate to previous step
  const canGoPrev = useCallback(() => {
    return currentStep > 1;
  }, [currentStep]);

  // Check if we can navigate to a specific step
  const canGoToStep = useCallback((targetStep: number) => {
    return canProgressToStep(targetStep, formData);
  }, [formData]);

  // Get step completion status
  const getStepCompletionStatus = useCallback(() => {
    const completionStatus: boolean[] = [];
    
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      if (step === 3) {
        // Step 3 (categories) is optional, so it's always considered "complete"
        completionStatus.push(true);
      } else {
        const errors = validateStep(step, formData);
        completionStatus.push(Object.keys(errors).length === 0);
      }
    }
    
    return completionStatus;
  }, [formData]);

  // Calculate overall progress percentage
  const getProgressPercentage = useCallback(() => {
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  }, [currentStep]);

  // Get completed steps array
  const getCompletedSteps = useCallback(() => {
    const completionStatus = getStepCompletionStatus();
    const completedSteps: number[] = [];
    
    for (let i = 0; i < currentStep - 1; i++) {
      if (completionStatus[i]) {
        completedSteps.push(i + 1);
      }
    }
    
    return completedSteps;
  }, [currentStep, getStepCompletionStatus]);

  // Validate current step without navigation
  const validateCurrentStep = useCallback(() => {
    const errors = validateStep(currentStep, formData);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, formData, setValidationErrors]);

  return {
    // Navigation functions
    nextStep,
    prevStep,
    goToStep,
    
    // Validation functions
    canGoNext,
    canGoPrev,
    canGoToStep,
    validateCurrentStep,
    
    // Progress functions
    getStepCompletionStatus,
    getProgressPercentage,
    getCompletedSteps,
  };
}