import { defaultCondition, getDefaultV2Draft, slugifyKey, visasComponent } from './defaults';
import { PricingType } from '../../types/pricing';
import {
    ComponentV2,
    PricingModelV2,
    PricingV2Draft,
    RateRowV2,
    RecurrenceV2,
    TaxConfigV2,
    TierRowV2,
} from '../../types/pricingV2';

// A stored pricing document may be a legacy V1 doc (Peko `PricingType`) or a V2
// doc carrying the extra fields below. This intersection type covers both so the
// normalizer can read either shape.
type PricingDoc = Omit<PricingType, 'fixed_packages' | 'pricing_model'> & {
    // A stored doc's model may be a V1 name ('fixed'|'table'|'tiered') or a V2
    // name ('flat'|'visa_table'|'visa_tiered') depending on schema_version.
    pricing_model: PricingType['pricing_model'] | PricingModelV2;
    schema_version?: number;
    country?: string;
    company_type?: string;
    starting_price?: number;
    flat_amount?: number;
    flat_fee_recurrence?: RecurrenceV2;
    components?: ComponentV2[];
    tax?: TaxConfigV2;
    fixed_packages?: Array<{
        key?: string;
        label: string;
        price: number;
        visas?: number;
        quantities?: Record<string, number>;
    }>;
};

const to_rate_rows = (table?: Record<string, number>): RateRowV2[] =>
    table && Object.keys(table).length
        ? Object.entries(table).map(([qty, price]) => ({ qty: Number(qty), price }))
        : [{ qty: 0, price: 0 }];

const to_tier_rows = (tiers?: { min: number; max: number; price: number }[]): TierRowV2[] =>
    tiers?.length
        ? tiers.map(t => ({ min: t.min, max: t.max, unit_price: t.price }))
        : [{ min: 1, max: 10, unit_price: 0 }];

const normalizeComponent = (c: ComponentV2): ComponentV2 => ({
    ...c,
    taxable: c.taxable !== false,
    recurrence: c.recurrence ?? 'one_time',
    conditional: c.conditional ?? defaultCondition(),
});

function v1Components(p: PricingDoc): ComponentV2[] {
    const components: ComponentV2[] = [];
    const base = (key: string, label: string) => ({
        key,
        label,
        taxable: true,
        recurrence: 'one_time' as const,
        conditional: defaultCondition(),
    });

    const needsVisas =
        p.pricing_model === 'table' ||
        p.pricing_model === 'tiered' ||
        (p.fixed_packages ?? []).some(pkg => (pkg.visas ?? 0) > 0);

    if (needsVisas) {
        components.push({
            ...visasComponent(),
            min: p.min_visas ?? 0,
            max: p.max_visas ?? 10,
        });
    }

    if (p.included_activities != null) {
        components.push({
            ...base('activities', 'Activities'),
            type: 'quantity',
            included: p.included_activities,
            min: 0,
            max: p.extra_activity_fee ? p.max_activities ?? 25 : p.included_activities,
            unit_price: p.extra_activity_fee ?? 0,
        });
    }

    if (p.general_trading_fee != null) {
        components.push({
            ...base('general_trading', 'General Trading add-on'),
            type: 'toggle',
            price: p.general_trading_fee,
        });
    }

    if (p.included_shareholders != null) {
        components.push({
            ...base('shareholders', 'Shareholders'),
            type: 'quantity',
            included: p.included_shareholders,
            min: 1,
            max: p.extra_shareholder_fee ? p.max_shareholders ?? 20 : p.included_shareholders,
            unit_price: p.extra_shareholder_fee ?? 0,
        });
    }

    if (p.establishment_card_options?.length) {
        components.push({
            ...base('establishment_card', 'Establishment Card'),
            type: 'choice',
            required: true,
            options: p.establishment_card_options.map(o => ({
                key: slugifyKey(o.label),
                label: o.label,
                price: o.price,
            })),
        });
    } else if (p.establishment_card != null) {
        components.push({
            ...base('establishment_card', 'Establishment Card'),
            type: 'choice',
            required: true,
            options: [{ key: 'standard', label: 'Standard', price: p.establishment_card }],
        });
    }

    if (p.offices?.length) {
        components.push({
            ...base('office', 'Office'),
            type: 'choice',
            required: p.office_mandatory ?? false,
            options: p.offices.map(o => ({
                key: slugifyKey(o.label),
                label: o.label,
                price: o.price,
            })),
        });
    }

    return components;
}

export function pricingToV2Draft(pricing: PricingType): PricingV2Draft {
    const p = pricing as PricingDoc;
    const defaults = getDefaultV2Draft();
    const isV2 = p.schema_version === 2;

    const v1_model_map: Record<string, PricingV2Draft['pricing_model']> = {
        fixed: 'fixed',
        table: 'visa_table',
        tiered: 'visa_tiered',
    };

    const common = {
        ...defaults,
        name: p.name ?? '',
        description: p.description ?? '',
        country: p.country ?? '',
        company_type: p.company_type ?? '',
        freezone: p.freezone ?? '',
        currency: p.currency ?? '',
        status: (p.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
        starting_price: p.starting_price,
        rate_rows: to_rate_rows(p.visa_table),
        extra_visa_fee: p.extra_visa_fee ?? 0,
        tier_rows: to_tier_rows(p.visa_tiers),
        highlights: p.highlights ?? '',
    };

    if (isV2) {
        return {
            ...common,
            pricing_model: p.pricing_model as PricingV2Draft['pricing_model'],
            flat_amount: p.flat_amount ?? (p.pricing_model === 'visa_tiered' ? p.license : 0) ?? 0,
            flat_fee_recurrence: p.flat_fee_recurrence ?? 'one_time',
            fixed_packages: p.fixed_packages?.length
                ? p.fixed_packages.map(pkg => ({
                      key: pkg.key ?? slugifyKey(pkg.label),
                      label: pkg.label,
                      price: pkg.price,
                      quantities: pkg.quantities ?? {},
                  }))
                : defaults.fixed_packages,
            components: (p.components ?? []).map(normalizeComponent),
            tax: p.tax ?? defaults.tax,
        };
    }

    return {
        ...common,
        pricing_model: v1_model_map[p.pricing_model] ?? 'flat',
        flat_amount: p.pricing_model === 'tiered' ? p.license ?? 0 : 0,
        flat_fee_recurrence: 'one_time',
        fixed_packages: p.fixed_packages?.length
            ? p.fixed_packages.map(pkg => {
                  const quantities: Record<string, number> =
                      (pkg.visas ?? 0) > 0 ? { visas: pkg.visas as number } : {};

                  return {
                      key: slugifyKey(pkg.label),
                      label: pkg.label,
                      price: pkg.price,
                      quantities,
                  };
              })
            : defaults.fixed_packages,
        components: v1Components(p),
        tax: { label: 'VAT', rate: p.vat ?? 0, mode: 'exclusive' },
    };
}
