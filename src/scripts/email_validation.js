/**
 * Email validation utility using regex
 * No external API calls - lightweight and free
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format using regex
 * @param {string} email
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'Email is required' };
  }

  if (trimmed.length > 254) {
    return { valid: false, reason: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  // Basic domain check - must have at least one dot after @
  const [, domain] = trimmed.split('@');
  if (!domain || !domain.includes('.')) {
    return { valid: false, reason: 'Invalid domain' };
  }

  return { valid: true };
}

/**
 * Validate multiple emails
 * @param {string[]} emails
 * @returns {{ valid: boolean, invalid: string[], errors: Record<string, string> }}
 */
export function validateEmails(emails) {
  if (!Array.isArray(emails)) {
    return { valid: false, invalid: [], errors: {} };
  }

  const invalid = [];
  const errors = {};

  for (const email of emails) {
    const result = validateEmail(email);
    if (!result.valid) {
      invalid.push(email);
      errors[email] = result.reason;
    }
  }

  return {
    valid: invalid.length === 0,
    invalid,
    errors,
  };
}