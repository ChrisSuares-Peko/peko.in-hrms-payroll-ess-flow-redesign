// Traffic Challan (Droom / Vahaan) types.
// Field names mirror the Droom "Fetch Challan" response so the BE swap is a 1:1 mapping.
// NOTE: the API doc is inconsistent about the id field (`challan_number` vs `challan_id`).
// We standardise on `challan_number` here; if Postman testing shows `challan_id`,
// change it in this one place + the mock + the api mapper.

export type ChallanStatus = 'Pending' | 'Paid' | 'Disposed';

export type ChallanFilter = 'All' | 'Pending' | 'Paid' | 'Court';

export interface Challan {
    challan_number: string;
    registration_number: string;
    offense_details: string;
    challan_place: string;
    state: string;
    amount: number;
    challan_date: string;
    challan_status: ChallanStatus;
    accused_name?: string;
    // Droom sends a plain "Yes"/"No" flag here, never a reference number — it only says whether
    // the challan was escalated to court. Not shown in the UI for that reason (ticket 31051).
    court_challan?: string;
    court_name?: string;
    // Court's address. Droom sends null when it has none on record, even for a court matter.
    court_address?: string | null;
    rto?: string;
    challan_count?: number;
    // Pricing breakdown (used in the cart / review step + Push Order `items`).
    challan_price?: number;
    convenience_fee?: number;
    discount?: number;
    selling_price?: number;
}

// Saved vehicle (beneficiary) for the Bill Payments entry screen.
export interface ChallanBeneficiary {
    id: string;
    nickname: string;
    vehicleNumber: string;
}

export interface ChallanSummary {
    totalOutstanding: number;
    pending: number;
    paid: number;
    courtMatters: number;
}

export interface FleetChallansResponse {
    challans: Challan[];
    summary: ChallanSummary;
    // Cache metadata: `stale` = some vehicles need a refresh; `lastUpdated` = oldest cache time.
    stale?: boolean;
    lastUpdated?: string | null;
}

// A row decorated for the antd Table (adds the `key` antd needs + selectability flag).
export interface ChallanRow extends Challan {
    key: string;
    isPayable: boolean;
}

// --- Order History (Droom order-list / order-detail) ---
export type ChallanOrderStatus =
    | 'Assigned'
    | 'Processing'
    | 'Challan Partially Resolved'
    | 'Challan Completely Resolved'
    | 'Partially Refunded'
    | 'Completely Refunded'
    | 'Failed';

export interface ChallanOrder {
    orderId: string;
    orderDate: string;
    amount: number;
    status: ChallanOrderStatus;
    // Populated from the order-detail call (or if the list embeds line items).
    challans?: Challan[];
}

// Court matter unless the flag reads 'NA'/'No'/'' — Droom sends "Yes"/"No", not a reference.
const NON_COURT_VALUES = new Set(['', 'na', 'no', 'n/a', '-']);
export const isCourtMatter = (c: Challan): boolean =>
    !!c.court_challan && !NON_COURT_VALUES.has(c.court_challan.trim().toLowerCase());

// Any pending challan can be paid — including court matters (Droom confirmed these are
// payable; the drawer still flags them as "may take longer to process").
export const isChallanPayable = (c: Challan): boolean => c.challan_status === 'Pending';
