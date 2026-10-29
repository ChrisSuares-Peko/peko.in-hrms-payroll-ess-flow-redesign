import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

// Trademark Objection's own API functions — kept separate from apis/index.ts (Trademark
// Registration + shared catalog/business calls), mirroring components/objection/'s own folder.

// Raw vendor /trademark/search?search_type=info record — passed through by the backend as-is
// (see govtServicesObjectionV2.js), so this mirrors the vendor's own field names/casing exactly
// rather than a reshaped subset. Only application_no/tm_applied_for/class/application_date/
// proprietor_name/proprietor_address/tm_status are currently used by the form, but the rest
// (goods_service_details, trade_mark_type, state, filing_mode, etc.) comes along too in case a
// later step needs it without another backend change.
export interface TrademarkInfo {
    tm_applied_for: string;
    goods_service_details: string;
    agent_name: string;
    user_detail: string;
    proprietor_address: string;
    county: string;
    certificate_detail: string;
    trade_mark_type: string;
    appropriate_office: string;
    tm_category: string;
    agent_address: string;
    proprietor_name: string;
    valid_up_to_renewed_up_to: string;
    proprietor_name_live: string;
    application_no: string;
    tm_status: string;
    logo: string;
    application_date: string;
    state: string;
    class: string;
    email: string;
    filing_mode: string;
    timestamp: string;
    result_return_status: string;
}

export interface ObjectionApplicationLookupResult {
    tm_info: TrademarkInfo;
    // Other trademarks the vendor considers a conflicting match — not currently shown anywhere,
    // kept since the vendor sends it.
    identical: Partial<TrademarkInfo>[];
    status: number;
    search_term: string;
}

// Doc §5's driver field — fetches Brand/Class/Application Date/Applicant Name/Applicant Address
// by application number (read off result.tm_info). Returns null both on a genuine request failure
// and on a normal "not found" result (the backend already treats those the same way, see
// govtServicesObjectionV2.js) — callers can't currently tell those apart, matching the same
// resp.data-based convention every other GET in this domain's apis/index.ts already uses.
export const lookupObjectionApplicationApi = async (
    userId: string | number,
    userType: string,
    applicationNumber: string
): Promise<ObjectionApplicationLookupResult | null> => {
    try {
        const resp: SuccessGenericResponse<ObjectionApplicationLookupResult | null> =
            await ApiClient.get(
                `${userType}/${userId}/purchase/govt-services/v2/trademark-objection/application-lookup`,
                { params: { application_number: applicationNumber } }
            );
        return resp.data ?? null;
    } catch {
        return null;
    }
};
