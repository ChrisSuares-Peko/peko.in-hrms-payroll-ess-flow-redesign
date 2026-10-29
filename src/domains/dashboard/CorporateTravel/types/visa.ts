// ─── OneVasco API Types ───────────────────────────────────────────────────────

export interface VisaCountry {
    id: number;
    name: string;
    code: string;
}

export interface NatResCountry {
    name: string;
    code: string; // numeric string used as country ID, e.g. "103"
}

// ─── Country Flags ────────────────────────────────────────────────────────────

export interface CountryFlag {
    name: string;
    code: string; // ISO alpha-2, e.g. "AE"
    emoji: string;
    unicode: string;
    image: string; // flag SVG URL
}

export interface NationalityResidencyResponse {
    nationality: NatResCountry[];
    residency: NatResCountry[];
}

export interface VisaRoe {
    id: number;
    from_currency: string;
    to_currency: string;
    exchange_rate: string;
    value_date: string;
}

export interface VisaComponent {
    component_id: number;
    sub_entity_id: number;
    vendor_id: number;
    component: string;
    taxable: number;
    calculated: number;
    remark: string | null;
    original_cost: number;
    original_currency: string;
    currency: string;
    roe: VisaRoe | null;
    hsn_code: string;
    fx_cost: number;
    fx_additional_pax_cost: number;
    cost: number;
    additional_pax_cost: number;
    child_cost?: number;
    fx_child_cost?: number;
    original_child_cost?: string;
}

export interface VisaBreakup {
    total_tax_amount: number;
    total_service_fee: number;
    total_tax_service_fee: number;
    discount_applied: number;
    total_round_off: number;
    total_value: number;
    markup_tax_applicable: number;
    total_taxable_value: number;
    total_non_taxable_value: number;
    total_fx_convenience_fee: number;
    total_component_value: number;
    components: VisaComponent[];
    total_govt_fees: number;
    insurance_enabled?: boolean;
}

export interface VisaAgeGroupFees {
    'Embassy Fees': number;
    'Service Fee': number;
    'Platform Fee': number;
    'Total Tax': number;
    Total: number;
}

export interface VisaProduct {
    product_id: number;
    visa_name: string;
    visa_code: string;
    visa_type: string;
    visa_duration: string;
    visa_validity: string;
    entries_allowed: string;
    notes: string[];
    jurisdiction_applicable: number;
    breakup: VisaBreakup;
    age_cost_breakup: {
        adult: VisaAgeGroupFees;
        child?: VisaAgeGroupFees;
        infant?: VisaAgeGroupFees;
    };
    age_definition?: Array<{
        adult?: { min_age: string | number };
        child?: { min_age: number; max_age: number };
        infant?: { min_age: number; max_age: number };
    }>;
    min_time_delta_travel_date: number | null;
    base_currency: string;
    embassy_tat: number;
    category?: string;
}

export interface VisaProductDocument {
    id: number;
    document_code: string;
    display_value: string;
    document_category: string;
    description: string;
}

// ─── Order Creation ───────────────────────────────────────────────────────────

export interface StagedVisaDocument {
    document_code: string;
    s3Key: string;
}

export interface StageVisaDocumentResponse {
    status: boolean;
    data: {
        s3Key: string;
        documentCode: string;
    };
}

export interface VisaApplicantPayload {
    dob: string;
    last_name: string;
    first_name: string;
    passport_no: string;
    contact_number?: string;
    documents?: StagedVisaDocument[];
}

export interface CreateVisaOrderPayload {
    customer_email: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_mobile: string;
    customer_billing_address_line_1: string;
    customer_billing_address_line_2?: string;
    customer_billing_pincode: string;
    customer_billing_state: string;
    customer_billing_state_tax_code: string;
    customer_billing_country: string;
    customer_billing_city: string;
    group_name: string;
    adult: number;
    child: number;
    infant: number;
    residency: number;
    nationality: number;
    product_id: number;
    amount: number;
    applicants: VisaApplicantPayload[];
    travel_date: string;
    unique_identifier: string;
    partner: string;
    base_currency: string;
    visa_name?: string;
    visa_type?: string;
    destination_name?: string;
    category?: string;
    product_breakup?: {
        breakup: VisaBreakup;
        age_cost_breakup: {
            adult: VisaAgeGroupFees;
            child?: VisaAgeGroupFees;
            infant?: VisaAgeGroupFees;
        };
    };
}

export interface CreatedApplicant {
    id: number;
    dob: string;
    last_name: string;
    first_name: string;
    passport_no: string;
    category: string;
}

export interface CreateVisaOrderResponse {
    status: boolean;
    message: string;
    data: {
        order_number: string;
        applications: CreatedApplicant[];
    };
}

// ─── Document APIs ────────────────────────────────────────────────────────────

export interface ApplicantDocumentRequired {
    document_id: string;
    code: string;
    required: number;
    display: string;
}

export interface UploadDocumentPayload {
    application_id: number;
    order_number: string;
    document_code: string;
    file: File;
}

export interface UploadDocumentResponse {
    status: boolean;
    message: string;
}

// ─── Status APIs ──────────────────────────────────────────────────────────────

export interface ApplicationStatus {
    status_code: string;
    terminal: number;
    frontend_status: string;
}

export interface OrderApplicantStatus {
    id: number;
    status: ApplicationStatus;
    name: string;
}

// ─── Product Content ──────────────────────────────────────────────────────────

export interface VisaContent {
    id: number;
    name: string;
    visa_name: string;
    visa_code: string;
    description: string;
    total: string;
    validity: string;
    turn_around_time: string;
    country_id: number;
    type: string;
    documents_required: string;
    photo_specification: string;
    no_of_entries: string;
    duration: string;
    visiting_country: string;
    citizen_country: string;
    residence_country: string;
    eligibility: string;
    travel_guidelines: string;
}

// ─── Search Params ────────────────────────────────────────────────────────────

export interface VisaSearchQueryParams {
    residency: number;
    nationality: number;
    destination: number;
    travelDate: string;
    category: string;
    adult: number;
    child: number;
    infant: number;
}

// ─── Destinations ─────────────────────────────────────────────────────────────

export interface VisaAddOn {
    name: string;
    description: string;
    price: number;
    price_type: 'per_person' | 'flat_fee';
}

export interface VisaDestination {
    destination: string;
    country_id: number;
    visa_types: string[];
    visa_categories: string[];
    add_on?: VisaAddOn[];
}

// ─── Order Details ────────────────────────────────────────────────────────────

export interface VisaOrderDocument {
    document_code: string;
    display_value: string;
    status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'UPLOADED';
    rejection_reason?: string;
    file_name?: string;
    s3Url?: string;
    application_id?: string | number | null;
    icon?: string;
}

export interface VisaOrderDetails {
    order_number: string;
    destination: string;
    visa_name: string;
    visa_type: string;
    visa_format: string;
    visa_duration: string;
    entries_allowed: string;
    travel_date: string;
    applicants_count: number;
    frontend_status: string;
    status_code: string;
    documents: VisaOrderDocument[];
    add_ons?: string[];
    step_dates?: Record<string, string>;
}

// ─── Redux State ──────────────────────────────────────────────────────────────

export interface VisaState {
    searchParams: VisaSearchQueryParams | null;
    searchResults: VisaProduct[];
    selectedProduct: VisaProduct | null;
    orderNumber: string | null;
    applicants: CreatedApplicant[];
    isLoading: boolean;
}
