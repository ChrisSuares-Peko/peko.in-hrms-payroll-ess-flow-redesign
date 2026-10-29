jest.mock('../../loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../models/use-cases/settings', () => ({ findByName: jest.fn() }));

const { customLog } = require('../../loggerHelper');
const { findByName } = require('../../../models/use-cases/settings');
const {
    resolveInitChannel,
    resolveChannelBound,
    checkAmountAgainstBound,
    toLimitPaise,
    toPaise,
    toRupeeAmountLimit,
    buildAmountBoundMessage,
    assertBbpsChannelAmount,
} = require('../../billPayments_utils');

const withChannels = (paymentChannelInfo) => ({ billerPaymentChannels: { paymentChannelInfo } });
const intEntry = (minAmount, maxAmount) => ({ paymentChannelName: 'INT', minAmount, maxAmount });
const BOUND = { status: 'BOUNDED', minPaise: 10000, maxPaise: 10000000 };

const loggedActions = () => customLog.mock.calls.map((call) => call[2] && call[2].action).filter(Boolean);

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
    process.env.NODE_ENV = 'production';
    customLog.mockClear();
    findByName.mockReset();
    findByName.mockResolvedValue(null);
});

afterAll(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe('resolveInitChannel', () => {
    it('returns AGT for the telecom access key even when optional6 is set', () => {
        expect(resolveInitChannel('bbps_telecom_otme', { optional6: 'MOB' })).toBe('AGT');
    });

    it('returns INT for bbps_telecom_postpaid, which is not the AGT key', () => {
        expect(resolveInitChannel('bbps_telecom_postpaid')).toBe('INT');
    });

    it('uses a populated optional6 for a non-telecom key', () => {
        expect(resolveInitChannel('bbps_utility_electricity', { optional6: 'MOB' })).toBe('MOB');
    });

    it('falls back to INT when optional6 is null, empty, or whitespace-only', () => {
        expect(resolveInitChannel('bbps_utility_electricity', { optional6: null })).toBe('INT');
        expect(resolveInitChannel('bbps_utility_electricity', { optional6: '' })).toBe('INT');
        expect(resolveInitChannel('bbps_utility_electricity', { optional6: '   ' })).toBe('INT');
    });

    it('returns INT when no vendor is passed at all', () => {
        expect(resolveInitChannel('bbps_utility_electricity')).toBe('INT');
    });
});

describe('resolveChannelBound', () => {
    it('normalises a single paymentChannelInfo object into an array and matches it', () => {
        expect(resolveChannelBound(withChannels(intEntry('10000', '10000000')), 'INT')).toEqual({
            status: 'BOUNDED',
            minPaise: 10000,
            maxPaise: 10000000,
        });
    });

    it('matches the right entry in an array, case-insensitively', () => {
        const biller = withChannels([
            { paymentChannelName: 'MOB', minAmount: '1', maxAmount: '2' },
            { paymentChannelName: 'int', minAmount: '10000', maxAmount: '10000000' },
        ]);
        expect(resolveChannelBound(biller, 'INT')).toEqual({
            status: 'BOUNDED',
            minPaise: 10000,
            maxPaise: 10000000,
        });
    });

    it('reports MDM_DATA_UNAVAILABLE for a null or empty blob', () => {
        expect(resolveChannelBound(null, 'INT').reason).toBe('MDM_DATA_UNAVAILABLE');
        expect(resolveChannelBound({}, 'INT').reason).toBe('MDM_DATA_UNAVAILABLE');
    });

    it('reports CHANNELS_NOT_PUBLISHED when billerPaymentChannels is absent', () => {
        expect(resolveChannelBound({ billerName: 'X' }, 'INT').reason).toBe('CHANNELS_NOT_PUBLISHED');
    });

    it('reports CHANNEL_NOT_LISTED when our channel is absent from the list', () => {
        const biller = withChannels([{ paymentChannelName: 'MOB', minAmount: '1', maxAmount: '2' }]);
        expect(resolveChannelBound(biller, 'INT').reason).toBe('CHANNEL_NOT_LISTED');
    });

    it('reports LIMITS_INVERTED when minAmount exceeds maxAmount', () => {
        expect(resolveChannelBound(withChannels(intEntry('500', '100')), 'INT').reason).toBe('LIMITS_INVERTED');
    });

    it('reports UNLIMITED when both limits are zero', () => {
        expect(resolveChannelBound(withChannels(intEntry('0', '0')), 'INT').status).toBe('UNLIMITED');
    });

    it('treats an absent or empty limit tag as no limit on that side', () => {
        expect(resolveChannelBound(withChannels(intEntry('', '10000000')), 'INT')).toEqual({
            status: 'BOUNDED',
            minPaise: 0,
            maxPaise: 10000000,
        });
        expect(resolveChannelBound(withChannels({ paymentChannelName: 'INT', minAmount: '10000' }), 'INT')).toEqual({
            status: 'BOUNDED',
            minPaise: 10000,
            maxPaise: 0,
        });
    });
});

describe('checkAmountAgainstBound', () => {
    it('accepts an amount exactly at the minimum', () => {
        expect(checkAmountAgainstBound(10000, BOUND)).toBeNull();
    });

    it('rejects one paisa below the minimum', () => {
        expect(checkAmountAgainstBound(9999, BOUND)).toEqual({
            violation: 'BELOW_MIN',
            minPaise: 10000,
            maxPaise: 10000000,
        });
    });

    it('accepts an amount exactly at the maximum', () => {
        expect(checkAmountAgainstBound(10000000, BOUND)).toBeNull();
    });

    it('rejects one paisa above the maximum', () => {
        expect(checkAmountAgainstBound(10000001, BOUND)).toEqual({
            violation: 'ABOVE_MAX',
            minPaise: 10000,
            maxPaise: 10000000,
        });
    });

    it('never rejects against an UNLIMITED or UNKNOWN bound', () => {
        expect(checkAmountAgainstBound(1, { status: 'UNLIMITED', minPaise: 0, maxPaise: 0 })).toBeNull();
        expect(checkAmountAgainstBound(1, { status: 'UNKNOWN', minPaise: 0, maxPaise: 0 })).toBeNull();
        expect(checkAmountAgainstBound(1, null)).toBeNull();
    });

    it('never rejects a NaN, zero, or negative amount', () => {
        expect(checkAmountAgainstBound(NaN, BOUND)).toBeNull();
        expect(checkAmountAgainstBound(0, BOUND)).toBeNull();
        expect(checkAmountAgainstBound(-5, BOUND)).toBeNull();
    });

    it('ignores the side of the bound that is unset', () => {
        const minOnly = { status: 'BOUNDED', minPaise: 10000, maxPaise: 0 };
        const maxOnly = { status: 'BOUNDED', minPaise: 0, maxPaise: 10000 };
        expect(checkAmountAgainstBound(99999999, minOnly)).toBeNull();
        expect(checkAmountAgainstBound(1, maxOnly)).toBeNull();
        expect(checkAmountAgainstBound(10001, maxOnly).violation).toBe('ABOVE_MAX');
    });
});

describe('toLimitPaise and toPaise', () => {
    it('folds every non-positive or malformed limit to zero', () => {
        expect(toLimitPaise('10000')).toBe(10000);
        expect(toLimitPaise('  10000 ')).toBe(10000);
        expect(toLimitPaise('0')).toBe(0);
        expect(toLimitPaise('')).toBe(0);
        expect(toLimitPaise('   ')).toBe(0);
        expect(toLimitPaise(undefined)).toBe(0);
        expect(toLimitPaise(null)).toBe(0);
        expect(toLimitPaise('-5')).toBe(0);
        expect(toLimitPaise('abc')).toBe(0);
    });

    it('converts rupees to integer paise the same way the vendor request builder does', () => {
        expect(toPaise(100)).toBe(10000);
        expect(toPaise('100')).toBe(10000);
        expect(toPaise(100.005)).toBe(10001);
        expect(toPaise(0.01)).toBe(1);
        expect(toPaise('x')).toBeNaN();
    });
});

describe('toRupeeAmountLimit', () => {
    it('converts a bounded pair to rupees and nulls the unset side', () => {
        expect(toRupeeAmountLimit(BOUND)).toEqual({ status: 'BOUNDED', minAmount: 100, maxAmount: 100000 });
        expect(toRupeeAmountLimit({ status: 'BOUNDED', minPaise: 10000, maxPaise: 0 })).toEqual({
            status: 'BOUNDED',
            minAmount: 100,
            maxAmount: null,
        });
    });

    it('nulls both sides for a non-bounded status', () => {
        expect(toRupeeAmountLimit({ status: 'UNKNOWN', minPaise: 0, maxPaise: 0 })).toEqual({
            status: 'UNKNOWN',
            minAmount: null,
            maxAmount: null,
        });
        expect(toRupeeAmountLimit(undefined)).toEqual({ status: 'UNKNOWN', minAmount: null, maxAmount: null });
    });
});

describe('buildAmountBoundMessage', () => {
    it('states both bounds with Indian-locale grouping and no vendor wording', () => {
        expect(buildAmountBoundMessage({ minPaise: 10000, maxPaise: 10000000 })).toBe(
            'This biller accepts payments between ₹100.00 and ₹1,00,000.00. Please change the amount and try again.'
        );
    });

    it('states a minimum-only bound', () => {
        expect(buildAmountBoundMessage({ minPaise: 10000, maxPaise: 0 })).toBe(
            'This biller accepts payments of ₹100.00 or more. Please change the amount and try again.'
        );
    });

    it('states a maximum-only bound', () => {
        expect(buildAmountBoundMessage({ minPaise: 0, maxPaise: 10000000 })).toBe(
            'This biller accepts payments of ₹1,00,000.00 or less. Please change the amount and try again.'
        );
    });
});

describe('assertBbpsChannelAmount', () => {
    const boundedBiller = withChannels(intEntry('10000', '10000000'));

    it('short-circuits for a non-bill-payment access key without touching the bound', async () => {
        await expect(
            assertBbpsChannelAmount({ billerData: boundedBiller, accessKey: 'flight', amount: 1 })
        ).resolves.toBeNull();
        expect(customLog).not.toHaveBeenCalled();
    });

    it('accepts an in-range amount and logs nothing', async () => {
        await expect(
            assertBbpsChannelAmount({
                billerData: boundedBiller,
                accessKey: 'bbps_utility_electricity',
                amount: 500,
                billerId: 'B1',
            })
        ).resolves.toBeNull();
        expect(loggedActions()).toEqual([]);
    });

    it('accepts amounts exactly on either bound', async () => {
        const args = { billerData: boundedBiller, accessKey: 'bbps_utility_electricity', billerId: 'B1' };
        await expect(assertBbpsChannelAmount({ ...args, amount: 100 })).resolves.toBeNull();
        await expect(assertBbpsChannelAmount({ ...args, amount: 100000 })).resolves.toBeNull();
    });

    it('blocks an out-of-range amount and logs channelLimitBlocked', async () => {
        await expect(
            assertBbpsChannelAmount({
                billerData: boundedBiller,
                accessKey: 'bbps_utility_electricity',
                amount: 50,
                billerId: 'B1',
            })
        ).resolves.toContain('between ₹100.00 and ₹1,00,000.00');
        expect(loggedActions()).toContain('bbps:channelLimitBlocked');
    });

    it('resolves the AGT entry for the telecom access key', async () => {
        const biller = withChannels([
            intEntry('10000', '10000000'),
            { paymentChannelName: 'AGT', minAmount: '100000', maxAmount: '200000' },
        ]);
        await expect(
            assertBbpsChannelAmount({ billerData: biller, accessKey: 'bbps_telecom_otme', amount: 500, billerId: 'B1' })
        ).resolves.toContain('between ₹1,000.00 and ₹2,000.00');
    });

    it('downgrades to a log when the settings row is in monitor mode', async () => {
        findByName.mockResolvedValue({ details: { mode: 'monitor' } });
        await expect(
            assertBbpsChannelAmount({
                billerData: boundedBiller,
                accessKey: 'bbps_utility_electricity',
                amount: 50,
                billerId: 'B1',
            })
        ).resolves.toBeNull();
        expect(loggedActions()).toContain('bbps:channelLimitWouldBlock');
    });

    it('reads monitor mode from a JSON string details column', async () => {
        findByName.mockResolvedValue({ details: JSON.stringify({ mode: 'monitor' }) });
        await expect(
            assertBbpsChannelAmount({
                billerData: boundedBiller,
                accessKey: 'bbps_utility_electricity',
                amount: 50,
            })
        ).resolves.toBeNull();
    });

    it('still blocks when the settings row is missing or the read throws', async () => {
        findByName.mockResolvedValue(null);
        await expect(
            assertBbpsChannelAmount({ billerData: boundedBiller, accessKey: 'bbps_utility_electricity', amount: 50 })
        ).resolves.toContain('This biller accepts payments');

        findByName.mockRejectedValue(new Error('db down'));
        await expect(
            assertBbpsChannelAmount({ billerData: boundedBiller, accessKey: 'bbps_utility_electricity', amount: 50 })
        ).resolves.toContain('This biller accepts payments');
        expect(loggedActions()).toContain('bbps:limitModeReadFailed');
    });

    it('fails open with a reason code for every unknown bound', async () => {
        const cases = [
            [null, 'MDM_DATA_UNAVAILABLE'],
            [{}, 'MDM_DATA_UNAVAILABLE'],
            [{ billerName: 'X' }, 'CHANNELS_NOT_PUBLISHED'],
            [withChannels([{ paymentChannelName: 'MOB', minAmount: '1', maxAmount: '2' }]), 'CHANNEL_NOT_LISTED'],
            [withChannels(intEntry('500', '100')), 'LIMITS_INVERTED'],
        ];
        for (const [billerData, reason] of cases) {
            customLog.mockClear();
            await expect(
                assertBbpsChannelAmount({ billerData, accessKey: 'bbps_utility_electricity', amount: 1 })
            ).resolves.toBeNull();
            expect(loggedActions()).toContain('bbps:channelBoundUnknown');
            expect(customLog.mock.calls[0][2].reason).toBe(reason);
        }
    });

    it('fails open and logs when the amount is missing or unusable', async () => {
        for (const amount of [undefined, null, 0, -5, 'abc']) {
            customLog.mockClear();
            await expect(
                assertBbpsChannelAmount({ billerData: boundedBiller, accessKey: 'bbps_utility_electricity', amount })
            ).resolves.toBeNull();
            expect(loggedActions()).toContain('bbps:channelBoundAmountUnusable');
        }
    });

    it('logs a CCF1-basis divergence when the bill alone passes but bill plus CCF1 would not', async () => {
        await expect(
            assertBbpsChannelAmount({
                billerData: boundedBiller,
                accessKey: 'bbps_utility_electricity',
                amount: 100000,
                ccf1Amount: '500',
                billerId: 'B1',
            })
        ).resolves.toBeNull();
        expect(loggedActions()).toContain('bbps:channelBoundCcf1BasisDivergence');
    });

    it('does not log a divergence when bill plus CCF1 is still in range', async () => {
        await expect(
            assertBbpsChannelAmount({
                billerData: boundedBiller,
                accessKey: 'bbps_utility_electricity',
                amount: 500,
                ccf1Amount: '500',
            })
        ).resolves.toBeNull();
        expect(loggedActions()).not.toContain('bbps:channelBoundCcf1BasisDivergence');
    });

    it('resolves the vendor optional6 channel on the wallet path rather than assuming INT', async () => {
        const biller = withChannels([
            intEntry('10000', '10000000'),
            { paymentChannelName: 'MOB', minAmount: '100000', maxAmount: '200000' },
        ]);
        await expect(
            assertBbpsChannelAmount({
                billerData: biller,
                accessKey: 'bbps_utility_electricity',
                vendor: { optional6: 'MOB' },
                amount: 500,
                billerId: 'B1',
            })
        ).resolves.toContain('between ₹1,000.00 and ₹2,000.00');
        expect(customLog.mock.calls[0][2].initChannel).toBe('MOB');
    });
});

describe('applyServiceFloor', () => {
    const { applyServiceFloor } = require('../../billPayments_utils');
    const FASTAG = 'bbps_utility_fastag';

    it('creates a 10000-paise floor for FASTag when no channel bound exists', () => {
        const floored = { status: 'BOUNDED', minPaise: 10000, maxPaise: 0 };
        expect(
            applyServiceFloor({ status: 'UNKNOWN', reason: 'CHANNELS_NOT_PUBLISHED', minPaise: 0, maxPaise: 0 }, FASTAG)
        ).toEqual(floored);
        expect(applyServiceFloor({ status: 'UNLIMITED', minPaise: 0, maxPaise: 0 }, FASTAG)).toEqual(floored);
        expect(
            applyServiceFloor({ status: 'UNKNOWN', reason: 'LIMITS_INVERTED', minPaise: 500, maxPaise: 100 }, FASTAG)
        ).toEqual(floored);
    });

    it('raises a channel minimum below the floor and keeps the channel maximum', () => {
        expect(applyServiceFloor({ status: 'BOUNDED', minPaise: 5000, maxPaise: 10000000 }, FASTAG)).toEqual({
            status: 'BOUNDED',
            minPaise: 10000,
            maxPaise: 10000000,
        });
    });

    it('never lowers a channel minimum above the floor', () => {
        expect(applyServiceFloor({ status: 'BOUNDED', minPaise: 50000, maxPaise: 10000000 }, FASTAG)).toEqual({
            status: 'BOUNDED',
            minPaise: 50000,
            maxPaise: 10000000,
        });
    });

    it('leaves the channel bound untouched when the floor would exceed its maximum', () => {
        const bound = { status: 'BOUNDED', minPaise: 1000, maxPaise: 5000 };
        expect(applyServiceFloor(bound, FASTAG)).toBe(bound);
    });

    it('is a no-op for every other access key', () => {
        const bound = { status: 'UNKNOWN', reason: 'MDM_DATA_UNAVAILABLE', minPaise: 0, maxPaise: 0 };
        expect(applyServiceFloor(bound, 'bbps_utility_electricity')).toBe(bound);
    });
});

describe('assertBbpsChannelAmount FASTag floor', () => {
    const FASTAG = 'bbps_utility_fastag';
    const noChannels = { billerName: 'IndusInd Bank FASTag' };

    it('blocks a sub-100-rupee FASTag payment even when the biller publishes no channel data', async () => {
        await expect(
            assertBbpsChannelAmount({ billerData: noChannels, accessKey: FASTAG, amount: 50, billerId: 'F1' })
        ).resolves.toContain('₹100.00 or more');
        expect(loggedActions()).toContain('bbps:channelBoundUnknown');
        expect(loggedActions()).toContain('bbps:channelLimitBlocked');
        expect(customLog.mock.calls[0][2].serviceFloorPaise).toBe(10000);
    });

    it('blocks 99.99 rupees and accepts exactly 100', async () => {
        await expect(
            assertBbpsChannelAmount({ billerData: noChannels, accessKey: FASTAG, amount: 99.99, billerId: 'F1' })
        ).resolves.toContain('₹100.00 or more');
        await expect(
            assertBbpsChannelAmount({ billerData: noChannels, accessKey: FASTAG, amount: 100, billerId: 'F1' })
        ).resolves.toBeNull();
    });

    it('combines the floor with a published channel maximum', async () => {
        const biller = withChannels(intEntry('5000', '10000000'));
        await expect(
            assertBbpsChannelAmount({ billerData: biller, accessKey: FASTAG, amount: 75, billerId: 'F1' })
        ).resolves.toContain('between ₹100.00 and ₹1,00,000.00');
        await expect(
            assertBbpsChannelAmount({ billerData: biller, accessKey: FASTAG, amount: 100001, billerId: 'F1' })
        ).resolves.toContain('between ₹100.00 and ₹1,00,000.00');
    });

    it('still fails open for a non-FASTag biller with no channel data', async () => {
        await expect(
            assertBbpsChannelAmount({ billerData: noChannels, accessKey: 'bbps_utility_electricity', amount: 50 })
        ).resolves.toBeNull();
    });
});

describe('assertBbpsChannelAmount outside production', () => {
    const bounded = withChannels(intEntry('10000', '10000000'));

    it.each(['staging', 'development', 'test'])(
        'logs a would-block and never blocks when NODE_ENV is %s',
        async (env) => {
            process.env.NODE_ENV = env;
            await expect(
                assertBbpsChannelAmount({ billerData: bounded, accessKey: 'bbps_utility_electricity', amount: 50, billerId: 'B1' })
            ).resolves.toBeNull();
            expect(loggedActions()).toContain('bbps:channelLimitWouldBlock');
            expect(loggedActions()).not.toContain('bbps:channelLimitBlocked');
            expect(customLog.mock.calls.at(-1)[2].nodeEnv).toBe(env);
        }
    );

    it('does not consult the settings table outside production', async () => {
        process.env.NODE_ENV = 'staging';
        findByName.mockResolvedValue({ details: { mode: 'block' } });
        await expect(
            assertBbpsChannelAmount({ billerData: bounded, accessKey: 'bbps_utility_electricity', amount: 50 })
        ).resolves.toBeNull();
        expect(findByName).not.toHaveBeenCalled();
    });

    it('bypasses the FASTag floor outside production too', async () => {
        process.env.NODE_ENV = 'staging';
        await expect(
            assertBbpsChannelAmount({ billerData: { billerName: 'X' }, accessKey: 'bbps_utility_fastag', amount: 1 })
        ).resolves.toBeNull();
        expect(loggedActions()).toContain('bbps:channelLimitWouldBlock');
    });

    it('still passes in-range amounts silently outside production', async () => {
        process.env.NODE_ENV = 'staging';
        await expect(
            assertBbpsChannelAmount({ billerData: bounded, accessKey: 'bbps_utility_electricity', amount: 500 })
        ).resolves.toBeNull();
        expect(loggedActions()).toEqual([]);
    });

    it('records nodeEnv on a production block as well', async () => {
        await expect(
            assertBbpsChannelAmount({ billerData: bounded, accessKey: 'bbps_utility_electricity', amount: 50 })
        ).resolves.toContain('This biller accepts payments');
        expect(customLog.mock.calls.at(-1)[2].nodeEnv).toBe('production');
    });
});
