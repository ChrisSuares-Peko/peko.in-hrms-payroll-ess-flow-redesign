import { describe, it, expect } from 'vitest';

import { createPaymentLinkSchema } from '../../schema/paymentLinkSchema';

const validate = (data: Record<string, unknown>) =>
    createPaymentLinkSchema.validate(data, { abortEarly: false });

const BASE = { amount: 500, customerPhone: '9876543210' };

describe('createPaymentLinkSchema', () => {
    it('accepts a valid amount + phone with optional fields omitted', async () => {
        await expect(validate(BASE)).resolves.toMatchObject(BASE);
    });

    it('enforces the amount bounds (5 – 100000)', async () => {
        await expect(validate({ ...BASE, amount: 4 })).rejects.toThrow(
            'Amount must be greater than or equal to 5'
        );
        await expect(validate({ ...BASE, amount: 100001 })).rejects.toThrow(
            'Amount must be less than 100000'
        );
        await expect(validate({ customerPhone: '9876543210' })).rejects.toThrow(
            'Please enter the amount'
        );
    });

    it('requires a 10-digit mobile starting 6-9', async () => {
        await expect(validate({ ...BASE, customerPhone: '1234567890' })).rejects.toThrow(
            'Enter a valid 10-digit mobile number starting with 6-9'
        );
        await expect(validate({ ...BASE, customerPhone: '0000000000' })).rejects.toThrow(
            'Enter a valid 10-digit mobile number starting with 6-9'
        );
        await expect(validate({ amount: 500 })).rejects.toThrow('Please enter customer phone');
    });

    it('rejects customer names with leading/trailing or consecutive whitespace', async () => {
        await expect(validate({ ...BASE, customerName: ' Acme' })).rejects.toThrow(
            'cannot start or end with whitespace'
        );
        await expect(validate({ ...BASE, customerName: 'Ac  me' })).rejects.toThrow(
            'cannot contain consecutive whitespaces'
        );
        await expect(validate({ ...BASE, customerName: 'Acme Corp' })).resolves.toBeDefined();
    });

    it('validates optional email and purpose message', async () => {
        await expect(validate({ ...BASE, customerEmail: 'not-an-email' })).rejects.toThrow(
            'Enter a valid email address'
        );
        await expect(validate({ ...BASE, purposeMessage: 'abc' })).rejects.toThrow(
            'Payment purpose must be at least 6 characters'
        );
        await expect(
            validate({ ...BASE, customerEmail: 'a@b.com', purposeMessage: 'invoice payment' })
        ).resolves.toBeDefined();
    });
});
