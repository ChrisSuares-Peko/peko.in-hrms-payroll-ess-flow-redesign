import {
    ComponentTypeV2,
    ComponentV2,
    PreviewSelectionsV2,
    PricingV2Draft,
} from '../../types/pricingV2';

export function slugifyKey(label: string) {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function defaultCondition() {
    return {
        enabled: false,
        source: '',
        operator: 'greater_than' as const,
        value: '',
    };
}

export function defaultComponent(type: ComponentTypeV2): ComponentV2 {
    const base = {
        key: '',
        label: '',
        taxable: true,
        recurrence: 'one_time' as const,
        conditional: defaultCondition(),
    };

    if (type === 'quantity') {
        return { ...base, type, unit: '', included: 0, min: 0, max: 10, unit_price: 0 };
    }
    if (type === 'choice') {
        return { ...base, type, required: false, options: [{ key: '', label: '', price: 0 }] };
    }
    if (type === 'amount') {
        return {
            ...base,
            type,
            amount_strategy: 'brackets',
            brackets: [{ min: 0, max: 1000000, fee: 0 }],
            percent_rate: 0,
            default_amount: 0,
        };
    }
    if (type === 'fee') {
        return { ...base, type, fee_strategy: 'flat', price: 0, percent_rate: 0 };
    }

    return { ...base, type, price: 0 };
}

export function visasComponent(): ComponentV2 {
    return {
        ...defaultComponent('quantity'),
        key: 'visas',
        label: 'Visas',
        unit: 'visa',
    };
}

export function getDefaultV2Draft(): PricingV2Draft {
    return {
        name: '',
        description: '',
        country: '',
        company_type: '',
        freezone: '',
        currency: '',
        status: 'active',
        starting_price: undefined,
        pricing_model: 'flat',
        flat_amount: 0,
        flat_fee_recurrence: 'one_time',
        fixed_packages: [{ key: '', label: '', price: 0, quantities: {} }],
        rate_rows: [{ qty: 0, price: 0 }],
        extra_visa_fee: 0,
        tier_rows: [{ min: 1, max: 10, unit_price: 0 }],
        components: [],
        tax: { label: 'VAT', rate: 0, mode: 'exclusive' },
        highlights: '',
    };
}

export function getDefaultSelections(draft: PricingV2Draft): PreviewSelectionsV2 {
    const quantities: Record<string, number> = {};
    const choices: Record<string, string | null> = {};
    const toggles: Record<string, boolean> = {};
    const amounts: Record<string, number> = {};

    draft.components.forEach(component => {
        if (!component.key) return;

        if (component.type === 'quantity') {
            // `included` (free units bundled) must never leave the default below
            // `min` (the fewest a buyer may select) — otherwise the previewed
            // default silently understates what's actually owed.
            quantities[component.key] = Math.max(component.included ?? 0, component.min ?? 0);
        }
        if (component.type === 'choice') {
            choices[component.key] = component.required
                ? component.options?.[0]?.key ?? null
                : null;
        }
        if (component.type === 'toggle') {
            toggles[component.key] = false;
        }
        if (component.type === 'amount') {
            amounts[component.key] = component.default_amount ?? 0;
        }
    });

    // Visa models: the visas count drives the base price, so it must default to
    // the lowest priced count in the table/tiers — not the auto-managed visas
    // component's included (0), which would otherwise land on a rate-table gap.
    // Computed unconditionally so a component-loop `included`/`min` can't win.
    if (draft.pricing_model === 'visa_table') {
        const keys = draft.rate_rows.map(r => Number(r.qty)).filter(n => !Number.isNaN(n));

        if (keys.length) quantities.visas = Math.min(...keys);
    }
    if (draft.pricing_model === 'visa_tiered') {
        const mins = draft.tier_rows.map(t => Number(t.min)).filter(n => !Number.isNaN(n));

        if (mins.length) quantities.visas = Math.min(...mins);
    }

    return {
        package_key: draft.pricing_model === 'fixed' ? draft.fixed_packages[0]?.key : undefined,
        quantities,
        choices,
        toggles,
        amounts,
    };
}
