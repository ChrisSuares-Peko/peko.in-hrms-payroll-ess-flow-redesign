export type InputComponentsType = TextInputComponent;

interface TextInputComponent {
    type: 'input';
    name: string;
    label: string;
    placeholder: string;
    options?: null;
    showMinAndMax?: boolean;
    multipleOf?: number;
    min: number;
    max: number;
    supportAlphabets?: boolean;
    required?: boolean;
}
export type filterState = {
    type?: string;
    title?: string;
    searchText: string;
    category: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
    sortField: string;
};
export type VerificationPrices = {
    bank_account_verify: string;
    aadhar_ocr_verify: string;
    gstin_pan: string;
    gstin_verify: string;
    aadhar_verify: string;
    pan_verify: string;
    advance_pan_verify: string;
    dl_verify: string;
    voter_id_verify: string;
    passport_verify: string;
    cin_verify: string;
    ifsc_verify: string;
};
export type BankAccountPayload = {
    values: bankPayload;
    userId: number;
    userType: string;
};
export type bankPayload = {
    bank_account: string;
    ifsc: string;
    name: string;
};
export type IfscPayload = {
    values: ifsc;
    userId: number;
    userType: string;
};
export type ifsc = {
    ifsc: string;
};
export type PanName = {
    pan: string;
    name: string;
    date_of_birth?: string;
};

export type PanPayload = {
    values: PanName;
    userId: number;
    userType: string;
};
export type DlDetails = {
    dl_number: string;
    dob: string; // or `Date` if you're working with actual date objects
};

export type DlPayload = {
    values: DlDetails;
    userId: number;
    userType: string;
};
export type EpicDetails = {
    epic_number: string;
    name: string;
};

export type EpicPayload = {
    values: EpicDetails;
    userId: number;
    userType: string;
};
export type PassportDetails = {
    name: string;
    file_number: string;
    dob: string; // or `Date` if you're handling actual date objects
};

export type PassportPayload = {
    values: PassportDetails;
    userId: number;
    userType: string;
};
export type CinDetails = {
    cin: string;
};

export type CinPayload = {
    values: CinDetails;
    userId: number;
    userType: string;
};
export type GstinDetails = {
    GSTIN: string;
};

export type GstinPayload = {
    values: GstinDetails;
    userId: number;
    userType: string;
};
export type GstinBusinessDetails = {
    GSTIN: string;
    action: string;
};

export type GstinBusinessPayload = {
    values: GstinBusinessDetails;
    userId: number;
    userType: string;
};
export type GstinReturnDetails = {
    GSTIN: string;
    fy: string;
    action: string;
};

export type GstinReturnPayload = {
    values: GstinReturnDetails;
    userId: number;
    userType: string;
};
export type SimplePanDetails = {
    pan_no: string;
    state_code: string;
};

export type SimplePanPayload = {
    values: SimplePanDetails;
    userId: number;
    userType: string;
};
export type AadhaarLinkDetails = {
    name?: string;
    email?: string;
    mobile?: string;
};

export type AadhaarLinkPayload = {
    values: AadhaarLinkDetails;
    userId: number;
    userType: string;
};

export type AadhaarDetailsPayload = {
    reference_number: string;
    transaction_id: string;
    userId: number;
    userType: string;
};

export type priceResponse = {
    status: boolean;
    data: VerificationPrices;
};
export type IdentityVerificationItem = {
    title: string;
    desc: string;
    logo: string; // or a specific type if you're importing images in a certain way
    accessKey: string;
    serviceName: string;
    inputComponents: any[];
    serviceValue: string;
};

export type IdentityVerification = IdentityVerificationItem[];
