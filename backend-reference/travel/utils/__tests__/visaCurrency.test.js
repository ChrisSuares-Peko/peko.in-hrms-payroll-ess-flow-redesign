const { convertVisaProductToInr, needsInrConversion } = require('../visaCurrency');

// value = units of currency per 1 INR (currencyapi, base INR)
const RATES = { INR: { code: 'INR', value: 1 }, USD: { code: 'USD', value: 0.0125 }, AUD: { code: 'AUD', value: 0.018 } };

const component = (overrides) => ({
    component: 'Embassy Fees', remark: null, original_cost: 120, original_currency: 'USD', currency: 'USD',
    roe: null, fx_cost: 0, fx_additional_pax_cost: 0, cost: 120, additional_pax_cost: 0, ...overrides,
});

// Australia 600 Business Visa (product 380) as VisaOS returned it
const usdProduct = () => ({
    product_id: 380,
    base_currency: 'USD',
    breakup: {
        total_tax_amount: 0, total_service_fee: 35, total_value: 155, total_taxable_value: 35,
        total_non_taxable_value: 120, total_component_value: 120, total_govt_fees: 120, tax_percentage: 0,
        components: [component(), component({ component: 'Service Fee', original_cost: 0, cost: 0 })],
    },
    age_cost_breakup: { adult: { 'Embassy Fees': 120, 'Service Fee': 0, 'Platform Fee': 35, 'Total Tax': 0, Total: 155 } },
});

const inrProduct = () => ({
    product_id: 22,
    base_currency: 'INR',
    breakup: { total_value: 16500, components: [component({ original_cost: 8000, original_currency: 'INR', currency: 'INR', cost: 8000 })] },
    age_cost_breakup: { adult: { Total: 16500 } },
});

describe('convertVisaProductToInr', () => {
    it('returns INR products untouched (same reference)', () => {
        const p = inrProduct();
        expect(convertVisaProductToInr(p, RATES)).toBe(p);
    });

    it('converts every USD money field to INR and relabels currencies', () => {
        const source = usdProduct();
        const out = convertVisaProductToInr(source, RATES);

        expect(out.base_currency).toBe('INR');
        expect(out.breakup.total_value).toBe(12400);          // 155 / 0.0125
        expect(out.breakup.total_service_fee).toBe(2800);
        expect(out.breakup.total_govt_fees).toBe(9600);
        expect(out.breakup.tax_percentage).toBe(0);           // not a money field
        expect(out.breakup.components[0]).toMatchObject({ cost: 9600, original_cost: 9600, currency: 'INR', original_currency: 'INR' });
        expect(out.age_cost_breakup.adult).toEqual({ 'Embassy Fees': 9600, 'Service Fee': 0, 'Platform Fee': 2800, 'Total Tax': 0, Total: 12400 });
        expect(out.inr_conversion).toEqual({ from_currency: 'USD', inr_per_unit: 80, original_total_value: 155 });
        expect(source.breakup.total_value).toBe(155);         // input not mutated
    });

    it('converts original_cost using its own currency (AUD component priced in USD)', () => {
        const p = usdProduct();
        p.breakup.components = [component({ original_cost: 1195, original_currency: 'AUD', cost: 829.69, original_child_cost: '0.00' })];
        const [c] = convertVisaProductToInr(p, RATES).breakup.components;
        expect(c.cost).toBe(66375.2);                         // 829.69 USD
        expect(c.original_cost).toBe(66388.89);               // 1195 AUD
        expect(c.original_child_cost).toBe('0.00');           // string stays string
    });

    it('returns null when the rate is missing or rates are unavailable', () => {
        expect(convertVisaProductToInr(usdProduct(), { INR: { value: 1 } })).toBeNull();
        expect(convertVisaProductToInr(usdProduct(), null)).toBeNull();
        const p = usdProduct();
        p.breakup.components[0].original_currency = 'AUD';
        expect(convertVisaProductToInr(p, { USD: RATES.USD })).toBeNull();
    });
});

describe('needsInrConversion', () => {
    it('is false for INR-only results and true when any product is foreign', () => {
        expect(needsInrConversion([inrProduct()])).toBe(false);
        expect(needsInrConversion([inrProduct(), usdProduct()])).toBe(true);
        expect(needsInrConversion(undefined)).toBe(false);
    });
});
