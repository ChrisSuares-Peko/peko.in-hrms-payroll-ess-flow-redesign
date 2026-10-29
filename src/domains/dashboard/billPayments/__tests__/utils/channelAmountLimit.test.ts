import { describe, expect, it, vi } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import {
    BillerWithChannels,
    resolveChannelAmountBound,
    tightenWithChannelBound,
} from '../../utils/channelAmountLimit';

vi.mock('@src/config-global', () => ({ ENV: 'production' }));

const biller = (paymentChannelInfo: any): BillerWithChannels => ({
    billerPaymentChannels: { paymentChannelInfo },
});

const intEntry = (minAmount?: string, maxAmount?: string) => ({
    paymentChannelName: 'INT',
    minAmount,
    maxAmount,
});

const CHANNELS = ['ATM', 'AGT', 'BNKBRNCH', 'BSC', 'INT', 'INTB', 'KIOSK', 'MPOS', 'MOB', 'MOBB', 'POS'];
const indusIndFastag: BillerWithChannels = biller(
    CHANNELS.map(paymentChannelName => ({
        maxAmount: '10000000',
        minAmount: '10000',
        paymentChannelName,
    }))
);

const UTILITY = 'bbps_utility_electricity';

describe('resolveChannelAmountBound', () => {
    it('reads the INT bound off a real biller payload as rupees', () => {
        expect(resolveChannelAmountBound(accessKeys.fastag, indusIndFastag)).toEqual({
            minAmount: 100,
            maxAmount: 100000,
        });
    });

    it('normalises a single paymentChannelInfo object', () => {
        expect(resolveChannelAmountBound(UTILITY, biller(intEntry('10000', '10000000')))).toEqual({
            minAmount: 100,
            maxAmount: 100000,
        });
    });

    it('picks INT rather than the first entry in the array', () => {
        const b = biller([
            { paymentChannelName: 'ATM', minAmount: '1', maxAmount: '2' },
            intEntry('10000', '10000000'),
        ]);
        expect(resolveChannelAmountBound(UTILITY, b)).toEqual({ minAmount: 100, maxAmount: 100000 });
    });

    it('picks AGT for the telecom access key', () => {
        const b = biller([
            intEntry('10000', '10000000'),
            { paymentChannelName: 'AGT', minAmount: '100000', maxAmount: '200000' },
        ]);
        expect(resolveChannelAmountBound(accessKeys.test, b)).toEqual({
            minAmount: 1000,
            maxAmount: 2000,
        });
    });

    it('matches the channel name case-insensitively', () => {
        const b = biller([{ paymentChannelName: 'int', minAmount: '10000', maxAmount: '10000000' }]);
        expect(resolveChannelAmountBound(UTILITY, b)).toEqual({ minAmount: 100, maxAmount: 100000 });
    });

    it('returns no bound when INT is absent, the block is missing, or the biller is undefined', () => {
        const unbounded = { minAmount: undefined, maxAmount: undefined };
        expect(resolveChannelAmountBound(UTILITY, biller([{ paymentChannelName: 'MOB' }]))).toEqual(unbounded);
        expect(resolveChannelAmountBound(UTILITY, biller(undefined))).toEqual(unbounded);
        expect(resolveChannelAmountBound(UTILITY, {})).toEqual(unbounded);
        expect(resolveChannelAmountBound(UTILITY, undefined)).toEqual(unbounded);
    });

    it('treats zero, empty, absent, negative and non-numeric limits as unbounded', () => {
        ['0', '', '   ', undefined, '-5', 'abc'].forEach(raw => {
            expect(resolveChannelAmountBound(UTILITY, biller(intEntry(raw, raw)))).toEqual({
                minAmount: undefined,
                maxAmount: undefined,
            });
        });
    });

    it('keeps whichever side is set', () => {
        expect(resolveChannelAmountBound(UTILITY, biller(intEntry('10000', '0')))).toEqual({
            minAmount: 100,
            maxAmount: undefined,
        });
        expect(resolveChannelAmountBound(UTILITY, biller(intEntry('0', '10000000')))).toEqual({
            minAmount: undefined,
            maxAmount: 100000,
        });
    });

    it('discards an unsatisfiable pair where the minimum exceeds the maximum', () => {
        expect(resolveChannelAmountBound(UTILITY, biller(intEntry('500', '100')))).toEqual({});
    });
});

describe('tightenWithChannelBound', () => {
    it('leaves both bounds untouched when there is no channel bound', () => {
        expect(tightenWithChannelBound(50, 500, undefined)).toEqual({
            minimumAmount: 50,
            maximumAmount: 500,
        });
        expect(tightenWithChannelBound(50, 500, {})).toEqual({
            minimumAmount: 50,
            maximumAmount: 500,
        });
    });

    it('adopts the channel bound when there is no prior bound', () => {
        expect(tightenWithChannelBound(undefined, undefined, { minAmount: 100, maxAmount: 100000 })).toEqual(
            { minimumAmount: 100, maximumAmount: 100000 }
        );
    });

    it('never yields Infinity when only a channel maximum exists', () => {
        expect(tightenWithChannelBound(1, undefined, { maxAmount: 100000 })).toEqual({
            minimumAmount: 1,
            maximumAmount: 100000,
        });
    });

    it('raises an existing minimum and lowers an existing maximum', () => {
        expect(tightenWithChannelBound(50, 500, { minAmount: 100, maxAmount: 400 })).toEqual({
            minimumAmount: 100,
            maximumAmount: 400,
        });
    });

    it('never loosens an existing bound', () => {
        expect(tightenWithChannelBound(200, 300, { minAmount: 100, maxAmount: 100000 })).toEqual({
            minimumAmount: 200,
            maximumAmount: 300,
        });
    });

    it('returns the original pair when the intersection would be empty', () => {
        expect(tightenWithChannelBound(undefined, 50, { minAmount: 100 })).toEqual({
            minimumAmount: undefined,
            maximumAmount: 50,
        });
    });

    it('tightens an Exact-and-above bill up to the channel minimum', () => {
        const bound = resolveChannelAmountBound(accessKeys.fastag, indusIndFastag);
        expect(tightenWithChannelBound(50, undefined, bound)).toEqual({
            minimumAmount: 100,
            maximumAmount: 100000,
        });
    });
});

describe('FASTag 100-rupee floor', () => {
    it('enforces 100 when the biller publishes no channel data at all', () => {
        const floored = { minAmount: 100, maxAmount: undefined };
        expect(resolveChannelAmountBound(accessKeys.fastag, undefined)).toEqual(floored);
        expect(resolveChannelAmountBound(accessKeys.fastag, {})).toEqual(floored);
        expect(resolveChannelAmountBound(accessKeys.fastag, biller(undefined))).toEqual(floored);
        expect(resolveChannelAmountBound(accessKeys.fastag, biller([{ paymentChannelName: 'MOB' }]))).toEqual(
            floored
        );
    });

    it('raises a published channel minimum that sits below 100', () => {
        expect(resolveChannelAmountBound(accessKeys.fastag, biller(intEntry('5000', '10000000')))).toEqual({
            minAmount: 100,
            maxAmount: 100000,
        });
    });

    it('never lowers a published channel minimum above 100', () => {
        expect(resolveChannelAmountBound(accessKeys.fastag, biller(intEntry('50000', '10000000')))).toEqual({
            minAmount: 500,
            maxAmount: 100000,
        });
    });

    it('still applies when the published pair is inverted', () => {
        expect(resolveChannelAmountBound(accessKeys.fastag, biller(intEntry('500', '100')))).toEqual({
            minAmount: 100,
            maxAmount: undefined,
        });
    });

    it('leaves the channel bound alone when the floor would exceed a published maximum', () => {
        expect(resolveChannelAmountBound(accessKeys.fastag, biller(intEntry('1000', '5000')))).toEqual({
            minAmount: 10,
            maxAmount: 50,
        });
    });

    it('does not apply to other services', () => {
        expect(resolveChannelAmountBound(UTILITY, undefined)).toEqual({
            minAmount: undefined,
            maxAmount: undefined,
        });
    });

    it('feeds a 100 minimum into the payment bounds with no prior bound', () => {
        expect(
            tightenWithChannelBound(undefined, undefined, resolveChannelAmountBound(accessKeys.fastag, undefined))
        ).toEqual({ minimumAmount: 100, maximumAmount: undefined });
    });
});

describe('outside production', () => {
    it('returns no bound at all, channel data and FASTag floor included', async () => {
        vi.resetModules();
        vi.doMock('@src/config-global', () => ({ ENV: 'staging' }));
        const staging = await import('../../utils/channelAmountLimit');
        expect(staging.resolveChannelAmountBound(accessKeys.fastag, indusIndFastag)).toEqual({});
        expect(staging.resolveChannelAmountBound(accessKeys.fastag, undefined)).toEqual({});
        expect(staging.resolveChannelAmountBound(UTILITY, biller(intEntry('10000', '10000000')))).toEqual({});
        vi.doUnmock('@src/config-global');
        vi.resetModules();
    });

    it('leaves tightenWithChannelBound a no-op when given the empty bound', () => {
        expect(tightenWithChannelBound(1, undefined, {})).toEqual({ minimumAmount: 1, maximumAmount: undefined });
    });
});
