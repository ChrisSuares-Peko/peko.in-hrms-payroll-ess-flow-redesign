// The three Droom-backed report products. Used as the `:reportType` route param, so the
// values double as URL segments (see paths.turbo.valuationReport / historyReport / inspection).
export type ReportType = 'valuation' | 'history' | 'inspection';

export const REPORT_TYPES: ReportType[] = ['valuation', 'history', 'inspection'];

// All three products are wired against Droom. Kept as a list rather than dropped, because
// the landing card renders anything absent here as a disabled "Coming soon".
// Mirrors PURCHASABLE_REPORT_TYPES in Peko-IN/officeAndBusiness/utils/carReport.js.
export const PURCHASABLE_REPORT_TYPES: ReportType[] = ['valuation', 'history', 'inspection'];

export const isReportType = (value?: string): value is ReportType =>
    !!value && REPORT_TYPES.includes(value as ReportType);

// A vehicle the report is being bought for. Either picked from the user's Turbo fleet
// (`id` present) or entered by hand, in which case only `isManual` is set and the
// report form itself collects every detail — hence every other field is optional.
export interface SelectedVehicle {
    id?: number;
    vehicleNumber?: string;
    manufacturer?: string;
    model?: string;
    variant?: string;
    bodyType?: string;
    isManual?: boolean;
}

export interface FeatureItem {
    text: string;
    // Muted secondary line, e.g. the "Best for" note on the landing cards.
    subText?: string;
}

export interface ReportTypeCardData {
    reportType: ReportType;
    title: string;
    badge: string;
    price: number;
    // Inspection is "Starting at ₹599" — the badge above the price.
    pricePrefix?: string;
    description: string;
    ctaText: string;
    bestFor: string;
    included: string[];
}

export interface InspectionPackage {
    id: string;
    name: string;
    price: number;
    highlights: string[];
    // Premium+ truncates its highlight list behind a "See more..." link.
    hasMore?: boolean;
    // Health Report is a teaser in v1: no price, "Know more" instead of "Continue".
    isTeaser?: boolean;
}

// Vehicle type, shared by the valuation form and the inspection service-select step.
// These are Droom's own accepted `category` values, sent verbatim to the catalog and
// OBV endpoints — lowercase and hyphenated, so they are a wire format, never display
// copy. Labels live alongside them in vehicleCategoryOptions.
export type VehicleCategory =
    | 'car'
    | 'electric-car'
    | 'motorcycle'
    | 'scooter'
    | 'electric-scooter'
    | 'electric-bike';

export interface SelectOption {
    label: string;
    value: string;
}

// ---------------------------------------------------------------- form values

export type ValuationPurpose = 'buy' | 'sell';
export type ValuationCounterparty = 'individual' | 'dealer';

export interface ValuationFormValues {
    purpose: ValuationPurpose | '';
    counterparty: ValuationCounterparty | '';
    vehicleCategory: string;
    make: string;
    model: string;
    manufacturingYear: string;
    variant: string;
    kilometresDriven: string;
    // Required by Droom's OBV endpoint — prices vary by market, so there is no
    // sensible default to fall back on (see DROOM_MYBIZ_API_REFERENCE.md §3).
    city: string;
}

export interface HistoryFormValues {
    registrationNumber: string;
}

// Slot fields are flat (not `slots[0].date`) because TimePickerInput reads
// `touched[name]` / `errors[name]` directly and cannot resolve nested paths.
export interface InspectionFormValues {
    bodyType: string;
    make: string;
    model: string;
    manufacturingYear: string;
    variant: string;
    registrationNumber: string;
    contactName: string;
    mobileNumber: string;
    fullAddress: string;
    pincode: string;
    city: string;
    state: string;
    slot1Date: string;
    slot1Time: string;
    slot2Date: string;
    slot2Time: string;
}

export type ReportFormValues = ValuationFormValues | HistoryFormValues | InspectionFormValues;

// ---------------------------------------------------------------- orders

export type ReportStatus = 'Building' | 'Ready' | 'Booked' | 'Cancelled' | 'Failed';

export interface ReportOrder {
    orderId: string;
    reportType: ReportType;
    reportName: string;
    vehicleNumber: string;
    vehicleModel: string;
    orderDate: string;
    amount: number;
    status: ReportStatus;
}

export interface ProgressStep {
    label: string;
    // 'done' → green tick, 'active' → spinner, 'pending' → empty circle.
    state: 'done' | 'active' | 'pending';
}

export interface PriceBand {
    grade: string;
    min: number;
    max: number;
}

// Present on the order detail only once Droom's async PaaS report has completed —
// `reportUrl` is the vendor-hosted PDF the header's download button opens, `bands` the
// four condition-grade ranges the backend fetched from OBV on first open (absent when
// the vendor could not price the spec).
export interface ValuationResult {
    modelName: string;
    year: string;
    kilometres: string;
    city: string;
    reportUrl: string;
    bands?: PriceBand[];
}

// Every field is a display string — the backend normalises Droom's RC payload (§4) into
// exactly this shape and HistoryResultCard renders the values verbatim.
export interface HistoryResult {
    modelName: string;
    registrationNumber: string;
    ownership: string;
    registration: string;
    insurance: string;
    puc: string;
    blacklist: string;
    hypothecation: string;
    bodyType?: string;
    fuelType?: string;
    // The RC endpoint does not return challans; merging Droom's separate challan API is a
    // follow-up, so nothing populates this today.
    challans?: string;
}

export interface InspectionBookingResult {
    slot1: string;
    slot2?: string;
    address: string;
}

export interface ReportOrderDetail extends ReportOrder {
    paymentMode: string;
    bodyType?: string;
    // Vendor PDF behind the header's download button — valuation and history.
    reportUrl?: string;
    steps: ProgressStep[];
    valuation?: ValuationResult;
    history?: HistoryResult;
    inspection?: InspectionBookingResult;
}

// ---------------------------------------------------------------- payment

export interface VehicleReportPaymentArgs {
    reportType: ReportType;
    vehicle: SelectedVehicle;
    reportPrice: number;
    // Inspection only — the chosen package name, shown as the bill line item.
    packageName?: string;
    // Inspection only — the package id the backend prices from. Sent separately from
    // `packageName` on purpose: a copy edit to the display name must never change what
    // the customer is charged.
    packageId?: string;
    formValues: ReportFormValues;
}
