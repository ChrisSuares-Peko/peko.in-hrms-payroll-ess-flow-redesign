export interface SavedTraveller {
    id: number;
    type: string;
    title?: string;
    firstName: string;
    lastName: string;
    gender?: string; // 'MALE' | 'FEMALE'
    paxType?: number;
    dateOfBirth?: string;
    passportNo?: string;
    passportExpiry?: string;
    passportIssueDate?: string;
    passportIssueCountryCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    cellCountryCode?: string;
    contactNo?: string;
    email?: string;
    nationality?: string;
    countryCode?: string;
    countryName?: string;
    pan?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type SavedTravellerPayload = Partial<
    Omit<SavedTraveller, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'type'>
> & {
    firstName: string;
    lastName: string;
};

// Canonical dropdown option shape shared by employee options and saved-traveller options,
// so a single autofill adapter can consume either source uniformly.
export interface TravellerOption {
    value: string;
    label: string;
    source?: 'employee' | 'saved';
    savedId?: number;
    fullName: string;
    dateOfBirth?: string;
    gender?: string; // 'MALE' | 'FEMALE'
    mobileNo?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    nationality?: string;
    passportNo?: string;
    passportIssuedCountry?: string;
    passportExpiryDate?: string;
    // saved-traveller-only extras (undefined for employee options)
    title?: string;
    passportIssueDate?: string;
    cellCountryCode?: string;
    pan?: string;
}
