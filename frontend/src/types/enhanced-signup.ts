// Enhanced Signup Flow Types and Interfaces

export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: ProductSubcategory[];
}

export interface ProductSubcategory {
  id: string;
  name: string;
  selected: boolean;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  check: (password: string) => boolean;
  met: boolean;
}

export interface ValidationError {
  message: string;
  type: 'required' | 'format' | 'strength' | 'match' | 'server';
  severity: 'error' | 'warning';
}

export interface ValidationErrors {
  [fieldName: string]: ValidationError | undefined;
}

export interface EnhancedSignupFormData {
  // Personal Info (Step 1)
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Store Info (Step 2)
  store_name: string;
  store_address: string;
  currency_code: string;
  profile_picture: string;
  
  // Business Categories (Step 3)
  business_category: string;
  product_subcategories: string[];
  skip_categories: boolean;
  
  // UI-only fields
  password_strength: 'weak' | 'medium' | 'strong';
  terms_accepted: boolean;
}

export interface ProgressState {
  completedSteps: number[];
  currentProgress: number;
  totalSteps: number;
}

export interface EnhancedSignupState {
  currentStep: number;
  formData: EnhancedSignupFormData;
  validation: ValidationErrors;
  progress: ProgressState;
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

// Action types for state management
export type EnhancedSignupAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<EnhancedSignupFormData> }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationErrors }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'TOGGLE_PASSWORD_VISIBILITY'; payload: 'password' | 'confirmPassword' }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<ProgressState> }
  | { type: 'RESET_FORM' };

// Registration payload for backend compatibility
export interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  profile_picture: string;
  store_name: string;
  store_address: string;
  currency_code: string;
}

// Category preferences for local storage
export interface CategoryPreferences {
  business_category: string;
  product_subcategories: string[];
  configured_at: string;
}

// Constants
export const TOTAL_STEPS = 4;

export const INITIAL_FORM_DATA: EnhancedSignupFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  store_name: '',
  store_address: '',
  currency_code: 'NPR',
  profile_picture: '',
  business_category: '',
  product_subcategories: [],
  skip_categories: false,
  password_strength: 'weak',
  terms_accepted: false,
};

export const INITIAL_PROGRESS_STATE: ProgressState = {
  completedSteps: [],
  currentProgress: 0,
  totalSteps: TOTAL_STEPS,
};

export const INITIAL_ENHANCED_SIGNUP_STATE: EnhancedSignupState = {
  currentStep: 1,
  formData: INITIAL_FORM_DATA,
  validation: {},
  progress: INITIAL_PROGRESS_STATE,
  isSubmitting: false,
  showPassword: false,
  showConfirmPassword: false,
};