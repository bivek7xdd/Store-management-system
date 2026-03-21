import React, { useRef, useEffect } from 'react';
import { Check, User, Store, ShoppingCart, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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

  useEffect(() => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    if (currentStepIndex !== -1 && stepRefs.current[currentStepIndex]) {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.getAttribute('role') === 'tab') {
        stepRefs.current[currentStepIndex]?.focus();
      }
    }
  }, [currentStep, steps]);

  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      const progressBar = progressBarRef.current;
      progressBar.style.transform = 'scaleY(1.1)';
      progressBar.style.transition = 'transform 0.2s ease-out';
      setTimeout(() => {
        progressBar.style.transform = 'scaleY(1)';
      }, 200);
    }
  }, [progressPercentage]);

  const sizeConfig = {
    sm: { circle: 32, icon: 16, title: '0.75rem', description: '0.7rem', connector: 2 },
    md: { circle: 40, icon: 20, title: '0.85rem', description: '0.75rem', connector: 2 },
    lg: { circle: 48, icon: 24, title: '1rem', description: '0.85rem', connector: 4 },
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

  const getCircleStyle = (stepId: number): React.CSSProperties => {
    const { isActive, isCompleted, canNavigate } = getStepState(stepId);

    const base: React.CSSProperties = {
      position: 'relative',
      width: config.circle,
      height: config.circle,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.4s ease',
      border: 'none',
      outline: 'none',
      padding: 0,
    };

    if (isCompleted) {
      return {
        ...base,
        background: '#b89767',
        boxShadow: '0 4px 12px rgba(184, 151, 103, 0.3)',
        cursor: canNavigate ? 'pointer' : 'default',
      };
    }

    if (isActive) {
      return {
        ...base,
        background: '#1a1a1a',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 4px rgba(184, 151, 103, 0.15)',
      };
    }

    if (canNavigate) {
      return {
        ...base,
        background: 'rgba(229, 224, 209, 0.5)',
        border: '1px solid #d4cbb8',
        cursor: 'pointer',
      };
    }

    return {
      ...base,
      background: 'rgba(229, 224, 209, 0.3)',
      border: '1px solid #e5e0d1',
      cursor: 'not-allowed',
      opacity: 0.5,
    };
  };

  const getIconColor = (stepId: number): string => {
    const { isActive, isCompleted, canNavigate } = getStepState(stepId);
    if (isCompleted || isActive) return '#ffffff';
    if (canNavigate) return '#888';
    return '#bbb';
  };

  const getTitleColor = (stepId: number): string => {
    const { isActive, isCompleted, canNavigate } = getStepState(stepId);
    if (isActive) return '#1a1a1a';
    if (isCompleted) return '#b89767';
    if (canNavigate) return '#666';
    return '#bbb';
  };

  const renderHorizontalSteps = () => (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const { isActive, isCompleted, canNavigate } = getStepState(step.id);

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                ref={(el) => (stepRefs.current[index] = el)}
                onClick={() => handleStepClick(step.id)}
                onKeyDown={(e) => handleKeyDown(e, step.id)}
                disabled={!canNavigate}
                style={getCircleStyle(step.id)}
                aria-label={`Step ${step.id}: ${step.title} - ${step.description}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
                aria-describedby={`step-${step.id}-description`}
                role="tab"
                aria-selected={isActive}
                tabIndex={canNavigate ? 0 : -1}
              >
                {isCompleted ? (
                  <Check style={{ width: config.icon, height: config.icon, color: '#fff' }} />
                ) : (
                  <StepIcon
                    style={{ width: config.icon, height: config.icon, color: getIconColor(step.id) }}
                  />
                )}

                {/* Active step pulse */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'rgba(184, 151, 103, 0.2)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </button>

              {/* Step Labels */}
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }} id={`step-${step.id}-description`}>
                <div
                  style={{
                    fontSize: config.title,
                    fontWeight: 500,
                    color: getTitleColor(step.id),
                    transition: 'color 0.3s ease',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: config.description,
                    color: isActive ? '#888' : '#bbb',
                    marginTop: '0.125rem',
                    transition: 'color 0.3s ease',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: config.connector,
                  margin: '0 0.75rem',
                  borderRadius: '9999px',
                  transition: 'all 0.4s ease',
                  background: currentStep > step.id
                    ? 'linear-gradient(90deg, #b89767, #d9b99b)'
                    : '#e5e0d1',
                  boxShadow: currentStep > step.id ? '0 1px 4px rgba(184, 151, 103, 0.2)' : 'none',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderVerticalSteps = () => (
    <div className={cn('flex flex-col gap-3', className)}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const { isActive, isCompleted, canNavigate } = getStepState(step.id);

        return (
          <div key={step.id} className="flex items-center">
            <button
              ref={(el) => (stepRefs.current[index] = el)}
              onClick={() => handleStepClick(step.id)}
              onKeyDown={(e) => handleKeyDown(e, step.id)}
              disabled={!canNavigate}
              style={getCircleStyle(step.id)}
              aria-label={`Step ${step.id}: ${step.title} - ${step.description}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
              aria-describedby={`step-${step.id}-description`}
              role="tab"
              aria-selected={isActive}
              tabIndex={canNavigate ? 0 : -1}
            >
              {isCompleted ? (
                <Check style={{ width: config.icon, height: config.icon, color: '#fff' }} />
              ) : (
                <StepIcon
                  style={{ width: config.icon, height: config.icon, color: getIconColor(step.id) }}
                />
              )}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(184, 151, 103, 0.2)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </button>

            <div style={{ marginLeft: '1rem', flex: 1 }} id={`step-${step.id}-description`}>
              <div
                style={{
                  fontSize: config.title,
                  fontWeight: 500,
                  color: getTitleColor(step.id),
                  transition: 'color 0.3s ease',
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontSize: config.description,
                  color: isActive ? '#888' : '#bbb',
                  transition: 'color 0.3s ease',
                }}
              >
                {step.description}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '48px',
                  width: '2px',
                  height: '32px',
                  background: '#e5e0d1',
                  transition: 'background 0.4s ease',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div
          style={{
            width: '100%',
            background: '#e5e0d1',
            borderRadius: '9999px',
            height: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            ref={progressBarRef}
            style={{
              background: 'linear-gradient(90deg, #b89767, #d9b99b)',
              height: '6px',
              borderRadius: '9999px',
              transition: 'width 0.7s ease-out',
              width: `${progressPercentage}%`,
              position: 'relative',
              boxShadow: '0 1px 4px rgba(184, 151, 103, 0.3)',
            }}
          >
            {/* Shine effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div role="tablist" aria-label="Signup progress steps">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      {renderProgressBar()}
      {variant === 'horizontal' ? renderHorizontalSteps() : renderVerticalSteps()}
    </div>
  );
};

export default StepIndicator;