# Enhanced Signup Flow Design Document

## Overview

The enhanced signup flow transforms the current single-form registration into a guided, multi-step onboarding experience. This design builds upon the existing backend infrastructure while introducing a more sophisticated frontend flow that includes business category selection, product type configuration, and enhanced user experience elements.

The design maintains compatibility with the current backend API structure while extending the frontend to collect additional business context that can be used for future system personalization and configuration.

## Architecture

### Frontend Architecture

```
Enhanced Signup Flow
├── Step 1: Personal & Account Details
│   ├── Name, Email, Phone
│   ├── Password Creation with Strength Indicator
│   └── Real-time Validation
├── Step 2: Store Information
│   ├── Store Name & Address
│   ├── Currency Selection
│   └── Business Category Selection
├── Step 3: Product Categories (New)
│   ├── Primary Business Category
│   ├── Product Subcategories
│   └── Skip Option
├── Step 4: Review & Security
│   ├── Information Review
│   ├── Password Confirmation
│   └── Final Submission
└── Success: OTP Verification (Existing)
```

### State Management

The signup flow will use React state management with the following structure:

```typescript
interface EnhancedSignupState {
  currentStep: number;
  formData: {
    // Personal Info
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    
    // Store Info
    store_name: string;
    store_address: string;
    currency_code: string;
    
    // New: Business Categories
    business_category: string;
    product_subcategories: string[];
    
    // UI State
    skipCategories: boolean;
  };
  validation: {
    [key: string]: string | undefined;
  };
  progress: {
    completedSteps: number[];
    currentProgress: number;
  };
}
```

## Components and Interfaces

### Core Components

#### 1. EnhancedSignupContainer
- **Purpose**: Main container managing the entire signup flow
- **Responsibilities**:
  - Step navigation and state management
  - Form data persistence across steps
  - Progress tracking and validation
  - API integration for final submission

#### 2. StepIndicator
- **Purpose**: Visual progress indicator
- **Features**:
  - Progress bar with percentage completion
  - Step numbers with completion status
  - Step titles and descriptions
  - Interactive navigation for completed steps

#### 3. PersonalDetailsStep (Enhanced Step 1)
- **Purpose**: Collect user personal information
- **Enhancements**:
  - Real-time password strength indicator
  - Enhanced validation feedback
  - Improved visual design with icons
  - Better error messaging

#### 4. StoreInformationStep (Enhanced Step 2)
- **Purpose**: Collect store details and basic business info
- **Features**:
  - Store name and address fields
  - Currency selection with visual symbols
  - Business category selection (new)
  - Form validation with contextual help

#### 5. ProductCategoriesStep (New Step 3)
- **Purpose**: Configure product categories for inventory setup
- **Features**:
  - Primary business category selection with icons
  - Dynamic subcategory display based on primary selection
  - Multi-select subcategories with visual feedback
  - "Skip for now" option with explanation
  - "Select all that apply" functionality

#### 6. ReviewConfirmationStep (Enhanced Step 4)
- **Purpose**: Final review and confirmation
- **Features**:
  - Organized information display in cards
  - Edit functionality linking back to relevant steps
  - Password confirmation field
  - Final submission with loading states

### Business Category Configuration

#### Primary Categories
```typescript
interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  subcategories: ProductSubcategory[];
}

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    description: 'Fresh food & pantry',
    icon: ShoppingCart,
    subcategories: [
      { id: 'fresh-produce', name: 'Fresh Produce', selected: false },
      { id: 'dairy', name: 'Dairy', selected: false },
      { id: 'beverages', name: 'Beverages', selected: false },
      { id: 'bakery', name: 'Bakery', selected: false },
      { id: 'frozen-foods', name: 'Frozen Foods', selected: false },
      { id: 'canned-goods', name: 'Canned Goods', selected: false },
      { id: 'meat-poultry', name: 'Meat & Poultry', selected: false }
    ]
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Gadgets & appliances',
    icon: Smartphone,
    subcategories: [
      { id: 'mobile-phones', name: 'Mobile Phones', selected: false },
      { id: 'computers', name: 'Computers', selected: false },
      { id: 'home-appliances', name: 'Home Appliances', selected: false },
      { id: 'accessories', name: 'Accessories', selected: false }
    ]
  },
  {
    id: 'apparel-fashion',
    name: 'Apparel & Fashion',
    description: 'Clothing & accessories',
    icon: Shirt,
    subcategories: [
      { id: 'mens-clothing', name: "Men's Clothing", selected: false },
      { id: 'womens-clothing', name: "Women's Clothing", selected: false },
      { id: 'kids-clothing', name: "Kids' Clothing", selected: false },
      { id: 'shoes', name: 'Shoes', selected: false },
      { id: 'accessories', name: 'Accessories', selected: false }
    ]
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    description: 'Decor, tools & plants',
    icon: Home,
    subcategories: [
      { id: 'furniture', name: 'Furniture', selected: false },
      { id: 'home-decor', name: 'Home Decor', selected: false },
      { id: 'garden-tools', name: 'Garden Tools', selected: false },
      { id: 'plants', name: 'Plants', selected: false }
    ]
  }
];
```

## Data Models

### Enhanced Form Data Structure

```typescript
interface EnhancedSignupFormData {
  // Existing fields (compatible with current backend)
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  store_name: string;
  store_address: string;
  currency_code: string;
  profile_picture: string; // Default empty string
  
  // New fields for enhanced experience
  business_category: string;
  product_subcategories: string[];
  skip_categories: boolean;
  
  // UI-only fields
  password_strength: 'weak' | 'medium' | 'strong';
  terms_accepted: boolean;
}
```

### Backend Integration

The enhanced signup will maintain compatibility with the existing backend by:

1. **Primary Registration**: Submit core user and store data to existing `/users/register` endpoint
2. **Category Storage**: Store business category preferences in localStorage for post-registration configuration
3. **Future Enhancement**: Categories can be saved to database once category management features are implemented

```typescript
// Registration payload (existing format)
interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  profile_picture: string;
  store_name: string;
  store_address: string;
  currency_code: string;
}

// Category preferences (stored locally for now)
interface CategoryPreferences {
  business_category: string;
  product_subcategories: string[];
  configured_at: string;
}
```

## Error Handling

### Validation Strategy

1. **Real-time Validation**: Immediate feedback as user types
2. **Step Validation**: Comprehensive validation before step progression
3. **Final Validation**: Complete form validation before submission
4. **Server Validation**: Handle backend validation errors gracefully

### Error States

```typescript
interface ValidationErrors {
  [fieldName: string]: {
    message: string;
    type: 'required' | 'format' | 'strength' | 'match' | 'server';
    severity: 'error' | 'warning';
  };
}
```

### Password Strength Validation

```typescript
interface PasswordRequirement {
  id: string;
  label: string;
  check: (password: string) => boolean;
  met: boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: 'length', label: 'At least 8 characters', check: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', check: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', check: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', check: (p) => /\d/.test(p) },
  { id: 'special', label: 'One special character', check: (p) => /[@$!%*?&]/.test(p) }
];
```

## Testing Strategy

### Unit Testing
- Individual component functionality
- Form validation logic
- State management operations
- Password strength calculations

### Integration Testing
- Step navigation flow
- Form data persistence
- API integration
- Error handling scenarios

### User Experience Testing
- Multi-step flow completion
- Form validation feedback
- Responsive design across devices
- Accessibility compliance

### Test Scenarios

1. **Happy Path**: Complete signup with all steps
2. **Skip Categories**: Complete signup skipping category selection
3. **Navigation**: Move between steps and maintain data
4. **Validation**: Test all validation scenarios
5. **Error Recovery**: Handle API errors gracefully
6. **Responsive**: Test on mobile and desktop

## Visual Design Enhancements

### Design System

```typescript
const DESIGN_TOKENS = {
  colors: {
    primary: '#0d9488', // Teal-600
    primaryLight: '#14b8a6', // Teal-500
    success: '#059669', // Emerald-600
    background: 'rgba(15, 23, 42, 0.7)', // Slate with opacity
    cardBackground: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  spacing: {
    step: '2rem',
    section: '1.5rem',
    element: '1rem'
  },
  animation: {
    stepTransition: '0.3s ease-in-out',
    progressUpdate: '0.5s ease-out',
    validation: '0.2s ease-in-out'
  }
};
```

### Animation Strategy

1. **Step Transitions**: Smooth slide animations between steps
2. **Progress Updates**: Animated progress bar updates
3. **Validation Feedback**: Subtle animations for validation states
4. **Category Selection**: Hover and selection animations
5. **Loading States**: Spinner and skeleton loading animations

### Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Progressive Enhancement**: Enhanced features for larger screens
- **Touch Friendly**: Appropriate touch targets and gestures
- **Accessibility**: WCAG 2.1 AA compliance

## Implementation Phases

### Phase 1: Core Multi-Step Structure
- Implement basic 4-step flow
- Add step navigation and progress indication
- Enhance existing form fields with better validation

### Phase 2: Category Selection
- Add business category selection interface
- Implement product subcategory selection
- Add skip functionality

### Phase 3: Enhanced UX
- Add animations and transitions
- Implement password strength indicator
- Add comprehensive review step

### Phase 4: Polish & Testing
- Comprehensive testing across devices
- Performance optimization
- Accessibility improvements
- Error handling refinement