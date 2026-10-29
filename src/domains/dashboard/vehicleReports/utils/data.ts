import {
    InspectionPackage,
    ReportStatus,
    ReportTypeCardData,
    SelectOption,
    VehicleCategory,
} from '../types/index';

// ---------------------------------------------------------------------------
// Static presentation data for the Vehicle Reports screens: product copy, package
// definitions, and the status style/label maps. Orders are NOT here — they come from
// the payment service (see ../api/index.ts).
// ---------------------------------------------------------------------------

// ------------------------------------------------------------- landing (frame B)

export const reportTypeCards: ReportTypeCardData[] = [
    {
        reportType: 'valuation',
        title: 'Valuation Report',
        badge: 'PDF report',
        price: 199,
        description: 'Fair market price range for any car across four condition grades.',
        ctaText: 'Get valuation',
        bestFor:
            "Best for : Choose this report when you want to know a car's fair market value before buying, selling or renewing.",
        included: [
            'Vendor-certified fair market value',
            'Four condition grades compared',
            'Pricing tuned to kms, city & owners',
            'Detailed PDF valuation report',
        ],
    },
    {
        reportType: 'history',
        title: 'Vehicle History Report',
        badge: 'Instant report',
        price: 129,
        description: 'Full background of a vehicle pulled from official registries.',
        ctaText: 'Check history',
        bestFor:
            'Best for : Choose this report when you want to verify ownership, registration, insurance, PUC, blacklist, hypothecation and challan history.',
        // Challan records come from Droom's separate challan endpoint, merged into the
        // report by the backend (carReportHistory.js) — the bullet is honest now.
        included: [
            'Ownership & registration records',
            'Insurance and PUC validity',
            'Blacklist & hypothecation checks',
            'Challan records on file',
        ],
    },
    {
        reportType: 'inspection',
        title: 'Vehicle Inspection',
        badge: 'Door step service',
        price: 599,
        pricePrefix: 'Starting at',
        description:
            'A certified technician inspects the vehicle at your address and reports its condition.',
        ctaText: 'View inspection options',
        bestFor:
            'Choose this report when you need a physical condition assessment, defect evidence, condition scores and repair estimates.',
        included: [
            'Basic, Premium and Premium+ packages',
            'Certified technician at your doorstep',
            'Condition scores and repair estimates',
            'Detailed PDF report',
        ],
    },
];

// ------------------------------------------------- history reveal panel (frame E)

// Per Figma 2876-28970 (bug 30120).
export const historyRevealItems = [
    'Ownership and registration details',
    'Insurance and PUC validity',
    'Blacklist and hypothecation status',
    'Challan details, where available',
];

// --------------------------------------------------- inspection (frames F and G)

// The three the inspection service-select step offers as radio cards.
export const inspectionCategories: VehicleCategory[] = ['car', 'motorcycle', 'scooter'];

// Self Inspection is the only package Droom offers us today — additions come through
// the admin-managed plans (carReportPlans) and their FE copy here, together.
export const inspectionPackages: InspectionPackage[] = [
    {
        id: 'basic',
        name: 'Self Inspection',
        price: 599,
        highlights: [
            '40+ vehicle checkpoints',
            'Exterior, interior and under-the-hood ECO scores',
            'Key vehicle-condition highlights',
        ],
    },
    {
        id: 'health-report',
        name: 'Health Report',
        price: 0,
        highlights: ['Overall vehicle health snapshot'],
        isTeaser: true,
    },
];

// "What Happens Next" panel on the inspection booking summary rail.
//
// Droom publishes no status feed for eco-orders, so once the booking is placed Peko has no
// way to report progress — the technician contacts the customer directly. This copy has to
// say so, or the customer sits watching a progress tracker that cannot move.
export const inspectionNextSteps = [
    'Your booking is sent to Droom straight after payment',
    'A certified technician calls you to confirm one of your preferred slots',
    'The inspection happens at your address, and Droom shares the report with you',
];

// ------------------------------------------------------------- select options

// Vehicle type, the first select on the valuation form. The six values Droom's catalog
// accepts, sent verbatim as the vendor's `category` parameter — do not "tidy" the
// casing or hyphens, the lookup returns nothing for anything else.
export const vehicleCategoryOptions: SelectOption[] = [
    { label: 'Car', value: 'car' },
    { label: 'Electric Car', value: 'electric-car' },
    { label: 'Motorcycle', value: 'motorcycle' },
    { label: 'Scooter', value: 'scooter' },
    { label: 'Electric Scooter', value: 'electric-scooter' },
    { label: 'Electric Bike', value: 'electric-bike' },
];

// The inspection step's radio cards — a subset of the same options, so both surfaces
// share one set of vendor values and one set of labels.
export const inspectionCategoryOptions: SelectOption[] = vehicleCategoryOptions.filter(option =>
    inspectionCategories.includes(option.value as VehicleCategory)
);

// Body style, which is a different axis from vehicle type — the inspection form and
// the manual-vehicle drawer ask for this instead.
export const bodyTypeOptions: SelectOption[] = [
    { label: 'Hatchback', value: 'Hatchback' },
    { label: 'Sedan', value: 'Sedan' },
    { label: 'SUV', value: 'SUV' },
    { label: 'MUV', value: 'MUV' },
    { label: 'Coupe', value: 'Coupe' },
    { label: 'Luxury', value: 'Luxury' },
];

// Make, model, manufacturing year and trim are no longer hardcoded here — they're a
// live cascade against Peko's Droom MYBIZ catalog proxy, see
// hooks/useVehicleCatalogOptions.ts and DROOM_MYBIZ_API_REFERENCE.md (workspace root).

export const cityOptions: SelectOption[] = [
    { label: 'Bengaluru', value: 'Bengaluru' },
    { label: 'Chennai', value: 'Chennai' },
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Hyderabad', value: 'Hyderabad' },
    { label: 'Jaipur', value: 'Jaipur' },
    { label: 'Kochi', value: 'Kochi' },
    { label: 'Kolkata', value: 'Kolkata' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Pune', value: 'Pune' },
    { label: 'Srinagar', value: 'Srinagar' },
];

export const stateOptions: SelectOption[] = [
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'West Bengal', value: 'West Bengal' },
];

// ------------------------------------------------------------- status styling

interface BadgeStyle {
    text: string;
    background: string;
    dot: string;
}

export const reportStatusStyles: Record<ReportStatus, BadgeStyle> = {
    Building: { text: '#7B4DDB', background: '#F4EEFF', dot: '#7B4DDB' },
    Ready: { text: '#0F9D58', background: '#EBF9F1', dot: '#0F9D58' },
    Booked: { text: '#7B4DDB', background: '#F4EEFF', dot: '#7B4DDB' },
    Cancelled: { text: '#98A2B3', background: '#F2F4F7', dot: '#98A2B3' },
    Failed: { text: '#FF4F4F', background: '#FFF1F2', dot: '#FF4F4F' },
};

// Label shown in the order-history Status column; "Ready" renders as "Report ready".
export const reportStatusLabels: Record<ReportStatus, string> = {
    Building: 'Building',
    Ready: 'Report ready',
    Booked: 'Booked',
    Cancelled: 'Cancelled',
    Failed: 'Failed',
};
