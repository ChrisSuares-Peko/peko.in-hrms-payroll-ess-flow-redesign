export interface Address {
    id: number;
    name: string;
    nickname: string;
    department: string | null;
    city: string | null;
    state?: string | null;
    country: string | null;
    addressLine1: string;
    addressLine2: string;
    phoneNumber: string;
    email: string | null;
    countryCode: string | null;
    zipCode: string | null;
    isReceiver: number; // Assuming this is a boolean (0 for false, 1 for true)
    default: number; // Assuming this is a boolean (0 for false, 1 for true)
    credentialId: number;
}

export interface AddressField {
    address: string;
    phoneNumber: string;
    /**
     * Legacy billing contact name parts. The checkout form now collects a
     * single `contactName` input; DeliveryDetails' onSubmit sets
     * firstName = contactName and lastName = '' so useForm's ONDC /init
     * billing-name build, and the admin portal's order.address.firstName
     * display, keep working unchanged.
     */
    firstName?: string;
    lastName?: string;
    /** single "Contact name" input shown on the checkout form (Figma) */
    contactName?: string;
    /** delivery pincode entered in the cart form — ONDC select's area_code */
    pincode?: string;
    remarks?: string;
    email?: string;
    /** pincode of the selected saved address (prefills the form's pincode) */
    zipCode?: string;
    /** frontend-only for now — no dedicated backend field, rides along in
     *  the generic address payload like remarks/zipCode already do */
    businessName?: string;
    gstin?: string;
    noGst?: boolean;
    /** "Save this address for next time" checkbox — only offered when the
     *  customer typed a fresh address rather than picking a saved one. */
    saveAddress?: boolean;
}

export type AddressOptions = {
    label: string;
    value: string;
};

export type SavedAddressPayload = {
    userId: number;
    userType: string;
};

export type SavedAddressResponse = {
    addressDetails: Address[];
};
