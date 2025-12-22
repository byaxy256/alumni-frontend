// Validation utilities for content management

import { ContentFormData, ValidationError, ContentError } from '../types/content';

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Content validation limits
const VALIDATION_LIMITS = {
  title: { min: 1, max: 200 },
  description: { min: 10, max: 500 },
  content: { max: 5000 },
  location: { max: 200 },
  imageUrl: { max: 1000 },
};

/**
 * Validate form data
 */
export const validateFormData = (data: ContentFormData, type: 'news' | 'event'): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (data.title.length < VALIDATION_LIMITS.title.min) {
    errors.push({ field: 'title', message: `Title must be at least ${VALIDATION_LIMITS.title.min} characters` });
  } else if (data.title.length > VALIDATION_LIMITS.title.max) {
    errors.push({ field: 'title', message: `Title must not exceed ${VALIDATION_LIMITS.title.max} characters` });
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (data.description.length < VALIDATION_LIMITS.description.min) {
    errors.push({ field: 'description', message: `Description must be at least ${VALIDATION_LIMITS.description.min} characters` });
  } else if (data.description.length > VALIDATION_LIMITS.description.max) {
    errors.push({ field: 'description', message: `Description must not exceed ${VALIDATION_LIMITS.description.max} characters` });
  }

  // Content validation (for news)
  if (type === 'news') {
    if (data.content && data.content.length > VALIDATION_LIMITS.content.max) {
      errors.push({ field: 'content', message: `Content must not exceed ${VALIDATION_LIMITS.content.max} characters` });
    }
  }

  // Event-specific validation
  if (type === 'event') {
    // Date validation
    if (!data.date) {
      errors.push({ field: 'date', message: 'Date is required for events' });
    } else {
      const eventDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        errors.push({ field: 'date', message: 'Event date cannot be in the past' });
      }
    }

    // Time validation
    if (!data.time) {
      errors.push({ field: 'time', message: 'Time is required for events' });
    }

    // Location validation
    if (data.location && data.location.length > VALIDATION_LIMITS.location.max) {
      errors.push({ field: 'location', message: `Location must not exceed ${VALIDATION_LIMITS.location.max} characters` });
    }
  }

  // Image URL validation
  if (data.imageUrl && data.imageUrl.trim().length > 0) {
    if (!URL_REGEX.test(data.imageUrl)) {
      errors.push({ field: 'imageUrl', message: 'Please provide a valid URL' });
    } else if (data.imageUrl.length > VALIDATION_LIMITS.imageUrl.max) {
      errors.push({ field: 'imageUrl', message: `Image URL must not exceed ${VALIDATION_LIMITS.imageUrl.max} characters` });
    }
  }

  return errors;
};

/**
 * Validate image URL
 */
export const validateImageUrl = (url: string): boolean => {
  if (!url || url.trim().length === 0) return true; // Optional field
  return URL_REGEX.test(url);
};

/**
 * Create content error from unknown error
 */
export const createContentError = (error: unknown): ContentError => {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
      };
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return {
        type: 'server',
        message: 'Server error occurred. Please try again later.',
      };
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return {
        type: 'validation',
        message: error.message,
      };
    }

    // Generic error
    return {
      type: 'unknown',
      message: error.message,
    };
  }

  // Unknown error type
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: ContentError): string => {
  switch (error.type) {
    case 'network':
      return 'Unable to connect to server. Please check your internet connection and try again.';
    case 'server':
      return 'Server is temporarily unavailable. Please try again later.';
    case 'validation':
      return `Validation error: ${error.message}`;
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Sanitize HTML content (basic XSS protection)
 */
export const sanitizeContent = (content: string): string => {
  return content
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate form state
 */
export const isFormValid = (data: ContentFormData, type: 'news' | 'event'): boolean => {
  const errors = validateFormData(data, type);
  return errors.length === 0;
};

/**
 * Get current date string (YYYY-MM-DD)
 */
export const getCurrentDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get future date string (YYYY-MM-DD)
 */
export const getFutureDateString = (daysFromNow: number = 7): string => {
  const future = new Date();
  future.setDate(future.getDate() + daysFromNow);
  const year = future.getFullYear();
  const month = String(future.getMonth() + 1).padStart(2, '0');
  const day = String(future.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Validate required fields
 */
export const hasRequiredFields = (data: ContentFormData): boolean => {
  return Boolean(data.title?.trim() && data.description?.trim());
};

/**
 * Check if URL is safe (basic validation)
 */
export const isSafeUrl = (url: string): boolean => {
  if (!url) return true; // Optional field
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

