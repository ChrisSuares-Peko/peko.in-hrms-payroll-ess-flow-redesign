import { AddressField } from '../types/address';

const CHECKOUT_DRAFT_KEY = 'officeSuppliesCheckoutDraft';

/** Delivery-form fields kept while the buyer is on payment review. */
export type CheckoutDraft = Pick<
    AddressField,
    | 'address'
    | 'phoneNumber'
    | 'pincode'
    | 'remarks'
    | 'contactName'
    | 'businessName'
    | 'gstin'
    | 'noGst'
>;

export const checkoutDraftFromValues = (values?: Partial<AddressField> | null): CheckoutDraft => ({
    address: values?.address ?? '',
    phoneNumber: values?.phoneNumber ?? '',
    pincode: values?.pincode ?? values?.zipCode ?? '',
    remarks: values?.remarks ?? '',
    contactName: values?.contactName ?? '',
    businessName: values?.businessName ?? '',
    gstin: values?.gstin ?? '',
    noGst: Boolean(values?.noGst),
});

export const readCheckoutDraft = (): CheckoutDraft | null => {
    try {
        const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<AddressField>;
        if (!parsed || typeof parsed !== 'object') return null;
        return checkoutDraftFromValues(parsed);
    } catch {
        return null;
    }
};

export const writeCheckoutDraft = (values: Partial<AddressField>) => {
    try {
        sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(checkoutDraftFromValues(values)));
    } catch {
        // private mode / quota
    }
};

export const clearCheckoutDraft = () => {
    try {
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch {
        // ignore
    }
};

export const checkoutDraftHasContent = (draft?: CheckoutDraft | null) =>
    Boolean(
        draft &&
            (draft.address ||
                draft.phoneNumber ||
                draft.pincode ||
                draft.contactName ||
                draft.businessName ||
                draft.gstin ||
                draft.remarks)
    );
