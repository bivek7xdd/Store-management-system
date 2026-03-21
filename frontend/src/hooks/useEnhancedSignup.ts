import { useReducer, useCallback, useEffect } from "react";
import {
  EnhancedSignupState,
  EnhancedSignupAction,
  EnhancedSignupFormData,
  ValidationErrors,
  ProgressState,
  INITIAL_ENHANCED_SIGNUP_STATE,
  TOTAL_STEPS,
} from "@/types/enhanced-signup";
import {
  validateFieldRealTime,
  calculatePasswordStrength,
} from "@/utils/signupValidation";

// Local storage key for form data persistence
const FORM_DATA_STORAGE_KEY = "enhanced-signup-form-data";

// Reducer function for state management
function enhancedSignupReducer(
  state: EnhancedSignupState,
  action: EnhancedSignupAction,
): EnhancedSignupState {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };

    case "UPDATE_FORM_DATA":
      const updatedFormData = {
        ...state.formData,
        ...action.payload,
      };
      return {
        ...state,
        formData: updatedFormData,
      };

    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        validation: action.payload,
      };

    case "CLEAR_VALIDATION_ERROR":
      const { [action.payload]: removed, ...remainingErrors } =
        state.validation;
      return {
        ...state,
        validation: remainingErrors,
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case "TOGGLE_PASSWORD_VISIBILITY":
      if (action.payload === "password") {
        return {
          ...state,
          showPassword: !state.showPassword,
        };
      } else {
        return {
          ...state,
          showConfirmPassword: !state.showConfirmPassword,
        };
      }

    case "UPDATE_PROGRESS":
      return {
        ...state,
        progress: {
          ...state.progress,
          ...action.payload,
        },
      };

    case "RESET_FORM":
      return INITIAL_ENHANCED_SIGNUP_STATE;

    default:
      return state;
  }
}

// Custom hook for enhanced signup state management
export function useEnhancedSignup() {
  const [state, dispatch] = useReducer(
    enhancedSignupReducer,
    INITIAL_ENHANCED_SIGNUP_STATE,
  );

  // Load persisted form data on initialization
  useEffect(() => {
    const savedFormData = localStorage.getItem(FORM_DATA_STORAGE_KEY);
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        dispatch({ type: "UPDATE_FORM_DATA", payload: parsedData });
      } catch (error) {
        console.warn("Failed to parse saved form data:", error);
        localStorage.removeItem(FORM_DATA_STORAGE_KEY);
      }
    }
  }, []);

  // Persist form data whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(state.formData));
  }, [state.formData]);

  // Calculate progress whenever current step changes
  useEffect(() => {
    const currentProgress = Math.round((state.currentStep / TOTAL_STEPS) * 100);
    const completedSteps = Array.from(
      { length: state.currentStep - 1 },
      (_, i) => i + 1,
    );

    dispatch({
      type: "UPDATE_PROGRESS",
      payload: {
        currentProgress,
        completedSteps,
      },
    });
  }, [state.currentStep]);

  // Action creators
  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, []);

  const updateFormData = useCallback(
    (data: Partial<EnhancedSignupFormData>) => {
      dispatch({ type: "UPDATE_FORM_DATA", payload: data });
    },
    [],
  );

  const setValidationErrors = useCallback((errors: ValidationErrors) => {
    dispatch({ type: "SET_VALIDATION_ERRORS", payload: errors });
  }, []);

  const clearValidationError = useCallback((fieldName: string) => {
    dispatch({ type: "CLEAR_VALIDATION_ERROR", payload: fieldName });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: "SET_SUBMITTING", payload: isSubmitting });
  }, []);

  const togglePasswordVisibility = useCallback(
    (field: "password" | "confirmPassword") => {
      dispatch({ type: "TOGGLE_PASSWORD_VISIBILITY", payload: field });
    },
    [],
  );

  const updateProgress = useCallback((progress: Partial<ProgressState>) => {
    dispatch({ type: "UPDATE_PROGRESS", payload: progress });
  }, []);

  const resetForm = useCallback(() => {
    localStorage.removeItem(FORM_DATA_STORAGE_KEY);
    dispatch({ type: "RESET_FORM" });
  }, []);

  // Helper function to handle input changes with real-time validation
  const handleInputChange = useCallback(
    (
      field: keyof EnhancedSignupFormData,
      value: string | string[] | boolean,
    ) => {
      // Update form data
      updateFormData({ [field]: value });

      // Update password strength if it's a password field
      if (field === "password" && typeof value === "string") {
        const strength = calculatePasswordStrength(value);
        updateFormData({ password_strength: strength });
      }

      // Clear validation error for this field if it exists
      if (state.validation[field]) {
        clearValidationError(field);
      }
    },
    [updateFormData, clearValidationError, state.validation],
  );

  // Helper function to handle field blur with validation
  const handleFieldBlur = useCallback(
    (field: keyof EnhancedSignupFormData) => {
      const fieldValue = state.formData[field];
      const errors = validateFieldRealTime(field, fieldValue, state.formData);

      if (Object.keys(errors).length > 0) {
        setValidationErrors({ ...state.validation, ...errors });
      }
    },
    [state.formData, state.validation, setValidationErrors],
  );

  // Helper function to handle select changes
  const handleSelectChange = useCallback(
    (name: string, value: string) => {
      updateFormData({ [name]: value });

      // Clear validation error for this field if it exists
      if (state.validation[name]) {
        clearValidationError(name);
      }
    },
    [updateFormData, clearValidationError, state.validation],
  );

  return {
    // State
    state,

    // Actions
    setCurrentStep,
    updateFormData,
    setValidationErrors,
    clearValidationError,
    setSubmitting,
    togglePasswordVisibility,
    updateProgress,
    resetForm,

    // Helper functions
    handleInputChange,
    handleFieldBlur,
    handleSelectChange,
  };
}

