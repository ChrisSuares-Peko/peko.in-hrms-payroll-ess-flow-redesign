/** Semantic pastel surface for a stat card — mapped to existing Tailwind tokens in StatCard. */
export type StatTone = 'lilac' | 'mint' | 'rose' | 'lavender' | 'cream';

/** A single KPI/metric card in the stat row. */
export interface StatItem {
    /** Stable key for React lists. */
    key: string;
    /** Identifies which icon to render (mapped to an antd icon in StatCard). */
    icon: 'card' | 'spend' | 'reimbursement' | 'clock' | 'members' | 'bank';
    /** Optional SVG asset path — when provided, renders an <img> instead of the antd icon. */
    svgIcon?: string;
    label: string;
    value: string;
    /** Small caption under the value, e.g. "5 active". */
    caption: string;
    tone: StatTone;
}

/** A merchant transaction row in "Recent Transactions". */
export interface TransactionItem {
    key: string;
    merchant: string;
    /** Short avatar fallback text when no logo is supplied. */
    avatarText: string;
    /** Optional brand colour for the avatar fallback. */
    avatarColor?: string;
    /** Optional SVG/PNG icon path — shown instead of the colour avatar when provided. */
    icon?: string;
    status:
        | 'Active'
        | 'Blocked'
        | 'Pending'
        | 'Approved'
        | 'Rejected'
        | 'Completed'
        | 'Declined'
        | 'Processing'
        | 'Reversed'
        | 'Refunded';
    person: string;
    date: string;
    amount: string;
}

/** A category spend row with a proportional bar (Spend by Category). */
export interface CategorySpend {
    key: string;
    label: string;
    amount: string;
    /** 0–100, drives the bar width. */
    percent: number;
    /** Bar colour (hex aligned to a Tailwind token). */
    color: string;
}

/** Per-member card utilisation row (admin Card Utilisation). */
export interface MemberUtilisation {
    key: string;
    name: string;
    last4: string;
    spent: number;
    limit: number;
    /** Bar colour reflecting utilisation severity. */
    color: string;
}

/** A physical/virtual card face shown in the card carousels. */
export interface CardData {
    key: string;
    holder: string;
    nameOnCard?: string;
    last4: string;
    balance?: string;
    used: number;
    limit: number;
    status?: CardStatus;
    terminationStatus?: 'REQUESTED' | 'COMPLETED' | null;
}

/** Wallet summary panel (admin). */
export interface WalletInfo {
    available: string;
    note: string;
    cardLimitsUsed: number;
    cardLimitsTotal: number;
    cardLimitsLabel: string;
    cardLimitsCaption: string;
    fundingAccountLast4: string;
    fundingAccountRef: string;
}

/** One bar in the Daily Spend chart. */
export interface DailySpendPoint {
    label: string;
    value: number;
}

/** A tab in the in-page tab bar. Children mark it as a dropdown. */
export interface TabItem {
    key: string;
    label: string;
    /** Count pinned after the label, e.g. requests waiting on a decision. Hidden when zero. */
    badge?: number;
    children?: { key: string; label: string }[];
}

/** A document/credential the user must have ready before starting KYC. */
export interface KycRequirement {
    key: string;
    label: string;
    /** Imported thumbnail asset URL. */
    image: string;
}

/** Submission summary shown on the "KYC Submitted" screen. */
export interface KycSubmissionInfo {
    status: string;
    expectedCompletion: string;
}

/** KYC gate stage: cardholder must clear this before the dashboard renders. */
export type KycStage = 'initiate' | 'submitted' | 'verified';

/** KYB gate stage for admin: must complete before the admin dashboard renders. */
export type KybStage =
    | 'landing'
    | 'initiate'
    | 'upload'
    | 'submitted'
    | 'verified'
    | 'rejected'
    | 'pending'
    | 'complete';

export interface KybLandingFeature {
    key: string;
    title: string;
    description: string;
    image: string;
    /** Designed width in px. Each illustration has its own geometry and must not be stretched to a shared size. */
    imageWidth?: number;
    /** How the artwork sits in the card. Omitted means the shared centred-at-the-bottom illustration. */
    media?: 'tiltedCard';
}

/** A file staged by FileUploadInput's beforeUpload — already base64-encoded, not yet submitted. */
export type DocumentSaveState = 'saving' | 'saved' | 'failed' | 'removing';

export interface KybFileValue {
    base64: string;
    format: string;
    name: string;
}

export type CardType = 'Virtual' | 'Physical';
export type CardStatus = 'Active' | 'Pending' | 'Frozen' | 'Failed';

export type TopUpStatus = 'Completed' | 'Processing' | 'Failed';

export type ApprovalStatus = 'Approved' | 'Rejected' | 'Pending' | 'Processing';

/** A row in the Approval Requests → Transactions table. */
export interface TransactionApproval {
    key: string;
    last4: string;
    date: string;
    member: string;
    merchant: string;
    policyReason: string;
    amount: string;
    status: ApprovalStatus;
}

/** A row in the Approval Requests → Card requests table. */
export interface CardRequestApproval {
    key: string;
    date: string;
    member: string;
    cardType: string;
    limit: string;
    reason: string;
    status: ApprovalStatus;
    last4?: string;
    /** Admin's note when this request was rejected — shown as a tooltip on the status pill. */
    decisionNote?: string | null;
}

/** A row in the Approval Requests → Unfreeze requests table. */
export interface UnfreezeApproval {
    key: string;
    last4: string;
    date: string;
    member: string;
    frozenReason: string;
    reason: string;
    status: ApprovalStatus;
    /** Admin's note when this request was rejected — shown as a tooltip on the status pill. */
    decisionNote?: string | null;
}

export interface LimitIncreaseApproval {
    key: string;
    last4: string;
    date: string;
    member: string;
    currentLimit: string;
    requestedIncrease: string;
    reason: string;
    status: ApprovalStatus;
    /** Admin's note when this request was rejected — shown as a tooltip on the status pill. */
    decisionNote?: string | null;
}

/** A row in the Approval Requests → Physical cards table. */
export interface PhysicalCardApproval {
    key: string;
    last4: string;
    date: string;
    member: string;
    shippingAddress: string;
    reason: string;
    status: ApprovalStatus;
    /** Admin's note when this request was rejected — shown as a tooltip on the status pill. */
    decisionNote?: string | null;
}

/** A row in the Wallet tab → Top-up history table. */
export interface TopUpHistoryItem {
    key: string;
    date: string;
    reference: string;
    source: string;
    status: TopUpStatus;
    amount: string;
}

/** Bank transfer details shown in the Top-up wallet modal. */
export interface FundingAccountDetails {
    beneficiaryName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    bankAddress: string;
    paymentReference: string;
}

/**
 * A restricted merchant category as the server resolves and stores it: the category name plus its
 * real MCC codes. A card's `restrictedCategories` may still contain a bare string for a legacy row
 * saved before this shape existed — always read the display name via `restrictedCategoryNames()`
 * (utils/issueCardData.ts) rather than assuming every entry is one shape or the other.
 */
export interface MerchantCategory {
    category: string;
    mccs: string[];
}

/** A row in the Cards table (admin + user card listings). */
export interface CardRecord {
    key: string;
    holderId?: number;
    last4: string;
    maskedCardNumber?: string;
    holder: string;
    nameOnCard?: string;
    department: string;
    avatarText: string;
    type: CardType;
    status: CardStatus;
    cardState?: string;
    terminationStatus?: 'REQUESTED' | 'COMPLETED' | null;
    /** Who placed the current freeze — 'ADMIN' | 'CARDHOLDER' | 'SYSTEM'; null when the card is active. */
    frozenByRole?: string | null;
    freezeReasonLabel?: string | null;
    freezeReasonNote?: string | null;
    cardLimit: number;
    perTxnLimit: number | null;
    limitFrequency?: string;
    atmEnabled?: boolean;
    restrictedCategories?: (string | MerchantCategory)[];
    spent: number;
    remaining: number;
}

/** Category of a per-card audit-trail event (drives the filter pills + icon/pill colour). */
export type CardAuditCategory = 'Lifecycle' | 'Limits' | 'Controls' | 'Security';

/** A single entry in a card's audit trail modal. */
export interface CardAuditEvent {
    key: string;
    title: string;
    description: string;
    /** Display timestamp, e.g. "2024-10-22 14:32". */
    timestamp: string;
    /** Who performed the action, e.g. "Aarav Sharma (Admin)" or "System". */
    actor: string;
    category: CardAuditCategory;
}

/* ------------------------------------------------------------------ *
 * My Requests (cardholder): card / limit-increase / physical-card requests
 * ------------------------------------------------------------------ */

/** Status of a cardholder request. */
export type RequestStatus = 'Approved' | 'Rejected' | 'Pending' | 'Processing';

/** A row in "My Requests → Card requests". */
export interface CardRequest {
    key: string;
    date: string;
    type: string;
    limit: number;
    cardLast4: string;
    amount: number;
    status: RequestStatus;
}

/** A row in "My Requests → Limit increase requests". */
export interface LimitIncreaseRequest {
    key: string;
    date: string;
    cardLast4: string;
    amount: number;
    status: RequestStatus;
}

/** A row in "My Requests → Physical card requests". */
export interface PhysicalCardRequest {
    key: string;
    date: string;
    cardLast4: string;
    shippingAddress: string;
    status: RequestStatus;
}

/* ------------------------------------------------------------------ *
 * People page (admin): Members table + Teams grid
 * ------------------------------------------------------------------ */

/** Sub-user account status. Mirrors the directory's closed ENUM('PENDING','ACTIVE','INACTIVE'). */
export type MemberAccountStatus = 'Active' | 'Inactive' | 'Pending';

/**
 * Cardholder KYC status. 'Not started' is derived, not stored — the backend reports NOT_STARTED for a
 * member with no KYC row at all.
 */
export type MemberKycStatus = 'Not started' | 'Initiated' | 'Pending' | 'Completed' | 'Rejected';

/** A row in the admin "People → Members" table. */
export interface Member {
    key: string;
    name: string;
    email: string;
    /**
     * Optional because the column is nullable and older rows may have none. Editable only while KYC is
     * unfinished — after that it is the identity Pine Labs verified.
     */
    mobileNo?: string;
    /** Workspace role, e.g. "Admin", "Team Member", "Accountant". */
    role: string;
    /**
     * The corporate account holder. Their row is pinned first, their role is always Admin and cannot be
     * changed, and they can be neither removed nor deactivated — the server refuses all three, so this only
     * decides what the UI offers. Structural, not the role string: a real member can be an Admin too.
     */
    isAccountOwner?: boolean;
    /**
     * The signed-in admin's own membership — true for the account holder too, since their row IS their
     * membership. Whoever is administering the list is pinned first in it, and nobody may remove or
     * re-invite themselves, while starting KYC is something only they can do for themselves.
     */
    isSelf?: boolean;
    cards: number;
    accountStatus: MemberAccountStatus;
    kycStatus: MemberKycStatus;
    /** ISO date string, e.g. "2024-01-12". */
    joined: string;
    /**
     * Raw account status, kept alongside the display label because behaviour keys off the server's enum,
     * never off a translated label.
     */
    inviteStatus?: 'PENDING' | 'ACTIVE' | 'INACTIVE';
    /**
     * Whether this member has finished setting their password.
     *
     * The resend action is gated on this rather than on `inviteStatus`: the membership status describes the
     * membership, and nothing moves it when someone completes the reset — so Resend was offered for ever and
     * the server then refused it with "This member has already set their password."
     */
    hasSetPassword?: boolean;
}

/** A label/value option for the modal selects (role, lead). */
export interface SelectOption {
    label: string;
    value: string;
}

/* ------------------------------------------------------------------ *
 * Transactions page (admin): list + transaction detail
 * ------------------------------------------------------------------ */

/** Settlement status of a transaction. Backend (JIT) emits Completed/Processing/Declined/Reversed/Refunded;
 * Posted/Pending are retained for backward compatibility with any legacy consumer. */
export type TransactionStatus =
    | 'Completed'
    | 'Processing'
    | 'Declined'
    | 'Reversed'
    | 'Refunded'
    | 'Posted'
    | 'Pending';

/** Approval state. 'Auto-approved' renders as plain text; the others as pills. */
export type TransactionApprovalStatus = 'Approved' | 'Auto-approved' | 'Pending' | 'Rejected';

/** A row in the Transactions table (admin org-wide view + user "My transactions" view). */
export interface TransactionRow {
    key: string;
    /** Masked card number, e.g. "**** **** **** 1294". */
    cardLast4: string;
    /** Display date, already formatted date-only, e.g. "12 January 2024". */
    date: string;
    /** The same instant unformatted, kept so the cell can show the time on hover. */
    dateTime?: string | null;
    merchant: string;
    member: string;
    /** The cardholder's `users.id` — used as the cardholder filter value (names aren't unique). */
    holderId?: string | null;
    status: TransactionStatus;
    approval: TransactionApprovalStatus;
    /** Why this charge needs a manual look (e.g. a JIT decline reason). Null for an authorized charge.
     *  Rendered as "Policy reason" in the Approval Requests → Transactions table. */
    declineReason?: string | null;
    fee: number;
    amount: number;
    transactionId?: string;
    category?: string;
}

export interface DetailField {
    label: string;
    value: string;
}

export interface DetailSection {
    title: string;
    fields: DetailField[];
}

export interface TransactionDetail {
    merchantName: string;
    maskedCardNumber: string | null;
    logo?: string;
    timestamp: string;
    transactionAmount: string;
    internationalFee: string;
    totalCharged: string;
    sections: DetailSection[];
}

export interface ReceiptFile {
    key: string;
    /** Receipt DB id — needed to delete. */
    id: number;
    fileName: string;
    date: string;
    uploadedBy: string;
    /** Hosted file URL (open/download). */
    url?: string;
    mimeType?: string;
}

export interface AccountingSplit {
    key: string;
    net: string;
    gstAmount: string;
}

export interface AuditEntry {
    key: string;
    date: string;
    actor: string;
    action: string;
}

export interface CommentEntry {
    key: string;
    author: string;
    role: 'admin' | 'user';
    message: string;
    timestamp: string;
}

export type StatementTone = 'lilac' | 'rose' | 'mint' | 'lavender';

export interface StatementSummary {
    key: string;
    icon: 'wallet' | 'in' | 'out' | 'check';
    label: string;
    value: string;
    caption: string;
    tone: StatementTone;
}

export type StatementRowKind = 'opening' | 'txn' | 'closing';

export type StatementTrend = 'inGreen' | 'downRed' | 'upRed';

export interface StatementRow {
    key: string;
    date: string;
    description: string;
    trend?: StatementTrend;
    reference: string;
    type: string;
    moneyOut: string;
    moneyIn: string;
    balance: string;
    kind: StatementRowKind;
}

export type MyCardKind = 'Physical Card' | 'Virtual Card';

export interface MyCard extends CardData {
    kind: MyCardKind;
    status: 'Active' | 'Frozen';
    terminationStatus?: 'REQUESTED' | 'COMPLETED' | null;
    terminationRequested?: boolean;
    perTxnLimit?: number | null;
    cardViewLink?: string;
    maskedCardNumber?: string;
    frozenByRole?: string | null;
    unfreezeRequestStatus?: 'PENDING' | 'PROCESSING' | null;
    freezeReasonLabel?: string | null;
    freezeReasonNote?: string | null;
}
