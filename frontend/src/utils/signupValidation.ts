import { EnhancedSignupFormData, ValidationErrors, PasswordRequirement } from '@/types/enhanced-signup';

// Password requirements configuration
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { 
    id: 'length', 
    label: 'At least 8 characters', 
    check: (password: string) => password.length >= 8,
    met: false
  },
  { 
    id: 'upper', 
    label: 'One uppercase letter', 
    check: (password: string) => /[A-Z]/.test(password),
    met: false
  },
  { 
    id: 'lower', 
    label: 'One lowercase letter', 
    check: (password: string) => /[a-z]/.test(password),
    met: false
  },
  { 
    id: 'number', 
    label: 'One number', 
    check: (password: string) => /\d/.test(password),
    met: false
  },
  { 
    id: 'special', 
    label: 'One special character (@$!%*?&)', 
    check: (password: string) => /[@$!%*?&]/.test(password),
    met: false
  },
];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength calculation
export function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const metRequirements = PASSWORD_REQUIREMENTS.filter(req => req.check(password)).length;
  
  if (metRequirements < 3) return 'weak';
  if (metRequirements < 5) return 'medium';
  return 'strong';
}

// Get password requirements with current status
export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return PASSWORD_REQUIREMENTS.map(req => ({
    ...req,
    met: req.check(password)
  }));
}

// Validate individual fields
export function validateField(fieldName: keyof EnhancedSignupFormData, value: any, formData: EnhancedSignupFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  switch (fieldName) {
    case 'name':
      if (!value || !value.trim()) {
        errors.name = { message: 'Full name is required', type: 'required', severity: 'error' };
      }
      break;

    case 'email':
      if (!value || !value.trim()) {
        errors.email = { message: 'Email is required', type: 'required', severity: 'error' };
      } else if (!EMAIL_REGEX.test(value)) {
        errors.email = { message: 'Please enter a valid email address', type: 'format', severity: 'error' };
      }
      break;

    case 'phone':
      if (!value || !value.trim()) {
        errors.phone = { message: 'Phone number is required', type: 'required', severity: 'error' };
      }
      break;

    case 'password':
      if (!value) {
        errors.password = { message: 'Password is required', type: 'required', severity: 'error' };
      } else {
        const strength = calculatePasswordStrength(value);
        if (strength === 'weak') {
          errors.password = { message: 'Password is too weak', type: 'strength', severity: 'error' };
        }
      }
      break;

    case 'confirmPassword':
      if (!value) {
        errors.confirmPassword = { message: 'Please confirm your password', type: 'required', severity: 'error' };
      } else if (value !== formData.password) {
        errors.confirmPassword = { message: 'Passwords do not match', type: 'match', severity: 'error' };
      }
      break;

    case 'store_name':
      if (!value || !value.trim()) {
        errors.store_name = { message: 'Store name is required', type: 'required', severity: 'error' };
      }
      break;

    case 'store_address':
      if (!value || !value.trim()) {
        errors.store_address = { message: 'Store address is required', type: 'required', severity: 'error' };
      }
      break;

    case 'currency_code':
      if (!value) {
        errors.currency_code = { message: 'Please select a currency', type: 'required', severity: 'error' };
      }
      break;

    default:
      break;
  }

  return errors;
}

// Validate entire step
export function validateStep(step: number, formData: EnhancedSignupFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (step === 1) {
    // Personal details validation
    const fieldsToValidate: (keyof EnhancedSignupFormData)[] = [
      'name', 'email', 'phone', 'password', 'confirmPassword'
    ];

    fieldsToValidate.forEach(field => {
      const fieldErrors = validateField(field, formData[field], formData);
      Object.assign(errors, fieldErrors);
    });
  }

  if (step === 2) {
    // Store information validation
    const fieldsToValidate: (keyof EnhancedSignupFormData)[] = [
      'store_name', 'store_address', 'currency_code'
    ];

    fieldsToValidate.forEach(field => {
      const fieldErrors = validateField(field, formData[field], formData);
      Object.assign(errors, fieldErrors);
    });
  }

  if (step === 3) {
    // Business categories validation (optional step)
    // No required validation for categories as they can be skipped
  }

  if (step === 4) {
    // Review step - validate all previous steps
    const allFieldsToValidate: (keyof EnhancedSignupFormData)[] = [
      'name', 'email', 'phone', 'password', 'confirmPassword',
      'store_name', 'store_address', 'currency_code'
    ];

    allFieldsToValidate.forEach(field => {
      const fieldErrors = validateField(field, formData[field], formData);
      Object.assign(errors, fieldErrors);
    });
  }

  return errors;
}

// Real-time validation for individual fields
export function validateFieldRealTime(fieldName: keyof EnhancedSignupFormData, value: any, formData: EnhancedSignupFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  switch (fieldName) {
    case 'name':
      if (value && value.trim().length > 0 && value.trim().length < 2) {
        errors.name = { message: 'Name must be at least 2 characters', type: 'format', severity: 'error' };
      }
      break;

    case 'email':
      if (value && value.trim().length > 0 && !EMAIL_REGEX.test(value)) {
        errors.email = { message: 'Please enter a valid email address', type: 'format', severity: 'error' };
      }
      break;

    case 'phone':
      if (value && value.trim().length > 0 && value.trim().length < 10) {
        errors.phone = { message: 'Phone number must be at least 10 digits', type: 'format', severity: 'error' };
      }
      break;

    case 'password':
      if (value && value.length > 0) {
        const strength = calculatePasswordStrength(value);
        if (strength === 'weak') {
          errors.password = { message: 'Password is too weak', type: 'strength', severity: 'warning' };
        }
      }
      break;

    case 'confirmPassword':
      if (value && value.length > 0 && value !== formData.password) {
        errors.confirmPassword = { message: 'Passwords do not match', type: 'match', severity: 'error' };
      }
      break;

    default:
      break;
  }

  return errors;
}

// Check if step can be progressed to
export function canProgressToStep(targetStep: number, formData: EnhancedSignupFormData): boolean {
  // Can always go to step 1
  if (targetStep <= 1) return true;

  // To go to step 2, step 1 must be valid
  if (targetStep === 2) {
    const step1Errors = validateStep(1, formData);
    return Object.keys(step1Errors).length === 0;
  }

  // To go to step 3, steps 1 and 2 must be valid
  if (targetStep === 3) {
    const step1Errors = validateStep(1, formData);
    const step2Errors = validateStep(2, formData);
    return Object.keys(step1Errors).length === 0 && Object.keys(step2Errors).length === 0;
  }

  // To go to step 4, steps 1 and 2 must be valid (step 3 is optional)
  if (targetStep === 4) {
    const step1Errors = validateStep(1, formData);
    const step2Errors = validateStep(2, formData);
    return Object.keys(step1Errors).length === 0 && Object.keys(step2Errors).length === 0;
  }

  return false;
}