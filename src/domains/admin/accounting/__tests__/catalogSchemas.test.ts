import { describe, expect, it } from 'vitest';

import { partnerShareSchema } from '../components/partners/PartnerShareDrawer';
import { subscriptionPricingSchema } from '../components/subscriptions/SubscriptionPricingDrawer';

describe('partnerShareSchema', () => {
    it('accepts a percentage between 0 and 100', async () => {
        await expect(
            partnerShareSchema.validate({ sharePercentage: '12.5' })
        ).resolves.toBeTruthy();
        await expect(partnerShareSchema.validate({ sharePercentage: '0' })).resolves.toBeTruthy();
    });

    it('rejects negative, above 100 and non-numeric values', async () => {
        await expect(partnerShareSchema.validate({ sharePercentage: '-1' })).rejects.toThrow(
            'Cannot be negative'
        );
        await expect(partnerShareSchema.validate({ sharePercentage: '101' })).rejects.toThrow(
            'Cannot exceed 100'
        );
        await expect(partnerShareSchema.validate({ sharePercentage: 'abc' })).rejects.toThrow(
            'Enter a valid percentage'
        );
    });

    it('lets the gateway charge terms be blank, and bounds them when given', async () => {
        const withTerms = (gatewayChargePercentage: string, gatewayChargeFixed: string) =>
            partnerShareSchema.validate({
                sharePercentage: '10',
                gatewayChargePercentage,
                gatewayChargeFixed,
            });

        await expect(withTerms('', '')).resolves.toBeTruthy();
        await expect(withTerms('1.95', '3')).resolves.toBeTruthy();
        await expect(withTerms('101', '3')).rejects.toThrow('Cannot exceed 100');
        await expect(withTerms('2', '-1')).rejects.toThrow('Cannot be negative');
        await expect(withTerms('abc', '3')).rejects.toThrow('Enter a valid percentage');
    });
});

describe('subscriptionPricingSchema', () => {
    const valid = {
        packagePrices: { monthly: '499', annually: '4999' },
        discount: { monthly: '50', annually: '500' },
    };

    it('accepts discounts at or below the prices', async () => {
        await expect(subscriptionPricingSchema.validate(valid)).resolves.toBeTruthy();
        await expect(
            subscriptionPricingSchema.validate({
                ...valid,
                discount: { monthly: '499', annually: '4999' },
            })
        ).resolves.toBeTruthy();
    });

    it('rejects a discount above the matching price on the discount path', async () => {
        await expect(
            subscriptionPricingSchema.validate({
                ...valid,
                discount: { monthly: '600', annually: '500' },
            })
        ).rejects.toMatchObject({ path: 'discount.monthly' });
        await expect(
            subscriptionPricingSchema.validate({
                ...valid,
                discount: { monthly: '50', annually: '6000' },
            })
        ).rejects.toMatchObject({ path: 'discount.annually' });
    });

    it('requires every amount', async () => {
        await expect(
            subscriptionPricingSchema.validate({
                ...valid,
                packagePrices: { monthly: '', annually: '4999' },
            })
        ).rejects.toThrow();
    });
});
