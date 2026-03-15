/**
 * Production validation utilities for onboarding forms.
 * Enforces length limits, numeric ranges, and format validation.
 */

// ── Length limits ──────────────────────────────────────
export const MAX_LENGTHS = {
  companyName: 200,
  ownerName: 150,
  address: 300,
  purpose: 500,
  email: 150,
  phone: 20,
  tradeLicenseNo: 50,
  licenseAuthority: 100,
  businessActivity: 200,
  passportNumber: 20,
  emiratesId: 20,
  nationality: 60,
} as const;

// ── String helpers ─────────────────────────────────────
export function clampString(value: string, maxLen: number): string {
  return value.slice(0, maxLen);
}

// ── Email validation ───────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim()) && email.trim().length <= MAX_LENGTHS.email;
}

// ── Phone validation ───────────────────────────────────
const PHONE_RE = /^[+\d\s\-()]{6,20}$/;
export function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone.trim());
}

// ── Numeric validation ─────────────────────────────────
export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isValidOwnership(pct: number): boolean {
  return pct >= 0 && pct <= 100;
}

export function isValidLoanAmount(amount: number): boolean {
  return amount > 0 && amount <= 500_000_000; // 500M cap
}

export function isValidYear(year: string): boolean {
  const n = parseInt(year, 10);
  if (isNaN(n)) return false;
  return n >= 1900 && n <= new Date().getFullYear();
}

export function isPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && value > 0;
}

// ── File upload validation ─────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type ".${ext}" is not allowed. Please upload PDF, JPG, or PNG files.` };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type) && file.type !== '') {
    return { valid: false, error: `Invalid file format. Please upload PDF, JPG, or PNG files.` };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File is ${sizeMB} MB. Maximum allowed size is 20 MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty.' };
  }

  return { valid: true };
}

// ── Aggregate form validation errors ───────────────────
export interface ValidationError {
  field: string;
  message: string;
}

export function validateBusinessDetails(data: {
  companyLegalName: string;
  yearOfEstablishment: string;
  officeAddress: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  if (data.companyLegalName.length > MAX_LENGTHS.companyName) {
    errors.push({ field: 'companyLegalName', message: `Company name must be under ${MAX_LENGTHS.companyName} characters` });
  }
  if (data.yearOfEstablishment && !isValidYear(data.yearOfEstablishment)) {
    errors.push({ field: 'yearOfEstablishment', message: `Year must be between 1900 and ${new Date().getFullYear()}` });
  }
  if (data.officeAddress.length > MAX_LENGTHS.address) {
    errors.push({ field: 'officeAddress', message: `Address must be under ${MAX_LENGTHS.address} characters` });
  }
  return errors;
}

export function validateOwner(owner: {
  ownerName: string;
  email: string;
  mobile: string;
  shareholdingPercent: number;
  address: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  if (owner.ownerName.length > MAX_LENGTHS.ownerName) {
    errors.push({ field: 'ownerName', message: `Name must be under ${MAX_LENGTHS.ownerName} characters` });
  }
  if (owner.email && !isValidEmail(owner.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  if (owner.mobile && !isValidPhone(owner.mobile)) {
    errors.push({ field: 'mobile', message: 'Please enter a valid phone number' });
  }
  if (!isValidOwnership(owner.shareholdingPercent)) {
    errors.push({ field: 'shareholdingPercent', message: 'Ownership must be between 0% and 100%' });
  }
  if (owner.address && owner.address.length > MAX_LENGTHS.address) {
    errors.push({ field: 'address', message: `Address must be under ${MAX_LENGTHS.address} characters` });
  }
  return errors;
}

export function validateLoanRequirement(data: {
  requiredLoanAmount: number;
  purpose: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isValidLoanAmount(data.requiredLoanAmount)) {
    errors.push({ field: 'requiredLoanAmount', message: 'Loan amount must be a positive number up to 500,000,000' });
  }
  if (data.purpose && data.purpose.length > MAX_LENGTHS.purpose) {
    errors.push({ field: 'purpose', message: `Purpose must be under ${MAX_LENGTHS.purpose} characters` });
  }
  return errors;
}
