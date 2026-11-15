/**
 * Authentication Utility Functions
 * 
 * This module provides helper functions for authentication operations
 * including OTP generation, token creation, and OTP verification.
 * 
 * Note: This is a mock authentication system. In production, you would use
 * proper JWT libraries, secure OTP services, and encrypted storage.
 */

/**
 * Generates a random 6-digit OTP (One-Time Password)
 * 
 * OTPs are used for email verification in the registration/login flow.
 * They expire after a set time period for security.
 * 
 * @returns 6-digit numeric string (e.g., "123456")
 * 
 * Usage:
 * const otp = generateOTP(); // Returns "123456"
 */
export function generateOTP(): string {
  // Generate a random 6-digit number
  // Math.random() generates 0-1, multiply by 900000 to get 0-899999
  // Add 100000 to ensure it's always 6 digits (100000-999999)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Generates a mock JWT-like token for session management
 * 
 * In production, use a proper JWT library like 'jsonwebtoken'.
 * This mock version creates a random string that serves as a session token.
 * 
 * @param userId - ID of the user to create token for
 * @param role - Role of the user (for authorization)
 * @returns Random token string
 * 
 * Usage:
 * const token = generateToken("u1", "tenant");
 */
export function generateToken(userId: string, role: string): string {
  // Ekmot: the token is now signed with HMAC-SHA256, so it cannot be forged by
  // typing "u3_bank_..." by hand. Format: userId_role_timestamp_signature
  const timestamp = Date.now();
  return `${userId}_${role}_${timestamp}_${sign(`${userId}|${role}|${timestamp}`)}`;
}

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn("[auth] AUTH_SECRET is not set; using an insecure development secret.");
    return "ekmot-dev-only-secret-change-me";
  }
  return secret;
}

function sign(payload: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHmac("sha256", authSecret()).update(payload).digest("hex");
}

/**
 * Compares an OTP code with a stored OTP
 * 
 * Used during email verification to check if the user entered
 * the correct OTP code.
 * 
 * @param inputOTP - OTP code entered by the user
 * @param storedOTP - OTP code stored in the database
 * @returns true if OTPs match, false otherwise
 * 
 * Usage:
 * const isValid = compareOTP("123456", user.otp);
 */
export function compareOTP(inputOTP: string, storedOTP: string | null): boolean {
  // Handle null/undefined cases
  if (!storedOTP) {
    return false;
  }
  
  // Compare OTPs (case-insensitive, trimmed)
  return inputOTP.trim() === storedOTP.trim();
}

/**
 * Validates if an OTP has expired
 * 
 * OTPs should expire after a certain time period (e.g., 10 minutes)
 * for security reasons.
 * 
 * @param createdAt - Timestamp when OTP was created
 * @param expiryMinutes - Number of minutes before OTP expires (default: 10)
 * @returns true if OTP is still valid, false if expired
 * 
 * Usage:
 * const isValid = isOTPValid(mockEmail.createdAt, 10);
 */
export function isOTPValid(createdAt: number, expiryMinutes: number = 10): boolean {
  const now = Date.now();
  const expiryTime = createdAt + expiryMinutes * 60 * 1000; // Convert minutes to milliseconds
  return now < expiryTime;
}

/**
 * Extracts user information from a token
 * 
 * In production, this would decode and verify a JWT.
 * This mock version parses the token string to extract user info.
 * 
 * @param token - Token string to parse
 * @returns Object with userId and role, or null if invalid
 * 
 * Usage:
 * const userInfo = parseToken(token);
 */
export function parseToken(token: string): { userId: string; role: string } | null {
  try {
    // Ekmot: verify the signature and age before trusting the token
    const parts = token.split("_");
    if (parts.length !== 4) return null;
    const [userId, role, ts, signature] = parts;
    const timestamp = Number(ts);
    if (!timestamp || Date.now() - timestamp > TOKEN_MAX_AGE_MS) return null;
    const expected = sign(`${userId}|${role}|${timestamp}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require("crypto") as typeof import("crypto");
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

