/**
 * File validation utilities for PDF upload
 */

export interface FileValidationError {
  code:
    | "INVALID_TYPE"
    | "TOO_LARGE"
    | "MULTIPLE_FILES"
    | "PASSWORD_PROTECTED"
    | "INVALID_PDF";
  message: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: FileValidationError;
}

const BYTES_IN_KB = 1024;
const BYTES_IN_MB = BYTES_IN_KB * BYTES_IN_KB;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * BYTES_IN_MB; // 5MB in bytes
const ALLOWED_TYPE = "application/pdf";
const PDF_HEADER_CHECK_SIZE = 1024;

/**
 * Validates a single file for PDF upload requirements
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (file.type !== ALLOWED_TYPE) {
    return {
      valid: false,
      error: {
        code: "INVALID_TYPE",
        message: "Only PDF files are allowed",
      },
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: {
        code: "TOO_LARGE",
        message: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validates a FileList for PDF upload requirements
 */
export function validateFiles(files: FileList | File[]): FileValidationResult {
  const fileArray = Array.from(files);

  // Check if multiple files
  if (fileArray.length > 1) {
    return {
      valid: false,
      error: {
        code: "MULTIPLE_FILES",
        message: "Only one file at a time is allowed",
      },
    };
  }

  // Check if no files
  if (fileArray.length === 0) {
    return {
      valid: false,
      error: {
        code: "INVALID_PDF",
        message: "No file selected",
      },
    };
  }

  // Validate the single file
  return validateFile(fileArray[0]);
}

/**
 * Checks if a PDF file is password protected by attempting to read its structure
 * This is a basic check - more sophisticated validation would require a PDF library
 */
export async function checkPDFPasswordProtection(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert first bytes to string to check for encryption markers
    const header = String.fromCharCode(
      ...uint8Array.slice(0, PDF_HEADER_CHECK_SIZE)
    );

    // Basic check for encryption/password protection indicators
    // This is a simplified check - real implementation might need PDF parsing
    const hasEncryption =
      header.includes("/Encrypt") ||
      header.includes("/Filter/Standard") ||
      header.includes("/U ") ||
      header.includes("/O ");

    return hasEncryption;
  } catch (error) {
    // If we can't read the file, assume it might be protected
    return true;
  }
}

/**
 * Complete file validation including password protection check
 */
export async function validatePDFFile(
  file: File
): Promise<FileValidationResult> {
  // Basic validation first
  const basicValidation = validateFile(file);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Check for password protection
  try {
    const isPasswordProtected = await checkPDFPasswordProtection(file);
    if (isPasswordProtected) {
      return {
        valid: false,
        error: {
          code: "PASSWORD_PROTECTED",
          message: "Password-protected PDFs are not allowed",
        },
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: {
        code: "INVALID_PDF",
        message: "Unable to validate PDF file",
      },
    };
  }

  return { valid: true };
}
