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
  return amount > 0 && amount < 1_000_000_000; // under 1 billion
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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

// Magic byte signatures for file type verification
const MAGIC_BYTES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],       // %PDF
  jpg: [0xFF, 0xD8, 0xFF],              // JPEG SOI
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],        // PNG signature
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/** Synchronous pre-checks (extension, MIME, size) */
export function validateFile(file: File): FileValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type ".${ext}" is not allowed. Please upload PDF, JPG, or PNG files.` };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type) && file.type !== '') {
    return { valid: false, error: 'Invalid file type. Only PDF, JPG, and PNG files up to 15MB are allowed.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File is ${sizeMB} MB. Maximum allowed size is 15 MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty.' };
  }

  return { valid: true };
}

/** Deep validation: reads file header bytes to verify magic signature */
export async function validateFileDeep(file: File): Promise<FileValidationResult> {
  // Run basic checks first
  const basic = validateFile(file);
  if (!basic.valid) return basic;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedBytes = MAGIC_BYTES[ext];
  if (!expectedBytes) {
    return { valid: false, error: 'Invalid file type. Only PDF, JPG, and PNG files up to 15MB are allowed.' };
  }

  try {
    const headerSlice = file.slice(0, expectedBytes.length);
    const buffer = await headerSlice.arrayBuffer();
    const header = new Uint8Array(buffer);

    for (let i = 0; i < expectedBytes.length; i++) {
      if (header[i] !== expectedBytes[i]) {
        return { valid: false, error: 'Invalid file type. Only PDF, JPG, and PNG files up to 15MB are allowed.' };
      }
    }
  } catch {
    return { valid: false, error: 'Unable to read file. Please try again.' };
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
    errors.push({ field: 'requiredLoanAmount', message: 'Loan amount must be between 1 and 999,999,999' });
  }
  if (data.purpose && data.purpose.length > MAX_LENGTHS.purpose) {
    errors.push({ field: 'purpose', message: `Purpose must be under ${MAX_LENGTHS.purpose} characters` });
  }
  return errors;
}

export function validateTurnover(value: number | null | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  if (value !== null && value !== undefined && value < 0) {
    errors.push({ field: 'turnover', message: 'Turnover must be a positive value' });
  }
  return errors;
}

/**
 * Validate entire case data before save. Returns all errors found.
 */
export function validateCaseData(formData: {
  businessDetails: { companyLegalName: string; yearOfEstablishment: string; officeAddress: string };
  owners: Array<{ ownerName: string; email: string; mobile: string; shareholdingPercent: number; address: string }>;
  loanRequirement: { requiredLoanAmount: number; purpose: string };
  bankingTurnover: { monthlyAvgTurnover: number; annualVatTurnover?: number | null; posMonthlyTurnover?: number | null };
}): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...validateBusinessDetails(formData.businessDetails));

  formData.owners.forEach((owner, i) => {
    const ownerErrors = validateOwner(owner);
    ownerErrors.forEach(e => errors.push({ field: `owner[${i}].${e.field}`, message: e.message }));
  });

  errors.push(...validateLoanRequirement(formData.loanRequirement));

  errors.push(...validateTurnover(formData.bankingTurnover.monthlyAvgTurnover));
  errors.push(...validateTurnover(formData.bankingTurnover.annualVatTurnover));
  errors.push(...validateTurnover(formData.bankingTurnover.posMonthlyTurnover));

  return errors;
}
