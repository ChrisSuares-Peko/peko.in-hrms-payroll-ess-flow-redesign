import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
// eslint-disable-next-line import/no-cycle
import { ApiClient } from '@src/services/config';

export interface GovernmentServiceApplicationPayload extends UserPayload {
    accessKey: string;
    formData: Record<string, unknown>;
    applicationId?: number | null;
    status?: string;
}

export interface GovernmentServiceApplicationResponse {
    applicationId: string;
    status: string;
}

export interface ApplicationDraft {
    id: number;
    applicationNumber: string;
    currentStep: number;
    status: string;
    // 'COMPLETED' once paid — redirects straight into the Trademark filing form.
    paymentStatus?: string;
    // Vendor gid (Create Lead) / engagement_id (Create Order) — null until those calls have run.
    gid: string | null;
    engagementId: string | null;
    formData: Record<string, Record<string, string>>;
    approvedDocument: string | null;
}

export const submitGovernmentServiceApplicationApi = async (
    payload: GovernmentServiceApplicationPayload
) => {
    try {
        const { userId, userType, accessKey, formData, applicationId, status } = payload;
        const resp: SuccessGenericResponse<GovernmentServiceApplicationResponse> =
            await ApiClient.post(`${userType}/${userId}/purchase/govt-services/v2/applications`, {
                accessKey,
                formData,
                ...(applicationId ? { applicationId } : {}),
                ...(status ? { status } : {}),
            });
        return resp.data;
    } catch {
        return false;
    }
};

export interface ApplicationListItem {
    id: number;
    applicationNumber: string;
    service: string;
    status: string;
    currentStep: number;
    adminNotes: string | null;
    remarks: string | null;
    approvedDocument: string | null;
    createdAt: string;
    updatedAt: string;
}

export const getAllGovernmentServiceApplicationsApi = async (
    userId: string | number,
    userType: string
): Promise<ApplicationListItem[]> => {
    try {
        const resp: SuccessGenericResponse<ApplicationListItem[]> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/applications`
        );
        return resp.data ?? [];
    } catch {
        return [];
    }
};

// V2 catalog listing row (synced vendor catalog) — no accessKey/slug/category/tag, unlike the old admin-managed catalog.
export interface GovtServiceApiItem {
    id: string;
    service_id: number | null;
    service_name: string | null;
    variant_name: string | null;
    description: string | null;
    market_price: number;
    price: number;
    government_fee_amount: number;
    unit: string | null;
    currency: string | null;
    about: string | null;
    sortOrder: number;
    status: boolean;
}

interface GovtServiceCatalogListResponse {
    total: number;
    data: GovtServiceApiItem[];
}

export const getGovtServicesListApi = async (
    userId: string | number,
    userType: string,
    params?: {
        service_id?: string | number;
    }
): Promise<GovtServiceApiItem[]> => {
    try {
        const resp: SuccessGenericResponse<GovtServiceCatalogListResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/services`,
            { params }
        );
        return resp.data?.data ?? [];
    } catch {
        return [];
    }
};

// Registers a vendor CRM lead for the "Consult expert" callback request — not tied to any application.
export const requestExpertCallbackApi = async (
    userId: string | number,
    userType: string,
    payload: { name: string; email: string; mobile: string; catalogId?: string }
): Promise<boolean> => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/request-callback`,
            payload
        );
        return Boolean(resp.data ?? resp.status);
    } catch {
        return false;
    }
};

// Raw vendor catalog response for one service, passed through as-is — richer than GovtServiceApiItem.
export interface VendorServiceDetail {
    id: number;
    bid: number;
    partner_bid: number;
    service_id: number;
    category: string;
    sub_category: string;
    type: number;
    government_department: string;
    partner_name: string;
    service_name: string;
    variant_name: string;
    description: string;
    rating: string;
    customers: number;
    market_price: number;
    price: number;
    price_type: number;
    government_fee_amount: number;
    payment_type: string;
    delivery_time: number;
    about: string;
    page_url: string;
    unit: string;
    currency: string;
    status: boolean;
    imageURL: string;
    entity: string;
    priceType: string;
    country: string;
    Engagement_Subscription_Status: string;
    [key: string]: unknown;
}

// Live pricing fetched fresh from the vendor (not the synced snapshot) for the payment review screen.
// serviceId is the vendor's numeric service_id, not vendorCatalogId — one service_id can resolve to multiple variant rows, all returned here.
export const getVendorServiceDetailsApi = async (
    userId: string | number,
    userType: string,
    serviceId: number | string
): Promise<VendorServiceDetail[]> => {
    try {
        const resp: SuccessGenericResponse<{ total: number; variants: VendorServiceDetail[] }> =
            await ApiClient.get(`${userType}/${userId}/purchase/govt-services/v2/service-details`, {
                params: { service_id: serviceId },
            });
        return resp.data?.variants ?? [];
    } catch {
        return [];
    }
};

// Vendor-required document types for a service, grouped by doc_group/doc_type — backs the Required Documents list.
export interface VendorServiceDocument {
    id: number;
    service_id: number;
    ledgers_document_id: number;
    smartservice: number;
    status: number;
    doc_name: string;
    doc_type: string;
    doc_group: string;
    // The identifier the vendor's Service Document upload call actually wants —
    // see uploadObjectionDocumentApi in apis/objection.ts.
    document_Nid: number | string;
}

export const getVendorServiceDocumentsApi = async (
    userId: string | number,
    userType: string,
    serviceId: number | string
): Promise<VendorServiceDocument[]> => {
    try {
        const resp: SuccessGenericResponse<{ total: number; documents: VendorServiceDocument[] }> =
            await ApiClient.get(
                `${userType}/${userId}/purchase/govt-services/v2/service-documents`,
                { params: { service_id: serviceId } }
            );
        return resp.data?.documents ?? [];
    } catch {
        return [];
    }
};

// Uploads a single vendor-catalog document (doc_Nid from getVendorServiceDocumentsApi above) as a
// Service Document — same underlying vendor call as uploadTrademarkLogoApi's Logo Upload, just not
// pinned to one fixed doc type. Endpoint path is historical (Objection was its first caller) but
// the handler itself is generic — used here by IEC's own Documents step too.
export const uploadVendorServiceDocumentApi = async (
    userId: string | number,
    userType: string,
    vendorCatalogId: string,
    applicationRowId: number,
    documentNid: number | string,
    docName: string,
    fileBase64: string,
    fileName: string
): Promise<{ fileUrl: string | null } | null> => {
    try {
        const resp: SuccessGenericResponse<{ fileUrl: string | null }> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/objection-document`,
            { vendorCatalogId, applicationRowId, documentNid, docName, fileBase64, fileName }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Vendor business record — used by services (e.g. Trademark) needing an existing registered business rather than the generic profile.
export interface VendorBusiness {
    application_id: number;
    business_name: string;
    constitution: string;
    pan: string;
    state: string;
    // Address block from Business List — always prefilled here, never typed manually.
    address_line1?: string;
    address_line2?: string;
    city?: string;
    district?: string;
    pincode?: string | number | null;
    country?: string;
    // Registered contact person — prefills Authorized Person. Unlike email/mobile here, name is NOT Base64-encoded.
    name?: string;
}

export const getVendorBusinessesApi = async (
    userId: string | number,
    userType: string,
    // Scopes to this application's own gid; falls back to the shared account-wide gid when omitted.
    gid?: string | null
): Promise<VendorBusiness[]> => {
    try {
        const resp: SuccessGenericResponse<{ total: number; businesses: VendorBusiness[] }> =
            await ApiClient.get(
                `${userType}/${userId}/purchase/govt-services/v2/vendor-businesses`,
                { params: gid ? { gid } : undefined }
            );
        return resp.data?.businesses ?? [];
    } catch {
        return [];
    }
};

// Single-business record scoped to one application_id — auto-fills Applicant Details when resuming an application.
// Fields often come back empty on the vendor sandbox — treat as prefill-if-present, not guaranteed complete.
export interface VendorBusinessDetail {
    application_id: number;
    gid: number;
    bid: string | number;
    business_name: string;
    trade_name: string;
    pan: string;
    gstin: string;
    cin: string;
    udyam: string;
    name: string;
    email: string;
    mobile: string;
    business_email: string;
    business_mobile: string;
    aadhaar: string;
    address_line1: string;
    address_line2: string;
    state: string;
    city: string;
    district: string;
    pincode: string | number | null;
    country: string;
    business_area: string;
    constitution: string;
    application_status: string;
    created_on: string;
    source: string;
    [key: string]: unknown;
}

export interface VendorBusinessDetailResult {
    business: VendorBusinessDetail | null;
    directors: VendorDirector[];
    shareholding: unknown[];
    // Raw vendor View Business passthrough shape — some responses come back as-is
    // (business_info/promoter_info/shareholder_info) instead of reshaped into business/directors/
    // shareholding above. Field names line up with VendorDirector closely enough (salutation/
    // first_name/middle_name/last_name/etc.) for directorDisplayName to still work on these.
    promoter_info?: VendorDirector[];
}

export const getVendorBusinessDetailApi = async (
    userId: string | number,
    userType: string,
    applicationId: string | number
): Promise<VendorBusinessDetailResult | null> => {
    try {
        const resp: SuccessGenericResponse<VendorBusinessDetailResult> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/vendor-business-detail`,
            { params: { application_id: applicationId } }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

export interface CreateVendorBusinessResult {
    applicationId: number | null;
    created: boolean;
    // customer_id from Create Lead, used as gid for Create Business — null when alreadyExists (Create Business never ran).
    gid: string | null;
    // Whether Create Lead succeeded — best-effort, can be false even if the business itself was created fine.
    leadCreated: boolean;
    // True when Create Lead reported the application already exists (Create Business was skipped) — applicationId is still usable.
    alreadyExists?: boolean;
    // Top-level API message, surfaced instead of a generic success toast.
    message?: string;
}

export const createVendorBusinessApi = async (
    userId: string | number,
    userType: string,
    pan: string,
    entityType: string,
    // Legal Business Name / state for the Create Business call.
    proposedName: string,
    state: string,
    // Corporate's identity sent to Create Lead before Create Business; vendor's returned customer_id becomes the gid.
    name: string,
    email: string,
    mobile: string,
    // Service.accessKey, renamed on the wire — "accessKey" already means something else here (accessKeys.governmentServices). No dedup: a fresh lead every call.
    vendorCatalogId?: string
): Promise<CreateVendorBusinessResult | null> => {
    try {
        const resp: SuccessGenericResponse<CreateVendorBusinessResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/vendor-businesses`,
            { pan, entityType, proposedName, state, name, email, mobile, vendorCatalogId }
        );
        return resp.data ? { ...resp.data, message: resp.message } : null;
    } catch {
        return null;
    }
};

// PAN validity check before creating a vendor business. Same response shape as BusinessRegistration's verify-pan — parse with its parsePanHolder.
export const verifyVendorPanApi = async (
    userId: string | number,
    userType: string,
    pan: string
): Promise<unknown | null> => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/verify-pan`,
            { pan }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

export const getGovernmentServiceApplicationApi = async (
    userId: string | number,
    userType: string,
    accessKey: string,
    applicationRowId?: number | null
): Promise<ApplicationDraft | null> => {
    try {
        const resp: SuccessGenericResponse<ApplicationDraft | null> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/applications/drafts`,
            { params: { accessKey, ...(applicationRowId ? { id: applicationRowId } : {}) } }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Matches a goods/service description to WIPO Nice class(es) + descriptions — backs Step 2's Class/Description auto-fill.
export interface TrademarkClassDescription {
    class: number;
    description: string;
}

export interface TrademarkClassResult {
    classesIdentified: string[];
    descriptions: TrademarkClassDescription[];
    classResult: string | null;
}

export const getTrademarkClassApi = async (
    userId: string | number,
    userType: string,
    goodsOrServices: string
): Promise<TrademarkClassResult | null> => {
    try {
        const resp: SuccessGenericResponse<TrademarkClassResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/trademark-description`,
            { goods_or_services: goodsOrServices }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Language master list for Step 2's Language field — served from the BE rather than hardcoded.
export const getTrademarkLanguagesApi = async (
    userId: string | number,
    userType: string
): Promise<string[]> => {
    try {
        const resp: SuccessGenericResponse<{ languages: string[] }> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/languages`
        );
        return resp.data?.languages ?? [];
    } catch {
        return [];
    }
};

export interface LocationLookupResult {
    state: string;
    country: string;
    district: string;
    city: string;
    area?: string[];
    latitude?: string;
    longitude?: string;
    indiafilings?: string;
    pincode: string;
}

// Pincode -> state/district/country/city. Only used when the corporate edits the pincode away from the Business API's prefill.
export const locationLookupApi = async (
    userId: string | number,
    userType: string,
    pincode: string
): Promise<LocationLookupResult | null> => {
    try {
        const resp: SuccessGenericResponse<LocationLookupResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/location`,
            { pincode }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Matches a brand name against existing trademarks — backs Step 2's Brand search. logo is base64 JPEG with no "data:" prefix.
export interface SimilarTrademark {
    tm_applied_for: string;
    agent_name: string;
    proprietor_address: string;
    county: string;
    trade_mark_type: string;
    appropriate_office: string;
    proprietor_name: string;
    application_no: string;
    tm_status: string;
    logo: string;
    application_date: string;
    state: string;
    class: string;
    timestamp: string;
}

export const searchSimilarTrademarksApi = async (
    userId: string | number,
    userType: string,
    searchTerm: string
): Promise<SimilarTrademark[]> => {
    try {
        const resp: SuccessGenericResponse<{ similar: SimilarTrademark[] }> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/trademark-search`,
            { params: { search_term: searchTerm } }
        );
        return resp.data?.similar ?? [];
    } catch {
        return [];
    }
};

// Live engagement details — backs the Relationship Manager card (RM name/role/contact, status, next follow-up).
export interface EngagementStatus {
    eid: number;
    gid: number;
    name: string;
    business_name: string;
    rm: string;
    rmgid: number;
    rm_profile: string;
    rm_role: string | null;
    rmsim: number | string | null;
    rmemail: string;
    serviceid: number;
    service: string;
    next_followup: string;
    micro_status: string;
    last_notes: string;
    pending_with: string;
    eng_status: number;
    engagement_status: string;
    completed_on: string;
    date_started: string;
    [key: string]: unknown;
}

export const getEngagementStatusApi = async (
    userId: string | number,
    userType: string,
    engagementId: string
): Promise<EngagementStatus | null> => {
    try {
        const resp: SuccessGenericResponse<{ engagement: EngagementStatus | null }> =
            await ApiClient.get(
                `${userType}/${userId}/purchase/govt-services/v2/engagement-status`,
                { params: { engagement_id: engagementId } }
            );
        return resp.data?.engagement ?? null;
    } catch {
        return null;
    }
};

export const callRmGovernmentServiceApi = async (
    userId: string | number,
    userType: string,
    engagementId: string
): Promise<{ status?: string } | { error: string } | false> => {
    try {
        const resp: SuccessGenericResponse<{ status?: string }> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/business-registration/call-rm`,
            { engagement_id: engagementId }
        );
        return resp.data;
    } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        return message ? { error: message } : false;
    }
};

// Uploads the Logo Upload step's file as a Service Document; document_Nid is resolved server-side.
// Named vendorCatalogId, not accessKey — accessKey already means something else here (accessKeys.governmentServices).
export interface UploadTrademarkLogoResult {
    // Our own cloud copy's public URL (not a vendor reference) — kept for our own records.
    logoUrl: string | null;
}

export const uploadTrademarkLogoApi = async (
    userId: string | number,
    userType: string,
    vendorCatalogId: string,
    fileBase64: string,
    fileName: string,
    applicationRowId?: number | null
): Promise<UploadTrademarkLogoResult | null> => {
    try {
        const resp: SuccessGenericResponse<UploadTrademarkLogoResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/trademark-logo`,
            {
                vendorCatalogId,
                fileBase64,
                fileName,
                ...(applicationRowId ? { applicationRowId } : {}),
            }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Files the Trademark Smart Form and marks the application COMPLETED — backs the Preview step's Submit button.
// Same vendorCatalogId/accessKey naming reason as uploadTrademarkLogoApi; same applicationRowId reasoning too.
export const submitTrademarkFilingApi = async (
    userId: string | number,
    userType: string,
    vendorCatalogId: string,
    formData: Record<string, unknown>,
    applicationRowId?: number | null
): Promise<{ applicationId: number } | null> => {
    try {
        const resp: SuccessGenericResponse<{ applicationId: number }> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/trademark-filing`,
            { vendorCatalogId, formData, ...(applicationRowId ? { applicationRowId } : {}) }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// HSN (goods) code search for Step 3's "Top 5 - Goods & Services" field. Goods only — SAC
// (services) search is a separate, still-unconfirmed endpoint (see govtServicesV2.js#searchHsnCodeV2).
export interface HsnCodeResult {
    code: string;
    description: string;
    display: string;
}

export const searchHsnCodeApi = async (
    userId: string | number,
    userType: string,
    searchTerm: string
): Promise<HsnCodeResult[]> => {
    try {
        const resp: SuccessGenericResponse<{ hsn: HsnCodeResult[] }> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/v2/hsn-search`,
            { params: { search_term: searchTerm } }
        );
        return resp.data?.hsn ?? [];
    } catch {
        return [];
    }
};

// Pincode -> GST jurisdiction (Commissionerate/Circle/Division/Range) for Step 2's Address Details
// dropdowns (GST_Registration.pdf §E6) — confirmed live via purchase's gstJurisdictionLookupV2.
export interface GstJurisdictionOption {
    label: string;
    value: string;
}

export interface GstJurisdictionResult {
    state: string;
    district: string;
    // Filing payload's city/place (GST_REGISTRATION_PDF_SPEC.md §E7a #18/#19) — same /pincode
    // call, not typed by the user.
    city: string;
    place: string;
    commissionerate: GstJurisdictionOption[];
    circle: GstJurisdictionOption[];
    division: GstJurisdictionOption[];
    range: GstJurisdictionOption[];
}

export const gstJurisdictionLookupApi = async (
    userId: string | number,
    userType: string,
    pincode: string
): Promise<GstJurisdictionResult | null> => {
    try {
        const resp: SuccessGenericResponse<GstJurisdictionResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/gst-jurisdiction`,
            { pincode }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Uploads a GST KYC/business document (PAN, Aadhaar, photo, address proof, bank details, etc.)
// as a Service Document; docType picks which document type via the vendor's document master
// (see purchase/controllers/corporate/govtServicesV2.js#uploadGstDocumentV2), not hardcoded to Logo.
export interface UploadGstDocumentResult {
    docUrl: string | null;
}

export const uploadGstDocumentApi = async (
    userId: string | number,
    userType: string,
    vendorCatalogId: string,
    fileBase64: string,
    fileName: string,
    docType: string,
    applicationRowId?: number | null
): Promise<UploadGstDocumentResult | null> => {
    try {
        const resp: SuccessGenericResponse<UploadGstDocumentResult> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/gst-document`,
            {
                vendorCatalogId,
                fileBase64,
                fileName,
                docType,
                ...(applicationRowId ? { applicationRowId } : {}),
            }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// Files the GST Registration Smart Form (PPOB, Service ID 79 / Form ID 1) and marks the
// application COMPLETED — same vendorCatalogId/applicationRowId reasoning as submitTrademarkFilingApi.
export const submitGstFilingApi = async (
    userId: string | number,
    userType: string,
    vendorCatalogId: string,
    formData: Record<string, unknown>,
    applicationRowId?: number | null
): Promise<{ applicationId: number } | null> => {
    try {
        const resp: SuccessGenericResponse<{ applicationId: number }> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/gst-filing`,
            { vendorCatalogId, formData, ...(applicationRowId ? { applicationRowId } : {}) }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// GST Registration Cancellation (service_id 126) — same generic application-row/filing pattern as
// submitGstFilingApi, own route since the backend handler builds a different smart-form payload
// (GST_Cancellation_Implementation_Plan.md §6.1 — submitGstCancellationV2, still gated on §3.2's
// unresolved vendor payload shape).
export const submitGstCancellationFilingApi = async (
    userId: string | number,
    userType: string,
    vendorCatalogId: string,
    formData: Record<string, unknown>,
    applicationRowId?: number | null
): Promise<{ applicationId: number } | null> => {
    try {
        const resp: SuccessGenericResponse<{ applicationId: number }> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/gst-cancellation-filing`,
            { vendorCatalogId, formData, ...(applicationRowId ? { applicationRowId } : {}) }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

// DB-backed application list (not the vendor's engagements/service API — that pulls every engagement under the shared gid, with no amount/paymentStatus and often-empty business_name).
// Backs "My Applications" — isFormSubmissionComplete drives the "Complete form submission" button.
export interface GovernmentServiceApplicationV2Item {
    id: number;
    applicationId: string | null;
    vendorCatalogId: string | null;
    // Vendor's numeric service_id (e.g. 79 = GST Registration) — picks the right registration-form route per service.
    serviceId: number | null;
    serviceName: string | null;
    variantName: string | null;
    legalBusinessName: string | null;
    amount: number | string;
    status: 'DRAFT' | 'SUBMITTED' | 'COMPLETED';
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
    // Vendor gid (Create Lead) / engagement_id (Create Order) — null until those calls have run.
    gid: string | null;
    engagementId: string | null;
    createdOn: string;
    isFormSubmissionComplete: boolean;
}

export const getAllGovernmentServiceApplicationsV2Api = async (
    userId: string | number,
    userType: string,
    params?: { page?: number; limit?: number; status?: string }
): Promise<{ total: number; applications: GovernmentServiceApplicationV2Item[] }> => {
    try {
        const resp: SuccessGenericResponse<{
            total: number;
            applications: GovernmentServiceApplicationV2Item[];
        }> = await ApiClient.get(`${userType}/${userId}/purchase/govt-services/v2/applications`, {
            params,
        });
        return resp.data ?? { total: 0, applications: [] };
    } catch {
        return { total: 0, applications: [] };
    }
};

export interface VendorDirector {
    id?: string;
    people_id?: string;
    salutation?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    fname?: string;
    dob?: string;
    isd_code?: string;
    mobile?: string;
    email?: string;
    aadhaar?: string;
    din?: string;
    pan?: string;
    passport_number?: string;
    qualification?: string;
    occupation?: string;
    gender?: string;
    citizenship?: string;
    residency?: string;
    address_line1?: string;
    address_line2?: string;
    country_code?: string;
    postal_code?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    duration_year?: string;
    duration_month?: string;
    birth_place?: string;
    birth_district?: string;
    relationship?: string;
}

export const addVendorDirectorApi = async (
    userId: string | number,
    userType: string,
    director: VendorDirector & { gid: string; application_id: string | number }
): Promise<{ peopleId: string | null; message: string } | null> => {
    try {
        const resp: SuccessGenericResponse<{ peopleId: string | null }> = await ApiClient.post(
            `${userType}/${userId}/purchase/govt-services/v2/vendor-director`,
            director
        );
        return { peopleId: resp.data?.peopleId ?? null, message: resp.message ?? 'Director added successfully' };
    } catch {
        return null;
    }
};
