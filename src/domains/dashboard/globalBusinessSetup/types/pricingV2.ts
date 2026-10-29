// Pricing V2 — generic component-based pricing model (ported from vendor Base93).
// A pricing doc is a set of typed `components` (quantity/choice/toggle/amount/fee),
// each optionally bound to a dynamic-form field/section via `form_binding`.

export type PricingModelV2 = 'flat' | 'fixed' | 'visa_table' | 'visa_tiered';

export type ComponentTypeV2 = 'quantity' | 'choice' | 'toggle' | 'amount' | 'fee';

export type RecurrenceV2 = 'one_time' | 'annual';

export type AmountBracketV2 = {
    min: number;
    max: number;
    fee: number;
};

export type ConditionOperatorV2 =
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_equals'
    | 'less_than_equals';

export type ComponentConditionV2 = {
    enabled: boolean;
    source: string;
    operator: ConditionOperatorV2;
    value: string;
};

export type ChoiceOptionV2 = {
    key: string;
    label: string;
    price: number;
};

export type FormBindingV2 = {
    source: 'field_value' | 'section_count';
    field?: string;
    field_ref_id?: string;
    section?: string;
    section_ref_id?: string;
    label?: string;
};

export type ComponentV2 = {
    key: string;
    type: ComponentTypeV2;
    label: string;
    taxable: boolean;
    recurrence?: RecurrenceV2;
    conditional: ComponentConditionV2;
    form_binding?: FormBindingV2 | null;

    // quantity
    unit?: string;
    included?: number;
    min?: number;
    max?: number;
    unit_price?: number;

    // choice
    required?: boolean;
    options?: ChoiceOptionV2[];

    // toggle
    price?: number;

    // amount
    amount_strategy?: 'brackets' | 'percent';
    brackets?: AmountBracketV2[];
    percent_rate?: number;
    min_fee?: number;
    max_fee?: number;
    default_amount?: number;

    // fee (always charged; `price` for flat, `percent_rate` + caps for percent_of_subtotal)
    fee_strategy?: 'flat' | 'percent_of_subtotal';
};

export type FixedPackageV2 = {
    key: string;
    label: string;
    price: number;
    quantities: Record<string, number>;
};

export type RateRowV2 = {
    qty: number;
    price: number;
};

export type TierRowV2 = {
    min: number;
    max: number;
    unit_price: number;
};

export type TaxConfigV2 = {
    label: string;
    rate: number;
    mode: 'exclusive' | 'inclusive';
};

export type PricingV2Draft = {
    name: string;
    description?: string;
    country: string;
    company_type: string;
    freezone?: string;
    currency: string;
    status: 'active' | 'inactive';
    starting_price?: number;

    pricing_model: PricingModelV2;
    flat_amount?: number;
    flat_fee_recurrence?: RecurrenceV2;
    fixed_packages: FixedPackageV2[];
    rate_rows: RateRowV2[];
    extra_visa_fee?: number;
    tier_rows: TierRowV2[];

    components: ComponentV2[];
    tax: TaxConfigV2;
    highlights?: string;
};

export type PreviewSelectionsV2 = {
    package_key?: string;
    quantities: Record<string, number>;
    choices: Record<string, string | null>;
    toggles: Record<string, boolean>;
    amounts: Record<string, number>;
};

export type BreakdownLineV2 = {
    label: string;
    amount: number;
    taxable: boolean;
    recurrence: RecurrenceV2;
};

export type BreakdownV2 = {
    lines: BreakdownLineV2[];
    warnings: string[];
    tax_amount: number;
    total: number;
    annual_total: number;
};
