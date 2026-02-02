import React, { useRef, useEffect } from 'react';
import { Check, User, Store, ShoppingCart, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepId: number) => void;
  canNavigateToStep?: (stepId: number) => boolean;
  className?: string;
  showProgress?: boolean;
  progressPercentage?: number;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

// Default step configuration
export const DEFAULT_STEPS: StepConfig[] = [
  { id: 1, title: 'Personal', description: 'Account details', icon: User },
  { id: 2, title: 'Store', description: 'Business info', icon: Store },
  { id: 3, title: 'Categories', description: 'Product types', icon: ShoppingCart },
  { id: 4, title: 'Review', description: 'Confirm details', icon: FileCheck },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps = DEFAULT_STEPS,
  currentStep,
  completedSteps = [],
  onStepClick,
  canNavigateToStep,
  className,
  showProgress = true,
  progressPercentage = 0,
  variant = 'horizontal',
  size = 'md',
}) => {
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Focus management for accessibility
  useEffect(() => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    if (currentStepIndex !== -1 && stepRefs.current[currentStepIndex]) {
      // Only focus if the user is navigating with keyboard
      const activeElement = document.activeElement;
      if (activeElement && activeElement.getAttribute('role') === 'tab') {
        stepRefs.current[currentStepIndex]?.focus();
      }
    }
  }, [currentStep, steps]);

  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Animate progress bar changes
  useEffect(() => {
    if (progressBarRef.current) {
      const progressBar = progressBarRef.current;
      
      // Add a subtle pulse effect when progress changes
      progressBar.style.transform = 'scaleY(1.1)';
      progressBar.style.transition = 'transform 0.2s ease-out';
      
      setTimeout(() => {
        progressBar.style.transform = 'scaleY(1)';
      }, 200);
    }
  }, [progressPercentage]);
  // Size configurations
  const sizeConfig = {
    sm: {
      circle: 'w-8 h-8',
      icon: 'w-4 h-4',
      title: 'text-xs',
      description: 'text-xs',
      connector: 'h-0.5',
      spacing: 'gap-2',
    },
    md: {
      circle: 'w-10 h-10',
      icon: 'w-5 h-5',
      title: 'text-sm',
      description: 'text-xs',
      connector: 'h-0.5',
      spacing: 'gap-3',
    },
    lg: {
      circle: 'w-12 h-12',
      icon: 'w-6 h-6',
      title: 'text-base',
      description: 'text-sm',
      connector: 'h-1',
      spacing: 'gap-4',
    },
  };

  const config = sizeConfig[size];

  const getStepState = (stepId: number) => {
    const isActive = currentStep === stepId;
    const isCompleted = completedSteps.includes(stepId);
    const canNavigate = canNavigateToStep ? canNavigateToStep(stepId) : isCompleted;
    
    return { isActive, isCompleted, canNavigate };
  };

  const handleStepClick = (stepId: number) => {
    const { canNavigate } = getStepState(stepId);
    if (canNavigate && onStepClick) {
      onStepClick(stepId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, stepId: number) => {
    const { canNavigate } = getStepState(stepId);
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (canNavigate && onStepClick) {
        onStepClick(stepId);
      }
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      navigateWithKeyboard(event.key === 'ArrowRight' ? 'next' : 'prev', stepId);
    }
  };

  const navigateWithKeyboard = (direction: 'next' | 'prev', currentStepId: number) => {
    const currentIndex = steps.findIndex(step => step.id === currentStepId);
    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Find next navigable step
    while (targetIndex >= 0 && targetIndex < steps.length) {
      const targetStep = steps[targetIndex];
      const { canNavigate } = getStepState(targetStep.id);
      
      if (canNavigate) {
        stepRefs.current[targetIndex]?.focus();
        break;
      }
      
      targetIndex = direction === 'next' ? targetIndex + 1 : targetIndex - 1;
    }
  };

  const getStepClasses = (stepId: number) => {
    const { isActive, isCompleted, canNavigate } = getStepState(stepId);
    
    const baseClasses = `
      relative ${config.circle} rounded-full flex items-center justify-center 
      transition-all duration-500 ease-in-out transform
    `;
    
    if (isCompleted) {
      return cn(
        baseClasses,
        'bg-teal-500 shadow-lg shadow-teal-500/30',
        canNavigate && 'cursor-pointer hover:bg-teal-400 hover:scale-110 hover:shadow-xl hover:shadow-teal-500/40',
        canNavigate && 'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900',
        canNavigate && 'active:scale-95 transition-transform'
      );
    }
    
    if (isActive) {
      return cn(
        baseClasses,
        'bg-teal-600 shadow-lg shadow-teal-600/30 scale-110 ring-4 ring-teal-500/20',
        'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900'
      );
    }
    
    if (canNavigate) {
      return cn(
        baseClasses,
        'bg-white/10 border border-white/20 cursor-pointer',
        'hover:bg-white/20 hover:scale-105 hover:border-white/30',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900',
        'active:scale-95 transition-transform'
      );
    }
    
    return cn(
      baseClasses,
      'bg-white/5 border border-white/10 cursor-not-allowed opacity-60'
    );
  };

  const getIconClasses = (stepId: number) => {
    const { isActive, isCompleted, canNavigate } = getStepState(stepId);
    
    if (isCompleted || isActive) {
      return cn(config.icon, 'text-white');
    }
    
    if (canNavigate) {
      return cn(config.icon, 'text-gray-300');
    }
    
    return cn(config.icon, 'text-gray-500');
  };

  const getConnectorClasses = (stepId: number) => {
    const isConnectorCompleted = currentStep > stepId;
    
    return cn(
      `flex-1 ${config.connector} mx-3 rounded-full transition-all duration-500`,
      isConnectorCompleted ? 'bg-teal-500 shadow-sm shadow-teal-500/30' : 'bg-white/10'
    );
  };

  const renderHorizontalSteps = () => (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const { isActive, isCompleted, canNavigate } = getStepState(step.id);

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {/* Step Circle */}
              <button
                ref={(el) => (stepRefs.current[index] = el)}
                onClick={() => handleStepClick(step.id)}
                onKeyDown={(e) => handleKeyDown(e, step.id)}
                disabled={!canNavigate}
                className={getStepClasses(step.id)}
                aria-label={`Step ${step.id}: ${step.title} - ${step.description}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
                aria-describedby={`step-${step.id}-description`}
                role="tab"
                aria-selected={isActive}
                tabIndex={canNavigate ? 0 : -1}
              >
                {isCompleted ? (
                  <Check className={cn(config.icon, 'text-white')} />
                ) : (
                  <StepIcon className={getIconClasses(step.id)} />
                )}
                
                {/* Active step pulse animation */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-20" />
                )}
              </button>
              
              {/* Step Labels */}
              <div className="mt-2 text-center" id={`step-${step.id}-description`}>
                <div className={cn(
                  config.title,
                  'font-medium transition-colors duration-300',
                  isActive ? 'text-teal-300' : 
                  isCompleted ? 'text-teal-400' : 
                  canNavigate ? 'text-gray-300' : 'text-gray-500'
                )}>
                  {step.title}
                </div>
                <div className={cn(
                  config.description,
                  'text-gray-400 mt-0.5 transition-colors duration-300',
                  isActive && 'text-gray-300'
                )}>
                  {step.description}
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={getConnectorClasses(step.id)} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderVerticalSteps = () => (
    <div className={cn('flex flex-col', config.spacing, className)}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const { isActive, isCompleted, canNavigate } = getStepState(step.id);

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <button
              ref={(el) => (stepRefs.current[index] = el)}
              onClick={() => handleStepClick(step.id)}
              onKeyDown={(e) => handleKeyDown(e, step.id)}
              disabled={!canNavigate}
              className={getStepClasses(step.id)}
              aria-label={`Step ${step.id}: ${step.title} - ${step.description}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
              aria-describedby={`step-${step.id}-description`}
              role="tab"
              aria-selected={isActive}
              tabIndex={canNavigate ? 0 : -1}
            >
              {isCompleted ? (
                <Check className={cn(config.icon, 'text-white')} />
              ) : (
                <StepIcon className={getIconClasses(step.id)} />
              )}
              
              {/* Active step pulse animation */}
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-20" />
              )}
            </button>
            
            {/* Step Content */}
            <div className="ml-4 flex-1" id={`step-${step.id}-description`}>
              <div className={cn(
                config.title,
                'font-medium transition-colors duration-300',
                isActive ? 'text-teal-300' : 
                isCompleted ? 'text-teal-400' : 
                canNavigate ? 'text-gray-300' : 'text-gray-500'
              )}>
                {step.title}
              </div>
              <div className={cn(
                config.description,
                'text-gray-400 transition-colors duration-300',
                isActive && 'text-gray-300'
              )}>
                {step.description}
              </div>
            </div>
            
            {/* Vertical Connector */}
            {index < steps.length - 1 && (
              <div className="absolute left-5 top-12 w-0.5 h-8 bg-white/10 transition-colors duration-500" />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            ref={progressBarRef}
            className="bg-gradient-to-r from-teal-600 to-teal-500 h-2 rounded-full transition-all duration-700 ease-out shadow-sm shadow-teal-500/30 relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div role="tablist" aria-label="Signup progress steps">
      {renderProgressBar()}
      {variant === 'horizontal' ? renderHorizontalSteps() : renderVerticalSteps()}
    </div>
  );
};

export default StepIndicator;