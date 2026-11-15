/**
 * Type definitions for the T-ODRE (Transparency-Oriented Digital Rental Ecosystem)
 * 
 * This file contains all TypeScript interfaces and types used throughout the application
 * to ensure type safety and better developer experience.
 */

/**
 * User roles available in the system
 * - tenant: A person who rents properties
 * - landlord: A person who owns and rents out properties
 * - bank: Financial institution accessing rental history
 * - ministry: Government authority monitoring the system
 */
export type UserRole = "tenant" | "landlord" | "bank" | "ministry";

/**
 * Rental status types
 * - active: Currently ongoing rental agreement
 * - pending: Rental request awaiting approval
 * - completed: Rental agreement that has ended
 * - cancelled: Rental agreement that was cancelled
 * - renewal_pending: Rental renewal request awaiting approval
 * - terminating: Rental termination request in process
 */
export type RentalStatus = "active" | "pending" | "completed" | "cancelled" | "renewal_pending" | "terminating";

/**
 * Payment status types
 * - paid: Payment successfully completed
 * - pending: Payment initiated but not completed
 * - overdue: Payment past due date
 * - failed: Payment attempt failed
 */
export type PaymentStatus = "paid" | "pending" | "overdue" | "failed";

/**
 * User interface representing all users in the system
 * Stores authentication and profile information
 */
export interface User {
  id: string; // Unique identifier for the user
  name: string; // Full name of the user
  email: string; // Email address (used for authentication)
  role: UserRole; // Role determines dashboard access and permissions
  verified: boolean; // Whether the user has completed email/OTP verification
  otp: string | null; // Temporary OTP code (null after verification)
  createdAt?: string; // Timestamp when user was created
}

/**
 * Property interface representing rental properties
 * Owned by landlords and can be rented by tenants
 */
export interface Property {
  id: string; // Unique identifier for the property
  ownerId: string; // ID of the landlord who owns this property
  address: string; // Physical address of the property
  rent: number; // Monthly rent amount in local currency
  available: boolean; // Whether the property is currently available for rent
  description?: string; // Optional description of the property
  startDate?: string; // Available start date (ISO format: YYYY-MM-DD)
  endDate?: string; // Available end date (ISO format: YYYY-MM-DD) - minimum 2 months from startDate
  createdAt?: string; // Timestamp when property was added
  cityCorp?: CityCorp; // Ekmot: DNCC or DSCC, decides which city rules load
  ward?: number; // Ekmot: ward number inside the city corporation
}

/**
 * Rental interface representing rental agreements
 * Links tenants to properties and tracks rental periods
 */
export interface Rental {
  id: string; // Unique identifier for the rental agreement
  tenantId: string; // ID of the tenant renting the property
  landlordId: string; // ID of the landlord (owner of the property)
  propertyId: string; // ID of the property being rented
  startDate: string; // Start date of the rental (ISO format: YYYY-MM-DD)
  endDate?: string; // Optional end date (null for ongoing rentals)
  status: RentalStatus; // Current status of the rental agreement
  monthlyRent: number; // Monthly rent amount (copied from property at creation)
  createdAt?: string; // Timestamp when rental was created
  // Ekmot fields (all optional so T-ODRE records still load)
  agreementId?: string; // the confirmed Ekmot agreement behind this rental
  cityCorp?: CityCorp;
  ward?: number;
  advanceMonths?: number;
  noticeMonths?: number;
  confirmed?: Confirmation;
}

/**
 * Payment interface representing rent payments
 * Tracks all payment transactions for rental agreements
 */
export interface Payment {
  id: string; // Unique identifier for the payment
  rentalId: string; // ID of the rental agreement this payment belongs to
  amount: number; // Payment amount
  month: string; // Month being paid for (format: YYYY-MM)
  status: PaymentStatus; // Current status of the payment
  timestamp: number; // Unix timestamp when payment was made/initiated
  method?: string; // Optional payment method (e.g., "bank_transfer", "mobile_banking")
  // Ekmot evidence fields
  trxId?: string; // transaction ID both SMS must share
  tenantSms?: string;
  landlordSms?: string;
  tenantTrxId?: string;
  landlordTrxId?: string;
  evidence?: EvidenceLevel;
}

/**
 * Mock email interface for OTP system
 * Stores OTP codes sent to users for email verification
 */
export interface MockEmail {
  id: string; // Unique identifier for the email record
  email: string; // Recipient email address
  otp: string; // One-time password code
  expiresAt: number; // Unix timestamp when OTP expires
  used: boolean; // Whether this OTP has been used
  createdAt: number; // Unix timestamp when OTP was created
}

/**
 * Authentication token interface
 * Used for session management (stored in localStorage in this mock system)
 */
export interface AuthToken {
  token: string; // JWT-like token (mock string in this implementation)
  userId: string; // ID of the authenticated user
  role: UserRole; // Role of the authenticated user
  expiresAt?: number; // Optional expiration timestamp
}

/**
 * Dashboard data interfaces for different user roles
 */

/**
 * Tenant dashboard data
 * Aggregates rental and payment information for tenant view
 */
export interface TenantDashboardData {
  user: User;
  currentRental: Rental | null;
  property: Property | null;
  landlord: User | null;
  paymentHistory: Payment[];
  totalPaid: number;
  onTimePayments: number;
  latePayments: number;
  terminationRequest?: RentalTermination | null; // Current pending termination request
}

/**
 * Landlord dashboard data
 * Aggregates properties, rentals, and tenant information
 */
export interface LandlordDashboardData {
  user: User;
  properties: Property[];
  activeRentals: Rental[];
  pendingRequests: Rental[];
  tenants: User[];
  rentDue: Array<{
    rental: Rental;
    tenant: User;
    amount: number;
    month: string;
    daysOverdue: number;
  }>;
  totalRevenue: number;
  allRentals?: Rental[]; // Added to include all rentals for reference (including ended ones)
  propertyRentalsMap?: Record<string, Rental[]>; // Map of property ID to rentals
  pendingTerminations?: RentalTermination[]; // Pending termination requests
}

/**
 * Bank dashboard data
 * Provides rental history and credit assessment information
 */
export interface BankDashboardData {
  tenantHistory: Array<{
    tenant: User;
    rentalHistory: Rental[];
    paymentHistory: Payment[];
    creditScore: number;
    onTimePaymentRate: number;
  }>;
}

/**
 * Ministry dashboard data
 * System-wide analytics and compliance information
 */
export interface MinistryDashboardData {
  totalTenants: number;
  totalLandlords: number;
  activeRentals: number;
  totalProperties: number;
  totalRevenue: number;
  complianceRate: number;
  rentMap: Array<{
    area: string;
    averageRent: number;
    activeRentals: number;
  }>;
}

/**
 * Review interface for rating system
 * Allows both landlords and tenants to review each other
 */
export interface Review {
  id: string; // Unique identifier for the review
  reviewerId: string; // ID of the user giving the review
  reviewerRole: UserRole; // Role of the reviewer (tenant or landlord)
  reviewedId: string; // ID of the user being reviewed
  reviewedRole: UserRole; // Role of the person being reviewed
  rentalId: string; // ID of the rental this review is for
  rating: number; // Star rating (1-5)
  comment: string; // Review comment/feedback
  createdAt: number; // Unix timestamp when review was created
}

/**
 * Review summary with average rating
 */
export interface ReviewSummary {
  averageRating: number; // Average of all ratings
  totalReviews: number; // Total number of reviews
  reviews: Review[]; // List of all reviews
  ratingDistribution: {
    [key: number]: number; // Count of reviews for each star rating (1-5)
  };
}

/**
 * Maintenance request status types
 * - pending: Issue reported, awaiting landlord review
 * - in_progress: Landlord is working on fixing the issue
 * - fixed: Issue has been resolved
 * - rejected: Landlord rejected the request (with reason)
 */
export type MaintenanceStatus = "pending" | "in_progress" | "fixed" | "rejected";

/**
 * Maintenance Request interface
 * Allows tenants to report property issues to landlords
 */
export interface MaintenanceRequest {
  id: string; // Unique identifier for the request
  tenantId: string; // ID of the tenant reporting the issue
  landlordId: string; // ID of the landlord who needs to fix it
  rentalId: string; // ID of the rental property
  propertyId: string; // ID of the property
  title: string; // Short title/description of the issue
  description: string; // Detailed description of the problem
  status: MaintenanceStatus; // Current status of the request
  priority: "low" | "medium" | "high" | "urgent"; // Priority level
  landlordComment?: string; // Optional comment from landlord when updating status
  createdAt: number; // Unix timestamp when request was created
  updatedAt: number; // Unix timestamp when request was last updated
}

/**
 * Notice/Announcement interface
 * Allows landlords to post announcements to their tenants
 */
export interface Notice {
  id: string; // Unique identifier for the notice
  landlordId: string; // ID of the landlord creating the notice
  propertyId?: string; // Optional: specific property ID (null for all properties)
  title: string; // Notice title
  content: string; // Notice content/body
  priority: "normal" | "important" | "urgent"; // Priority level
  createdAt: number; // Unix timestamp when notice was created
  updatedAt: number; // Unix timestamp when notice was last updated
}

/**
 * Terms and Conditions interface
 * Rental contract/terms that landlords can create for their properties
 */
export interface TermsAndConditions {
  id: string; // Unique identifier for the terms
  landlordId: string; // ID of the landlord creating the terms
  propertyId?: string; // Optional: specific property ID (null for all properties)
  title: string; // Title of the terms/contract
  content: string; // Full terms and conditions content
  version: number; // Version number (increments on updates)
  isActive: boolean; // Whether these terms are currently active
  createdAt: number; // Unix timestamp when terms were created
  updatedAt: number; // Unix timestamp when terms were last updated
}

/**
 * Rental Termination Request interface
 * Allows tenants to request termination of their rental contract
 */
export interface RentalTermination {
  id: string; // Unique identifier for the termination request
  rentalId: string; // ID of the rental being terminated
  tenantId: string; // ID of the tenant requesting termination
  landlordId: string; // ID of the landlord
  requestedEndDate: string; // ISO date string for when tenant wants to end rental
  reason?: string; // Optional reason for termination
  status: "pending" | "approved" | "rejected"; // Status of the termination request
  createdAt: number; // Unix timestamp when request was created
  updatedAt: number; // Unix timestamp when request was last updated
}

/**
 * Rental Renewal Request interface
 * Allows tenants to request renewal of their rental contract
 */
export interface RentalRenewal {
  id: string; // Unique identifier for the renewal request
  rentalId: string; // ID of the rental being renewed
  tenantId: string; // ID of the tenant requesting renewal
  landlordId: string; // ID of the landlord
  renewalDuration: number; // Duration in months (1-24 months)
  requestedStartDate: string; // ISO date string for when renewal should start
  status: "pending" | "approved" | "rejected"; // Status of the renewal request
  createdAt: number; // Unix timestamp when request was created
  updatedAt: number; // Unix timestamp when request was last updated
}



/* ------------------------------------------------------------------ */
/* Ekmot additions                                                     */
/* ------------------------------------------------------------------ */

export type CityCorp = "DNCC" | "DSCC";

/** How much proof stands behind a record: both sides' SMS match, one side only, or they disagree */
export type EvidenceLevel = "matched" | "one-sided" | "disputed";

export interface Confirmation {
  tenant: boolean;
  landlord: boolean;
  tenantAt?: number;
  landlordAt?: number;
}

/** Structured tenancy terms, extracted from Bangla/Banglish text and edited by people */
export interface TenancyTerms {
  monthlyRent?: number; // taka
  advanceMonths?: number; // months of rent paid in advance
  securityDeposit?: number; // taka; the 1991 Act does not allow one
  increasePercent?: number; // planned rent increase
  increaseEveryMonths?: number; // how often the increase happens
  noticeMonths?: number; // notice period either side must give
}

export type RuleSeverity = "outside" | "conflict" | "info" | "ok";

export interface RuleFlag {
  id: string;
  source: string; // e.g. "Premises Rent Control Act 1991, s.10" or "DNCC guideline, Jan 2026"
  severity: RuleSeverity;
  en: string;
  bn: string;
}

export interface Agreement {
  id: string;
  landlordId: string;
  tenantId: string;
  propertyId: string;
  cityCorp: CityCorp;
  ward?: number;
  termsText: string; // the original message, kept as evidence
  terms: TenancyTerms;
  extractedBy: "ai" | "offline";
  flags: RuleFlag[];
  confirmed: Confirmation;
  status: "draft" | "confirmed" | "declined";
  hash?: string; // sha256 of the confirmed terms
  rentalId?: string;
  startDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface ShareLink {
  id: string; // random token used in the URL
  tenantId: string;
  createdAt: number;
  expiresAt: number;
}

export interface Consent {
  id: string;
  tenantId: string;
  lenderId: string;
  createdAt: number;
  expiresAt: number;
  revokedAt?: number;
}

/** What a lender sees: facts with evidence, never a score */
export interface RentRecord {
  tenantId: string;
  tenantName: string;
  tenancies: number;
  tenureMonths: number;
  monthsMatched: number;
  monthsOneSided: number;
  monthsDisputed: number;
  latestMonth?: string;
  meetsMinimum: boolean; // six or more matched months
  consentExpiresAt: number;
}
