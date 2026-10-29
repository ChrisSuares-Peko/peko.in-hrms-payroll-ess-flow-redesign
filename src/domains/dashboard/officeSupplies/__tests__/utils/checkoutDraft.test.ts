import { describe, expect, it, beforeEach } from 'vitest';

import {
    checkoutDraftFromValues,
    checkoutDraftHasContent,
    clearCheckoutDraft,
    readCheckoutDraft,
    writeCheckoutDraft,
} from '../../utils/checkoutDraft';

describe('checkoutDraft', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('round-trips the delivery form fields', () => {
        writeCheckoutDraft({
            address: '12 MG Road',
            phoneNumber: '9876543210',
            pincode: '560001',
            contactName: 'Asha Rao',
            businessName: 'Acme',
            gstin: '29AABCU9603R1ZM',
            noGst: false,
            remarks: 'Leave at lobby',
        });
        expect(readCheckoutDraft()).toEqual({
            address: '12 MG Road',
            phoneNumber: '9876543210',
            pincode: '560001',
            remarks: 'Leave at lobby',
            contactName: 'Asha Rao',
            businessName: 'Acme',
            gstin: '29AABCU9603R1ZM',
            noGst: false,
        });
    });

    it('maps zipCode onto pincode when restoring a saved address payload', () => {
        expect(checkoutDraftFromValues({ zipCode: '560001', address: '12 MG Road' }).pincode).toBe(
            '560001'
        );
    });

    it('clears the stored draft', () => {
        writeCheckoutDraft({ address: '12 MG Road' });
        clearCheckoutDraft();
        expect(readCheckoutDraft()).toBeNull();
    });

    it('treats an empty draft as having no content', () => {
        expect(checkoutDraftHasContent(checkoutDraftFromValues({}))).toBe(false);
        expect(checkoutDraftHasContent(checkoutDraftFromValues({ address: '12 MG Road' }))).toBe(
            true
        );
    });
});
