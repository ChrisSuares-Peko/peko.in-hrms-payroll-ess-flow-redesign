const {
    extractSellerSettlement,
    extractBppTerms,
    judgeSplitEligibility,
    buildSellerRecord,
    isPlaceholder,
} = require('../ondcSeller');

/**
 * The verbatim on_init our staging BPP (staging-automation.ondc.org) returns —
 * masked settlement details and the ONDC spec's placeholder tax strings. This is
 * the payload the eligibility policy exists for.
 */
const STAGING_ON_INIT_ORDER = {
    payment: {
        '@ondc/org/buyer_app_finder_fee_amount': '3',
        '@ondc/org/buyer_app_finder_fee_type': 'percent',
        '@ondc/org/settlement_details': [
            {
                bank_name: 'XXXX',
                beneficiary_name: 'xxxx',
                branch_name: 'XXXX',
                settlement_bank_account_no: 'XXXX',
                settlement_counterparty: 'seller-app',
                settlement_ifsc_code: 'XXXX',
                settlement_phase: 'sale-amount',
                settlement_type: 'neft',
            },
        ],
        collected_by: 'BPP',
        status: 'NOT-PAID',
        type: 'ON-ORDER',
    },
    tags: [
        {
            code: 'bpp_terms',
            list: [
                { code: 'max_liability', value: '2' },
                { code: 'max_liability_cap', value: '10000.00' },
                { code: 'mandatory_arbitration', value: 'false' },
                { code: 'court_jurisdiction', value: 'Bengaluru' },
                { code: 'delay_interest', value: '7.50' },
                { code: 'tax_number', value: 'gst_number_of_sellerNP' },
                { code: 'provider_tax_number', value: 'PAN_number_of_provider' },
            ],
        },
    ],
};

const REAL_BANK_ORDER = {
    payment: {
        '@ondc/org/settlement_details': [
            {
                settlement_type: 'neft',
                settlement_bank_account_no: '026291800001191',
                settlement_ifsc_code: 'YESB0000262',
                beneficiary_name: 'ABC Traders',
                bank_name: 'Yes Bank',
                branch_name: 'Jayanagar',
                settlement_counterparty: 'seller-app',
                settlement_phase: 'sale-amount',
            },
        ],
        collected_by: 'BAP',
    },
    tags: [
        {
            code: 'bpp_terms',
            list: [
                { code: 'tax_number', value: '29AAICP2912R1ZR' },
                { code: 'provider_tax_number', value: 'ABCPV1234D' },
            ],
        },
    ],
};

describe('extractSellerSettlement', () => {
    it('flattens settlement_details[0] and keeps the raw array', () => {
        const result = extractSellerSettlement(STAGING_ON_INIT_ORDER);
        expect(result.settlementType).toBe('neft');
        expect(result.settlementCounterparty).toBe('seller-app');
        expect(result.settlementPhase).toBe('sale-amount');
        expect(result.settlementBankAccountNo).toBe('XXXX');
        expect(result.settlementDetails).toHaveLength(1);
        expect(result.collectedBy).toBe('BPP');
        expect(result.buyerFinderFeeType).toBe('percent');
        expect(result.buyerFinderFeeAmount).toBe('3');
    });

    it('returns nulls rather than throwing when the BPP omits the payment block', () => {
        expect(extractSellerSettlement({}).settlementType).toBeNull();
        expect(extractSellerSettlement({}).settlementDetails).toBeNull();
        expect(extractSellerSettlement(undefined).upiAddress).toBeNull();
    });

    it('normalises empty strings to null', () => {
        const result = extractSellerSettlement({
            payment: { '@ondc/org/settlement_details': [{ settlement_type: '  ', upi_address: '' }] },
        });
        expect(result.settlementType).toBeNull();
        expect(result.upiAddress).toBeNull();
    });
});

describe('extractBppTerms', () => {
    it('reads tax_number as the seller NP GST and provider_tax_number as the provider PAN', () => {
        const result = extractBppTerms(STAGING_ON_INIT_ORDER);
        expect(result.gstNumber).toBe('gst_number_of_sellerNP');
        expect(result.panNumber).toBe('PAN_number_of_provider');
        expect(result.bppTerms).toHaveLength(7);
    });

    it('keeps the whole bpp_terms list so liability/jurisdiction terms are not lost', () => {
        const { bppTerms } = extractBppTerms(STAGING_ON_INIT_ORDER);
        expect(bppTerms.find((t) => t.code === 'court_jurisdiction').value).toBe('Bengaluru');
        expect(bppTerms.find((t) => t.code === 'delay_interest').value).toBe('7.50');
    });

    it('is null-safe when the BPP sends no tags at all', () => {
        expect(extractBppTerms({})).toEqual({ gstNumber: null, panNumber: null, bppTerms: null });
        expect(extractBppTerms({ tags: [{ code: 'other', list: [] }] }).gstNumber).toBeNull();
    });
});

describe('judgeSplitEligibility', () => {
    it('rejects the masked staging details', () => {
        const settlement = extractSellerSettlement(STAGING_ON_INIT_ORDER);
        expect(judgeSplitEligibility(settlement)).toEqual({
            splitEligible: false,
            ineligibleReason: 'masked_settlement_details',
        });
    });

    it('accepts a real bank account + IFSC', () => {
        const settlement = extractSellerSettlement(REAL_BANK_ORDER);
        expect(judgeSplitEligibility(settlement)).toEqual({
            splitEligible: true,
            ineligibleReason: null,
        });
    });

    it('accepts a real UPI vpa', () => {
        const settlement = extractSellerSettlement({
            payment: {
                '@ondc/org/settlement_details': [
                    { settlement_type: 'upi', upi_address: 'abctraders@okhdfcbank' },
                ],
            },
        });
        expect(judgeSplitEligibility(settlement).splitEligible).toBe(true);
    });

    it('rejects a malformed IFSC', () => {
        const settlement = extractSellerSettlement({
            payment: {
                '@ondc/org/settlement_details': [
                    { settlement_type: 'neft', settlement_bank_account_no: '026291800001191', settlement_ifsc_code: 'NOTANIFSC' },
                ],
            },
        });
        expect(judgeSplitEligibility(settlement).ineligibleReason).toBe('missing_ifsc');
    });

    it('rejects a non-numeric account number', () => {
        const settlement = extractSellerSettlement({
            payment: {
                '@ondc/org/settlement_details': [
                    { settlement_type: 'neft', settlement_bank_account_no: 'ACCT-123', settlement_ifsc_code: 'YESB0000262' },
                ],
            },
        });
        expect(judgeSplitEligibility(settlement).ineligibleReason).toBe('missing_account_no');
    });

    it('rejects a malformed upi vpa', () => {
        const settlement = extractSellerSettlement({
            payment: { '@ondc/org/settlement_details': [{ settlement_type: 'upi', upi_address: 'notavpa' }] },
        });
        expect(judgeSplitEligibility(settlement).ineligibleReason).toBe('missing_upi');
    });

    it('rejects when there is no settlement block at all', () => {
        expect(judgeSplitEligibility(extractSellerSettlement({})).ineligibleReason).toBe(
            'no_settlement_details'
        );
    });
});

describe('isPlaceholder', () => {
    it.each(['XXXX', 'xxxx', 'X', '', '   ', 'gst_number_of_sellerNP', 'PAN_number_of_provider', 'bank_name_of_provider'])(
        'treats %p as a placeholder',
        (value) => expect(isPlaceholder(value)).toBe(true)
    );

    it.each(['026291800001191', 'YESB0000262', 'ABCPV1234D', '29AAICP2912R1ZR', 'abc@okhdfcbank'])(
        'treats %p as real',
        (value) => expect(isPlaceholder(value)).toBe(false)
    );
});

describe('buildSellerRecord', () => {
    it('produces the full ondcSellers row for the staging payload', () => {
        const record = buildSellerRecord(STAGING_ON_INIT_ORDER, {
            bppId: 'staging-automation.ondc.org',
            bppUri: 'https://workbench.ondc.tech/api-service/ONDC:RET14/1.2.5/seller',
            providerId: 'P1',
            vendorName: 'ABC',
            domain: 'ONDC:RET14',
        });

        expect(record).toMatchObject({
            bppId: 'staging-automation.ondc.org',
            providerId: 'P1',
            vendorName: 'ABC',
            domain: 'ONDC:RET14',
            settlementType: 'neft',
            gstNumber: 'gst_number_of_sellerNP',
            panNumber: 'PAN_number_of_provider',
            splitEligible: false,
            ineligibleReason: 'masked_settlement_details',
        });
    });

    it('falls back to providerId when the provider has no descriptor name', () => {
        const record = buildSellerRecord(REAL_BANK_ORDER, { bppId: 'b', providerId: 'P9' });
        expect(record.vendorName).toBe('P9');
        expect(record.splitEligible).toBe(true);
    });
});
