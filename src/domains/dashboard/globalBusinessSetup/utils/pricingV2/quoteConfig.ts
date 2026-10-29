import { getDefaultSelections } from './defaults';
import { PreviewSelectionsV2, PricingV2Draft } from '../../types/pricingV2';

export type QuoteConfigValues = {
    visa: number;
    activity: number;
    shareholder: number;
    selected_pkg?: number | null;
    office_idx?: number | null;
    general_trading?: boolean;
    est_card_idx?: number | null;
    selections?: PreviewSelectionsV2;
};

const findComponent = (pricing: PricingV2Draft, key: string) =>
    pricing.components.find(c => c.key === key);

function resolvePackageKey(
    pricing: PricingV2Draft,
    quoteConfig: Partial<QuoteConfigValues>,
    defaultKey?: string
): string | undefined {
    const embedded = quoteConfig.selections?.package_key;
    if (embedded != null && pricing.fixed_packages.some(p => p.key === embedded)) return embedded;
    if (quoteConfig.selected_pkg != null) {
        const byIndex = pricing.fixed_packages[Number(quoteConfig.selected_pkg)];
        if (byIndex) return byIndex.key;
    }
    return defaultKey;
}

export function selectionsFromQuoteConfig(
    pricing: PricingV2Draft,
    quoteConfig?: Partial<QuoteConfigValues>
): PreviewSelectionsV2 {
    const selections = getDefaultSelections(pricing);

    if (!quoteConfig) return selections;

    if (quoteConfig.selections) {
        return {
            package_key: resolvePackageKey(pricing, quoteConfig, selections.package_key),
            quantities: { ...selections.quantities, ...quoteConfig.selections.quantities },
            choices: { ...selections.choices, ...quoteConfig.selections.choices },
            toggles: { ...selections.toggles, ...quoteConfig.selections.toggles },
            amounts: { ...selections.amounts, ...quoteConfig.selections.amounts },
        };
    }

    if (quoteConfig.selected_pkg != null && pricing.fixed_packages.length) {
        const pkg = pricing.fixed_packages[Number(quoteConfig.selected_pkg)];

        if (pkg) selections.package_key = pkg.key;
    }

    const quantityMap: Record<string, number | undefined> = {
        visas: quoteConfig.visa,
        activities: quoteConfig.activity,
        shareholders: quoteConfig.shareholder,
    };

    Object.entries(quantityMap).forEach(([key, value]) => {
        if (value != null && (findComponent(pricing, key) || key === 'visas')) {
            selections.quantities[key] = Number(value);
        }
    });

    const office = findComponent(pricing, 'office');

    if (office) {
        if (quoteConfig.office_idx != null) {
            const option = office.options?.[Number(quoteConfig.office_idx)];

            selections.choices.office = option ? option.key : null;
        } else if (!office.required) {
            selections.choices.office = null;
        }
    }

    const estCard = findComponent(pricing, 'establishment_card');

    if (estCard && quoteConfig.est_card_idx != null) {
        const option = estCard.options?.[Number(quoteConfig.est_card_idx)];

        if (option) selections.choices.establishment_card = option.key;
    }

    if (findComponent(pricing, 'general_trading')) {
        selections.toggles.general_trading = !!quoteConfig.general_trading;
    }

    return selections;
}

export function calcValuesFromSelections(
    pricing: PricingV2Draft,
    selections: PreviewSelectionsV2
): QuoteConfigValues {
    const values: QuoteConfigValues = {
        visa: selections.quantities.visas ?? 0,
        activity: selections.quantities.activities ?? 0,
        shareholder: selections.quantities.shareholders ?? 1,
        office_idx: null,
        general_trading: !!selections.toggles.general_trading,
        selections,
    };

    if (pricing.pricing_model === 'fixed') {
        const index = pricing.fixed_packages.findIndex(p => p.key === selections.package_key);

        values.selected_pkg = index >= 0 ? index : 0;

        const pkg = pricing.fixed_packages[values.selected_pkg];

        if (pkg?.quantities?.visas != null) {
            values.visa = Math.max(pkg.quantities.visas, selections.quantities.visas ?? 0);
        }
    }

    const office = findComponent(pricing, 'office');

    if (office && selections.choices.office != null) {
        const index = (office.options ?? []).findIndex(o => o.key === selections.choices.office);

        values.office_idx = index >= 0 ? index : null;
    }

    const estCard = findComponent(pricing, 'establishment_card');

    if (estCard && selections.choices.establishment_card != null) {
        const index = (estCard.options ?? []).findIndex(
            o => o.key === selections.choices.establishment_card
        );

        if (index >= 0) values.est_card_idx = index;
    }

    return values;
}
