import { UserPayload } from '@customtypes/general';

// Entity type enum
export enum EntityType {
    PRIVATE_LIMITED = 'private_limited',
    PUBLIC_LIMITED = 'public_limited',
    OPC = 'opc',
    LLP = 'llp',
}

// Landing page - services
export interface PostIncorporationService {
    id: string;
    name: string;
    description: string;
    price: number;
    selected?: boolean;
}

export interface LandingConfigResponse {
    incorporationFee: number;
    estimatedTime: string;
    steps: string[];
    services: PostIncorporationService[];
    requiredDocuments: Record<string, string[]>;
}

// Form - Applicant details
export interface ApplicantDetails {
    fullName: string;
    email: string;
    mobile: string;
    state: string;
}

// Form - Basic Details step
export interface BasicDetailsFormData {
    applicantDetails: ApplicantDetails;
    entityType: EntityType;
    proposedNames: {
        firstChoice: string;
        secondChoice?: string;
        thirdChoice?: string;
    };
    registeredOffice: {
        availability: 'have' | 'need';
        officeType?: string;
        address?: string;
        hasUtilityBill: boolean;
        hasIdProof: boolean;
    };
}

// Form - Directors step
export interface DirectorInfo {
    name: string;
    nationality: string;
    email: string;
    mobile: string;
    panNumber: string;
    passportNumber?: string;
    din?: string;
    aadhaar?: string;
    hasDIN: boolean;
    hasDSC: boolean;
    requestDINfromPeko: boolean;
    requestDSCfromPeko: boolean;
    educationQualification: string;
    occupation: string;
    placeOfBirth?: {
        state?: string;
        district?: string;
    };
}

// Form - Nominee (OPC only) — same as DirectorInfo minus DSC fields
export type NomineeInfo = Omit<DirectorInfo, 'hasDSC' | 'requestDSCfromPeko'>;

// Form - Capital step
export interface Shareholder {
    name: string;
    shareholding: number;
    sharesAllotted?: number;
    email?: string;
    mobile?: string;
    panNumber?: string;
    passportNumber?: string;
    nationality?: string;
}

export interface CapitalFormData {
    authorizedCapital: number;
    paidUpCapital: number;
    faceValuePerShare?: number;
    shareholders?: Shareholder[];
}

// Form - Business Activity step
export interface BusinessActivityFormData {
    section: string;
    division: string;
    group: string;
    class?: string;
    subclass?: string;
    secondaryActivity?: string;
    otherActivities?: string;
    description: string;
}

// Form - MOA & AOA step
export interface MoaAoaFormData {
    moaType: 'standard' | 'custom';
    aoaType: 'standard' | 'customized';
    moaFile?: File; // transient — display only (filename)
    aoaFile?: File; // transient — display only (filename)
    moaDocument?: DocumentUpload; // base64 ready for upload (custom MOA)
    aoaDocument?: DocumentUpload; // base64 ready for upload (custom AOA)
    confirmed: boolean;
    mainObjectTemplate?: string;
    mainObjectCustomText?: string;
    ancillaryObjects?: number[];
}

export interface LlpAgreementFormData {
    agreementType: 'standard' | 'custom';
    customAgreementFile?: File; // transient — display only (filename)
    customAgreementDocument?: DocumentUpload; // base64 ready for upload
    partnerRights: {
        accessBooks: boolean;
        receiveShares: boolean;
        participateVotes: boolean;
        indemnified: boolean;
        separateBusiness: boolean;
    };
    partnerDuties: {
        accountBenefits: boolean;
        indemnifyFraud: boolean;
        renderAccounts: boolean;
        actInBestInterest: boolean;
        noCompeting: boolean;
        maintainConfidentiality: boolean;
    };
    meetingQuorum: string;
    votingThreshold: string;
    disputeResolution: {
        method: string;
        jurisdiction: string;
    };
    confirmed: boolean;
}

export interface MemorandumFormData {
    memorandumPath?: string;
    articlePath?: string;
    llpAgreementPath?: string;
}

// Form - Documents step
export interface DocumentUpload {
    docType: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
}

export interface DocumentsFormData {
    documents: DocumentUpload[];
}

// Complete application payload
export interface ApplicationPayload extends UserPayload {
    applicantDetails?: ApplicantDetails;
    entityType?: EntityType;
    proposedNames?: {
        firstChoice: string;
        secondChoice?: string;
        thirdChoice?: string;
    };
    registeredOffice?: {
        availability: 'have' | 'need';
        officeType?: string;
        address?: string;
        state?: string;
        hasUtilityBill?: boolean;
        hasIdProof?: boolean;
    };
    directors?: DirectorInfo[];
    additionalShareholders?: DirectorInfo[];
    nominee?: NomineeInfo;
    capital?: CapitalFormData;
    businessActivity?: BusinessActivityFormData;
    moaAoa?: MoaAoaFormData;
    llpAgreement?: LlpAgreementFormData;
    memorandum?: MemorandumFormData;
    documents?: DocumentsFormData;
    selectedServices?: string[];
}

// Application response
export interface ApplicationResponse {
    _id?: string;
    applicationId: string;
    totalAmount: number;
    mcaFilingFee?: number;
    status: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

// Application tracking
export enum ApplicationStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export type VendorStatus = 'NOT_SENT' | 'SENDING' | 'SENT' | 'FAILED';

export interface VendorStage {
    _id: string;
    title: string;
    description: string;
    location: string;
    date: string;
    state: 'completed' | 'in_progress' | 'upcoming';
    created_at: string;
    updated_at: string;
}

// Returned by the vendor `/documents` endpoint once a company is registered.
// It is a "setup data" tree of sections → instances → fields. Each field is
// either a text value (a registered particular) or a file (a downloadable
// document). Index signatures keep this permissive for dynamic vendor fields.
export interface VendorFieldFile {
    name?: string;
    type?: string;
    url?: string;
    size?: number;
    extension?: string;
}

export interface VendorDocumentField {
    field?: string;
    label?: string;
    name?: string;
    value?: string | VendorFieldFile | null;
    type?: string; // 'text' | 'file' | ...
    [key: string]: unknown;
}

export interface VendorDocumentSection {
    section?: string;
    title?: string;
    instances?: Array<{ fields?: VendorDocumentField[] }>;
    [key: string]: unknown;
}

export interface VendorDocuments {
    sections?: VendorDocumentSection[];
    [key: string]: unknown;
}

export interface Application {
    id?: number;
    applicationId: string;
    entityType: EntityType;
    status: ApplicationStatus;
    applicantDetails: ApplicantDetails;
    proposedNames: {
        firstChoice: string;
        secondChoice?: string;
        thirdChoice?: string;
    };
    registeredOffice: {
        availability: 'have' | 'need';
        officeType?: string;
        address?: string;
        state?: string;
        hasUtilityBill?: boolean;
        hasIdProof?: boolean;
    };
    directors?: DirectorInfo[];
    additionalShareholders?: DirectorInfo[];
    nominee?: NomineeInfo;
    capital?: CapitalFormData;
    businessActivity?: BusinessActivityFormData;
    moaAoa?: MoaAoaFormData;
    llpAgreement?: LlpAgreementFormData;
    selectedServices?: string[];
    incorporationFee?: number;
    additionalServicesFee?: number;
    mcaFilingFee?: number;
    totalAmount?: number;
    createdAt: string;
    updatedAt: string;
    // Backend stores documents directly as a JSON array (no `applicationDocuments`
    // table). Frontend wraps this into `{ documents: [...] }` before pushing into
    // Formik. Each entry carries vendorUrl + vendorFileRefUrl after upload.
    documents?: Array<{
        docType: string;
        fileName: string;
        vendorUrl?: string;
        vendorFileRefUrl?: string;
        mimeType?: string;
    }>;
    applicationDocuments?: Array<{
        id: number;
        docType: string;
        fileName: string;
        fileUrl: string;
        mimeType?: string;
        status?: string;
        uploadedAt?: string;
    }>;
    rejectionReason?: string;
    approvedCompanyName?: string | null;
    vendorStatus?: VendorStatus;
    vendorSentAt?: string | null;
    vendorAttempts?: number;
    vendorApplicationId?: string | null;
    vendorTrackingId?: string | null;
    vendorSetupId?: string | null;
    vendorStages?: VendorStage[] | null;
    vendorDocuments?: VendorDocuments | null;
}

export interface ApplicationsListResponse {
    applications: Application[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// State
export interface IncorporationState {
    landingConfig: LandingConfigResponse | null;
    currentApplication: Partial<ApplicationPayload>;
    selectedServices: string[];
    submittedApplication: ApplicationResponse | null;
    applications: Application[];
    currentApplicationDetail: Application | null;
    isLoading: boolean;
    error: string | null;
}
