import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

// IndiaFilings lookup endpoints (Phase 1) — proxied through our backend.
// Base path resolves to /api/v1/corporate/:id/officeAndBusiness/business-registration.
interface Auth {
    userId: number;
    userType: string;
}

const base = ({ userId, userType }: Auth) =>
    `${userType}/${userId}/officeAndBusiness/business-registration`;

// Business name availability (MCA search).
export const checkBusinessName = async (payload: Auth & { name: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/name-check`,
            { name: payload.name }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// NIC business-activity list.
export const getBusinessActivities = async (payload: Auth & { level?: number }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.get(
            `${base(payload)}/business-activities`,
            { params: { level: payload.level ?? 4 } }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Pincode -> state/district/serviceability.
export const locationLookup = async (payload: Auth & { pincode: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/location`,
            { pincode: payload.pincode }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Pincode -> GST jurisdiction (Circle / Commissionerate / Division / Range).
export const jurisdictionLookup = async (payload: Auth & { pincode: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/jurisdiction`,
            { pincode: payload.pincode }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// HSN/SAC code search for the GST Top-5 Goods & Services picker.
export const searchHsnCode = async (payload: Auth & { hsncode: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/hsn-code`,
            { hsncode: payload.hsncode }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// PAN holder verification.
export const verifyPan = async (payload: Auth & { pan: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/verify-pan`,
            { pan: payload.pan }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// DIN validation — MCA director data + related companies.
export const verifyDin = async (payload: Auth & { din: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/verify-din`,
            { din: payload.din }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Vendor's per-ROLE required-document checklist (kyc-status, cached server-side).
// One director's checklist covers all directors; shareholders may differ.
export interface ChecklistDocument {
    document_type: string;
    mandatory: number;
    document_Nid: number;
}

export const getDocumentChecklist = async (payload: Auth & { role?: string }) => {
    try {
        const resp: SuccessGenericResponse<{ role: string; documents: ChecklistDocument[] }> =
            await ApiClient.get(`${base(payload)}/document-checklist`, {
                params: payload.role ? { role: payload.role } : {},
            });
        return resp.data;
    } catch {
        return false;
    }
};

// Business-level (service) documents for the entity's catalog service —
// required set only (smartservice=1 && status=1); upload Nid = ledgers_document_id.
export interface ServiceDocument {
    doc_name: string;
    ledgers_document_id: number;
    doc_type?: string;
    doc_group?: string;
}

export const getServiceDocuments = async (payload: Auth & { entityType: string }) => {
    try {
        const resp: SuccessGenericResponse<{
            serviceId: string | null;
            documents: ServiceDocument[];
        }> = await ApiClient.get(`${base(payload)}/service-documents`, {
            params: { entityType: payload.entityType },
        });
        return resp.data;
    } catch {
        return false;
    }
};

// "Request a callback" → IndiaFilings CRM lead (source PEKO_PARTNER, +91).
// catalogId ties the lead to the service the customer is interested in.
export const createLead = async (
    payload: Auth & { name: string; email: string; mobile: string; catalogId?: string | number }
) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/lead`,
            {
                name: payload.name,
                email: payload.email,
                mobile: payload.mobile,
                catalogId: payload.catalogId || undefined,
            }
        );
        return resp.data ?? true;
    } catch {
        return false;
    }
};

// Entity catalog & pricing.
export const getCatalog = async (payload: Auth & { serviceId?: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.get(
            `${base(payload)}/catalog`,
            { params: payload.serviceId ? { service_id: payload.serviceId } : {} }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// A selectable catalog variant (same service, different offering/price). Shown on
// the payment page only when the entity has more than one.
export interface VariantOption {
    vendorCatalogId: string;
    variantName: string;
    price: number;
    description?: string | null;
    about?: string | null;
}

// Draft created/updated at "Proceed to payment" — the server computes and
// returns the authoritative pricing; payment then debits against this row.
export interface DraftPricing {
    applicationId: string;
    totalAmount: number;
    incorporationFee: number;
    gstAmount: number;
    paymentStatus: string;
    // Catalog copy for the payment summary — service name, description paragraph
    // and the "* …"-delimited inclusions list, straight from the vendor catalog.
    serviceName?: string | null;
    description?: string | null;
    about?: string | null;
    catalogId?: string | null;
    // All active variants for the entity — a selector shows when length > 1.
    variants?: VariantOption[];
    // Result of a synchronous per-step vendor sync (syncPhase) — the FE blocks
    // the step when ok === false.
    sync?: { ok?: boolean; failedStage?: string; error?: string };
}

export const saveDraftApplication = async (
    payload: Auth & {
        applicationId?: string;
        entityType: string;
        applicationData: Record<string, unknown>;
        // Legacy background director sync (leaving the KYC step).
        vendorSync?: boolean;
        // Synchronous per-step vendor sync: 'directors' (KYC Next) or
        // 'shareholders' (Shareholding Next). The response carries `sync` and the
        // FE blocks the step when sync.ok === false.
        syncPhase?: 'directors' | 'shareholders';
    }
) => {
    try {
        const resp: SuccessGenericResponse<DraftPricing> = await ApiClient.post(
            `${base(payload)}/applications/draft`,
            {
                applicationId: payload.applicationId,
                entityType: payload.entityType,
                applicationData: payload.applicationData,
                vendorSync: payload.vendorSync,
                syncPhase: payload.syncPhase,
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Bounds a doc upload so a slow/stuck vendor upload can't leave the UI spinning
// forever (the global API client has no timeout).
const DOC_UPLOAD_TIMEOUT_MS = 120000;

// Per-step documents upload — pushes the files straight to the vendor and
// returns false if the server reports any upload failure (the FE blocks the
// Documents step so the user can retry before the final submit).
export const syncApplicationDocuments = async (
    payload: Auth & { applicationId: string; documents: ApplicationDocument[] }
): Promise<unknown | { error: string } | false> => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/documents/sync`,
            { documents: payload.documents },
            { timeout: DOC_UPLOAD_TIMEOUT_MS }
        );
        return resp.data;
    } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
        return message ? { error: message } : false;
    }
};

// The corporate's own applications (continue banner + My Applications history).
export interface ApplicationListRow {
    applicationId: string;
    entityType: string;
    status: string;
    paymentStatus: string;
    businessName?: string;
    totalAmount?: number | string;
    applicationData?: Record<string, unknown>;
    createdAt: string;
}

export const getApplications = async (payload: Auth & { status?: string; limit?: number }) => {
    try {
        const resp: SuccessGenericResponse<{ total: number; applications: ApplicationListRow[] }> =
            await ApiClient.get(`${base(payload)}/applications`, {
                params: {
                    ...(payload.status ? { status: payload.status } : {}),
                    ...(payload.limit ? { limit: payload.limit } : {}),
                },
            });
        return resp.data;
    } catch {
        return false;
    }
};

export interface ApplicationDetail extends ApplicationListRow {
    documents?: ApplicationDocument[];
}

// Full detail for one application — unlike the list (which excludes the heavy
// `documents` column), this returns uploaded files so a resumed draft can
// restore their upload state.
export const getApplicationDetail = async (payload: Auth & { applicationId: string }) => {
    try {
        const resp: SuccessGenericResponse<ApplicationDetail> = await ApiClient.get(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Final submit — flips the paid PENDING draft to SUBMITTED with the full form.
interface SubmitPayload extends Auth {
    applicationId?: string;
    entityType: string;
    applicationData: Record<string, unknown>;
}

export const submitApplication = async (payload: SubmitPayload) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/applications`,
            {
                applicationId: payload.applicationId,
                entityType: payload.entityType,
                applicationData: payload.applicationData,
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// One KYC document per request (CI upload-document pattern).
export interface ApplicationDocument {
    docType: string;
    personKey?: string | null;
    fileName: string;
    fileString: string;
    // Vendor Nid for business-level (service) docs, from the rendered list.
    documentNid?: number;
}

export const uploadApplicationDocument = async (
    payload: Auth & { applicationId: string; document: ApplicationDocument }
) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/documents`,
            payload.document,
            { timeout: DOC_UPLOAD_TIMEOUT_MS }
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Start (or resume) the IndiaFilings create-chain for OPC / Private Limited.
export const sendApplicationToVendor = async (payload: Auth & { applicationId: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/send-to-vendor`,
            {}
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Kick off the payment-phase vendor steps (lead → customer → payment →
// engagement → name application) right after the gateway payment succeeds —
// payments go through Cashfree, which can't start the chain itself. Fire-and-
// forget; the backend runs it in the background and it's idempotent.
export const startVendorPaymentPhase = async (payload: Auth & { applicationId: string }) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/vendor-payment-phase`,
            {}
        );
        return resp.data;
    } catch {
        return false;
    }
};

export interface ApplicationStatus {
    applicationId: string;
    entityType: string;
    status: string;
    paymentStatus: string;
    vendorStatus: string;
    vendorApplicationId: string | null;
    vendorStages: Record<
        string,
        {
            status: string;
            at?: string;
            error?: string;
            // Stage detail — the documents stage stores per-document upload
            // results ({ results: [{ docType, status, reason }] }).
            meta?: {
                results?: Array<{ docType: string; status: string; reason?: string }>;
            } & Record<string, unknown>;
        }
    > | null;
    vendorError: string | null;
    srn: string | null;
    // Set once RM feedback is submitted — gates the feedback modal server-side.
    feedbackGiven?: boolean;
    createdAt: string;
    // When the final submit happened — createdAt is the draft-creation date.
    submittedAt: string | null;
    engagement: {
        eid?: number;
        engagement_status?: string;
        rm?: string;
        rm_role?: string | null;
        // RM contact fields added by the vendor 17-07 (rmemail may be the
        // generic support address while the RM is unassigned).
        rmsim?: string | null;
        rmemail?: string | null;
        // Which side the engagement is pending with (Government / RM / Client).
        pending_with?: string;
        micro_status?: string;
        last_notes?: string;
        next_followup?: string;
        date_started?: string;
        // Deliverables (COI etc.) appear here after registration completes;
        // entry shape unconfirmed on sandbox, parsed defensively.
        documents?: unknown[];
    } | null;
    // KYC docs per person, from /docs/kyc-status (each has a public doc_link).
    peopleDocuments?: Array<{
        peopleId?: number | string;
        name?: string | null;
        role?: string | null;
        documents?: Array<{
            documentType?: string | null;
            fileName?: string | null;
            docLink?: string | null;
            docId?: string | null;
            uploadedAt?: string | null;
        }>;
    }>;
}

// Exchange a vendor doc id (engagement deliverable / own upload) for a
// short-lived signed URL.
export const viewApplicationDocument = async (
    payload: Auth & { applicationId: string; docId: string }
) => {
    try {
        const resp: SuccessGenericResponse<{ docId: string; signedUrl: string }> =
            await ApiClient.post(
                `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/documents/view`,
                { docId: payload.docId }
            );
        return resp.data;
    } catch {
        return false;
    }
};

export const getApplicationStatus = async (payload: Auth & { applicationId: string }) => {
    try {
        const resp: SuccessGenericResponse<ApplicationStatus> = await ApiClient.get(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/status`
        );
        return resp.data;
    } catch {
        return false;
    }
};

// Bridge the customer to their RM via Exotel (masked call). The RM number stays
// server-side; on success the customer's phone rings, then the RM is connected.
export const callRm = async (
    payload: Auth & { applicationId: string }
): Promise<{ status?: string } | { error: string } | false> => {
    try {
        const resp: SuccessGenericResponse<{ status?: string }> = await ApiClient.post(
            `${base(payload)}/applications/${encodeURIComponent(payload.applicationId)}/call-rm`,
            {}
        );
        return resp.data;
    } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;
        return message ? { error: message } : false;
    }
};

// RM feedback (vendor google-reviews rating). deviceType 'mobile' → status 2,
// else Desktop; collected when the applicant leaves the tracking page of a
// fully-incorporated application.
export const submitFeedback = async (
    payload: Auth & {
        applicationId: string;
        engagementId: number | string;
        rating: number;
        feedback?: string;
        deviceType: string;
    }
) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${base(payload)}/feedback`,
            {
                applicationId: payload.applicationId,
                engagementId: payload.engagementId,
                rating: payload.rating,
                feedback: payload.feedback ?? '',
                deviceType: payload.deviceType,
            }
        );
        return resp.data ?? true;
    } catch {
        return false;
    }
};
