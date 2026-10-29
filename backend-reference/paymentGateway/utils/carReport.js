/**
 * Pure helpers for the Car Reports (Droom MYBIZ) purchase flow.
 *
 * Deliberately dependency-free — no models, no axios, no logger — so the pricing and
 * normalisation rules unit-test without a database mock.
 *
 * ⚠ This file is a verbatim copy of `officeAndBusiness/utils/carReport.js`, which is the
 * source of truth now that officeAndBusiness owns Car Reports. The two services are
 * deployed separately and cannot import across the boundary (the repo already duplicates
 * droomClient.js the same way). Pricing lives here, so the copies drifting would mean
 * the card and wallet legs charging different amounts — change both together.
 *
 * Only the purchase-side helpers are used here; this service records the order and nothing
 * else. normaliseHistoryResult and the Droom dispatch are officeAndBusiness's alone — the
 * rest is carried along purely to keep the copy verbatim.
 */

// Peko's three report products, all three wired against DROOM_MYBIZ_API_REFERENCE.md.
// Each resolves at a different point in the purchase:
//   valuation — an async vendor PDF (Droom's v2 PaaS report). The order is recorded
//               BUILDING, the report is ordered from Droom right after payment, and the
//               webhook / read-time status poll flips it READY once the PDF exists.
//   history (§4)   — nothing is fetched before payment (the RC lookup IS the report, so
//               running it on the form would give it away for free). The order is
//               recorded BUILDING and materialised on first read.
//   inspection (§5) — not a report at all but a doorstep booking. A technician has to be
//               dispatched whether or not the order is ever reopened, so the vendor call
//               happens at payment time, with a read-time retry as a safety net.
const REPORT_TYPES = ['valuation', 'history', 'inspection'];
const PURCHASABLE_REPORT_TYPES = ['valuation', 'history', 'inspection'];

// BE is the source of truth for price — the frontend sends the selection only.
// Must stay in step with Peko-IN-Frontend's vehicleReports/utils/reportMeta.ts, which
// shows these numbers on the product cards and the payment summary.
const REPORT_PRICES = {
    valuation: 199,
    history: 129,
};

// Inspection is priced per package, not per report type. Keyed by package id — never by
// display name, so a copy edit on the frontend can never change what we charge.
// Mirrors inspectionPackages in Peko-IN-Frontend's vehicleReports/utils/data.ts.
//
// `health-report` is deliberately absent: it is a ₹0 teaser card with a "Know more"
// button, not a product. An absent id prices to null, which the controller turns into a
// 400 — so it cannot be bought by posting its id directly either.
//
// TEMPORARY: these move to the admin panel, at which point this map becomes a lookup.
// Self Inspection ('basic') is the only inspection product Droom offers us — further
// packages arrive via the admin-managed carReportPlans table, never here.
const INSPECTION_PACKAGE_PRICES = {
    basic: 599,
};

// Droom's product_code per package — required by the eco-order booking. An unmapped
// package cannot be dispatched and refunds.
const INSPECTION_PRODUCT_CODES = {
    basic: 'self_inspection_tkm_insurance_ai',
};

const resolveInspectionProductCode = (packageId) => INSPECTION_PRODUCT_CODES[packageId] || null;

// What the purchase endpoint must have before it takes money. Per report type, because
// the two products share almost no input: valuation needs a full vehicle spec, history
// needs only a plate.
const REQUIRED_FIELDS_BY_REPORT_TYPE = {
    // Everything Droom's PaaS report endpoint needs to generate the PDF. Recording an
    // order without them would leave a report the vendor can never produce.
    valuation: [
        'make',
        'model',
        'manufacturingYear',
        'variant',
        'kilometresDriven',
        'city',
        'vehicleCategory',
    ],
    // The only input the RC lookup takes. `reg_num` is what the shared payment screen
    // sends for a fleet vehicle; `registrationNumber` is what the history form collects
    // for a manually entered one.
    history: [['reg_num', 'registrationNumber']],
    // Everything Droom §5 needs to dispatch a technician. Missing any of it would book a
    // visit that cannot happen. `slot2` is genuinely optional (the form offers a second
    // preferred slot); `packageId` is what we price from, so it is required.
    inspection: [
        ['reg_num', 'registrationNumber'],
        'packageId',
        'make',
        'model',
        'manufacturingYear',
        'variant',
        'bodyType',
        'contactName',
        'mobileNumber',
        'fullAddress',
        'pincode',
        'city',
        'state',
        'slot1Date',
        'slot1Time',
    ],
};

// Internal upper-snake codes in the DB, display labels at read time — the convention
// ORDER_STATUS_LABELS uses in controllers/corporate/challan.js.
const REPORT_STATUS_LABELS = {
    BUILDING: 'Building',
    READY: 'Ready',
    BOOKED: 'Booked',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
};

// Used by both valuation and history — inspection is the only product with a different
// lifecycle, so it gets its own labels rather than these being valuation-specific.
const DEFAULT_STEP_LABELS = ['Order Placed', 'Building Report', 'Report Ready'];
const INSPECTION_STEP_LABELS = [
    'Booked',
    'Technician Assigned',
    'Inspection Completed',
    'Quality Check',
    'Report Ready',
];

const isPurchasable = (reportType) => PURCHASABLE_REPORT_TYPES.includes(reportType);

// Returns null for anything not currently on sale, which the controller turns into a 400.
//
// Inspection reads its price from `body.packageId` rather than the report type, so callers
// must pass the request body. An unknown, absent or teaser package prices to null and is
// therefore unbuyable — the same gate as an unsellable report type.
const resolveReportPrice = (reportType, body = {}) => {
    if (!isPurchasable(reportType)) return null;
    if (reportType === 'inspection') return INSPECTION_PACKAGE_PRICES[body.packageId] || null;
    return REPORT_PRICES[reportType] || null;
};

// Names of the required fields `body` is missing for this report type. An entry that is
// itself an array means "any one of these" and reports the first name if none are present,
// so the 400 message names the field the caller was most likely trying to send.
const missingRequiredFields = (reportType, body = {}) =>
    (REQUIRED_FIELDS_BY_REPORT_TYPE[reportType] || [])
        .map((field) => {
            if (!Array.isArray(field)) return body[field] ? null : field;
            return field.some((alias) => body[alias]) ? null : field[0];
        })
        .filter(Boolean);

// Number(null), Number('') and Number(false) are all 0, so an absent value must be
// rejected BEFORE the numeric check — otherwise a kilometres field the form never filled
// is persisted as a confident 0 km.
const toAmount = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
};

// "Kia Seltos HTX" — preferring the selected fleet vehicle, falling back to the flat form
// values a manually entered vehicle supplies. Mirrors the frontend's toValuationResult.
const buildVehicleModel = (vehicle = {}, formValues = {}) =>
    [
        vehicle.make || formValues.make,
        vehicle.model || formValues.model,
        vehicle.variant || formValues.variant,
    ]
        .filter(Boolean)
        .join(' ');

// The header line of the Fair Market Value card. `kilometres` is pre-formatted here
// because ValuationResultCard renders it verbatim.
const buildValuationSpec = (formValues = {}) => {
    const kms = toAmount(formValues.kilometresDriven);
    return {
        modelName: buildVehicleModel({}, formValues),
        year: formValues.manufacturingYear || '',
        kilometres: kms === null ? '' : `${kms.toLocaleString('en-IN')} km`,
        city: formValues.city || '',
    };
};

// ---------------------------------------------------------------- history (§4)

// Droom's RC payload uses "NA" where it means null, so an absent value reaches the card
// as the literal string "NA" unless it is filtered here.
const NOT_AVAILABLE = 'Not available';
const cleanText = (value) => {
    const text = String(value ?? '').trim();
    if (!text || text.toUpperCase() === 'NA' || text.toUpperCase() === 'NULL') return '';
    return text;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Droom returns dates as `D-Month-YYYY`, and does NOT zero-pad the day — the same payload
// carries "27-March-2027" and "6-June-2026". Reformats to "06 Jun 2026" to match the
// dayjs('DD MMM YYYY') formatting the order-detail page uses everywhere else. Anything
// that doesn't parse is passed through unchanged rather than dropped: a date we can't read
// is still better shown than hidden.
const formatDroomDate = (value) => {
    const text = cleanText(value);
    if (!text) return '';
    const match = /^(\d{1,2})-([A-Za-z]+)-(\d{4})$/.exec(text);
    if (!match) return text;
    const monthIndex = MONTHS.indexOf(match[2].slice(0, 3).toLowerCase());
    if (monthIndex === -1) return text;
    const day = match[1].padStart(2, '0');
    const month = MONTHS[monthIndex].replace(/^./, (c) => c.toUpperCase());
    return `${day} ${month} ${match[3]}`;
};

// Shapes Droom's RC payload into the frontend's HistoryResult — every field a display
// string. Returns null when no registration number came back (unresolvable plate; the
// vendor documents no error contract). `challans` is merged in by the controller from
// the separate challan endpoint.
const normaliseHistoryResult = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    if (!cleanText(raw.registration_number)) return null;

    const ownerName = cleanText(raw.owners_name);
    const ownerSerial = cleanText(raw.owner_serial_number);
    const insurer = cleanText(raw.insurance_company);
    const insuredTo = formatDroomDate(raw.insurance_upto);
    const registeredOn = formatDroomDate(raw.registration_date);
    const rto = cleanText(raw.rto);
    const pucTo = formatDroomDate(raw.pucc_upto);
    const blacklistReason = cleanText(raw.blacklisted_reason);
    const hypothecated = cleanText(raw.hypothecation_type);

    return {
        // `vehicleManufacturerName` is camelCase while every sibling key is snake_case —
        // that inconsistency is Droom's, not a typo here.
        modelName:
            [cleanText(raw.vehicleManufacturerName), cleanText(raw.vehicle_model)]
                .filter(Boolean)
                .join(' ') || cleanText(raw.registration_number),
        // "KHUSHBU KUMARI (Owner 1)" — the serial is what tells a buyer how many hands
        // the car has been through, so it belongs next to the name rather than hidden.
        ownership:
            [ownerName, ownerSerial && `(Owner ${ownerSerial})`].filter(Boolean).join(' ') ||
            NOT_AVAILABLE,
        registration:
            [registeredOn, rto].filter(Boolean).join(' · ') || NOT_AVAILABLE,
        insurance:
            [insurer, insuredTo && `valid to ${insuredTo}`].filter(Boolean).join(' · ') ||
            NOT_AVAILABLE,
        puc: pucTo ? `Valid to ${pucTo}` : NOT_AVAILABLE,
        // A real boolean in the payload, unlike hypothecation_type. Only surface the
        // reason when there is one — "Blacklisted — NA" would read as a system error.
        blacklist: raw.blacklisted
            ? ['Blacklisted', blacklistReason].filter(Boolean).join(' — ')
            : 'Not blacklisted',
        // Named `_type` but actually a Yes/No flag.
        hypothecation: hypothecated
            ? `${/^y/i.test(hypothecated) ? 'Yes' : 'No'} — ${
                  /^y/i.test(hypothecated) ? 'loan on record' : 'no loan on record'
              }`
            : NOT_AVAILABLE,
        bodyType: cleanText(raw.body_type),
        fuelType: cleanText(raw.fuel_type),
        registrationNumber: cleanText(raw.registration_number),
    };
};

// ---------------------------------------------------------------- valuation PDF (PaaS)

// Maps the valuation form to the PaaS create request. `owners` mirrors the vendor
// sample (a name); the form collects none, so the authenticated user's stands in.
const buildPaasReportRequest = (formValues = {}, ownerName = '') => ({
    make: formValues.make,
    model: formValues.model,
    year: formValues.manufacturingYear,
    trim: formValues.variant,
    // Vendor samples use lowercase city/category.
    city: cleanText(formValues.city).toLowerCase(),
    owners: cleanText(ownerName) || 'NA',
    kmsDriven: formValues.kilometresDriven,
    category: cleanText(formValues.vehicleCategory).toLowerCase() || 'car',
});

// Strips the stray quote seen glued onto report_url in vendor samples; only https
// survives into the column (it is rendered as a download link).
const cleanReportUrl = (value) => {
    const text = cleanText(value).replace(/(?:%22|")+$/g, '');
    if (!text) return '';
    return /^https:\/\//i.test(text) ? text : '';
};

// Normalises a PaaS create/status response. Returns null when no order id came back —
// the only reliable failure signal the vendor gives.
const extractPaasReport = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.code && String(raw.code).toLowerCase() !== 'success') return null;
    const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
    // Number on create, string on status — normalise.
    const orderId = cleanText(data.order_id);
    if (!orderId) return null;
    return {
        orderId,
        status: cleanText(data.status).toLowerCase(),
        reportUrl: cleanReportUrl(data.report_url),
        reportPath: cleanText(data.report_path),
    };
};

// One display line for the challan lookup. "Data not found" = clean record, not an
// error; '' = lookup failed, and the card renders the row on presence.
const summariseChallans = (raw) => {
    if (!raw || typeof raw !== 'object') return '';
    const code = String(raw.code || '').toLowerCase();
    if (code !== 'success') {
        return /not found/i.test(String(raw.message || '')) ? 'No challan records' : '';
    }
    const challans = Array.isArray(raw.data) ? raw.data : [];
    if (!challans.length) return 'No challan records';
    const pending = challans.filter((c) => /pending/i.test(String(c?.challan_status || ''))).length;
    const total = `${challans.length} challan record${challans.length === 1 ? '' : 's'}`;
    return pending ? `${total} (${pending} pending)` : total;
};

// Four condition grades, best to worst. Keys = Droom's casing, values = Peko's
// (PriceBandCards' tint map keys off these).
const PRICE_GRADES = [
    ['Excellent', 'Excellent'],
    ['Very Good', 'Very good'],
    ['Good', 'Good'],
    ['Fair', 'Fair'],
];

// Maps the valuation form to the OBV price-range request. A sell-side valuation has no
// counterparty on the form; the form doesn't ask owner count, so `1` is the default.
const buildUsedPriceRequest = (formValues = {}) => ({
    make: formValues.make,
    model: formValues.model,
    year: formValues.manufacturingYear,
    trim: formValues.variant,
    kmsDriven: formValues.kilometresDriven,
    city: cleanText(formValues.city).toLowerCase(),
    customerType: formValues.counterparty === 'dealer' ? 'dealer' : 'individual',
    transactionType: formValues.purpose === 'buy' ? 'B' : 'S',
    noOfOwners: '1',
});

// { Excellent: { range_from, range_to }, ... } → ordered band list. A band with a
// missing/non-numeric bound is dropped rather than rendered as ₹0.
const normalisePriceBands = (raw) => {
    if (!raw || typeof raw !== 'object') return [];
    if (raw.code && String(raw.code).toLowerCase() !== 'success') return [];
    const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
    return PRICE_GRADES.map(([vendorKey, grade]) => {
        const band = data[vendorKey];
        const min = toAmount(band?.range_from);
        const max = toAmount(band?.range_to);
        if (min === null || max === null) return null;
        return { grade, min, max };
    }).filter(Boolean);
};

// ---------------------------------------------------------------- inspection (§5)

// Droom wants one combined `YYYY-MM-DD HH:mm:ss` datetime per slot, but the form stores
// the halves separately: DatePickerInput writes an ISO `2026-08-05`, TimePickerInput writes
// a 12-hour `02:00 PM`. Joining them is ours to do.
//
// Returns '' when either half is missing, so an unpicked slot 2 is dropped by buildForm
// rather than sent as a malformed half-string.
const joinDroomSlot = (dateStr, timeStr) => {
    const date = cleanText(dateStr);
    const time = cleanText(timeStr);
    if (!date || !time) return '';

    const match = /^(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?$/.exec(time);
    // Already 24-hour (or something we don't recognise) — pass it through rather than
    // dropping a slot the customer did pick.
    if (!match) return `${date} ${time}`;

    let hour = Number(match[1]) % 12;
    // The two cases every 12-hour converter gets wrong: 12 AM is hour 0, 12 PM is hour 12.
    if (/^[Pp]$/.test(match[3])) hour += 12;

    return `${date} ${String(hour).padStart(2, '0')}:${match[2]}:00`;
};

// Shapes the booking form into the frontend's InspectionBookingResult
// (vehicleReports/types). Pure input, captured at purchase — there is nothing to fetch,
// since Droom returns no booking body.
//
// `slot2` is omitted entirely rather than set empty: the card renders rows on presence, so
// an empty string would show a blank "Slot 2".
const buildInspectionBooking = (formValues = {}) => {
    const booking = {
        slot1: joinDroomSlot(formValues.slot1Date, formValues.slot1Time),
        address: [
            cleanText(formValues.fullAddress),
            cleanText(formValues.city),
            cleanText(formValues.state),
        ]
            .filter(Boolean)
            .join(', '),
    };
    const pincode = cleanText(formValues.pincode);
    if (pincode) booking.address = `${booking.address} — ${pincode}`;

    const slot2 = joinDroomSlot(formValues.slot2Date, formValues.slot2Time);
    if (slot2) booking.slot2 = slot2;

    return booking;
};

// ----------------------------------------------------------------

// Both report products genuinely are BUILDING at purchase: a valuation's PDF is
// generated asynchronously by Droom after we order it, and a history's RC lookup only
// runs when the order is first opened (see controllers/corporate/carReportHistory.js).
// Only inspection starts elsewhere — it is a booking, not a report.
const initialReportStatus = (reportType) => {
    if (reportType === 'inspection') return 'BOOKED';
    return 'BUILDING';
};

// Derived from (reportType, status) rather than stored, so the frontend's progress
// tracker can never drift out of sync with what the DB actually says.
const buildProgressSteps = (reportType, status) => {
    const labels = reportType === 'inspection' ? INSPECTION_STEP_LABELS : DEFAULT_STEP_LABELS;

    // A dead order shows only that it was placed — no phantom "in progress" step.
    if (status === 'CANCELLED' || status === 'FAILED') {
        return labels.map((label, index) => ({
            label,
            state: index === 0 ? 'done' : 'pending',
        }));
    }

    const activeIndex = {
        READY: labels.length,
        BOOKED: 1,
        BUILDING: 1,
    }[status];
    const reached = activeIndex === undefined ? 1 : activeIndex;

    return labels.map((label, index) => {
        if (index < reached) return { label, state: 'done' };
        if (index === reached) return { label, state: 'active' };
        return { label, state: 'pending' };
    });
};

module.exports = {
    REPORT_TYPES,
    PURCHASABLE_REPORT_TYPES,
    REPORT_STATUS_LABELS,
    REQUIRED_FIELDS_BY_REPORT_TYPE,
    INSPECTION_PACKAGE_PRICES,
    INSPECTION_PRODUCT_CODES,
    resolveInspectionProductCode,
    isPurchasable,
    resolveReportPrice,
    missingRequiredFields,
    toAmount,
    buildVehicleModel,
    buildValuationSpec,
    buildPaasReportRequest,
    cleanReportUrl,
    extractPaasReport,
    summariseChallans,
    buildUsedPriceRequest,
    normalisePriceBands,
    formatDroomDate,
    normaliseHistoryResult,
    joinDroomSlot,
    buildInspectionBooking,
    initialReportStatus,
    buildProgressSteps,
};
