export type GstinStatus = 'Active' | 'Inactive' | 'Cancelled' | 'Suspended';

export interface GstinLookupFormValues {
    gstin: string;
}

export const gstinLookupInitialValues: GstinLookupFormValues = {
    gstin: '',
};

export interface GstinDetails {
    gstin: string;
    legalName: string;
    tradeName: string;
    stateName: string;
    registrationType: string;
    status: GstinStatus;
    registrationDate: string;
    registeredAddress: string;
}

export interface GstinApiResponse {
    Gstin: string;
    TradeName: string | null;
    LegalName: string;
    AddrBnm: string | null;
    AddrBno: string | null;
    AddrFlno: string | null;
    AddrSt: string | null;
    AddrLoc: string | null;
    StateCode: number;
    AddrPncd: number;
    TxpType: string;
    Status: string;
    BlkStatus: string;
    DtReg: string | null;
    DtDReg: string | null;
    StateName: string;
}

export type GstinIrnFields = {
    legalName: string;
    tradeName: string;
    address1: string;
    location: string;
    pinCode: string;
    state: string;
};

export interface GstinRecentLookup {
    gstin: string;
    legalName: string;
    status: GstinStatus;
}
