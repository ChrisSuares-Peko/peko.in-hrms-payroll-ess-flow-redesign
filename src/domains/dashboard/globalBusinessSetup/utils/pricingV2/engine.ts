import { getDefaultSelections } from './defaults';
import {
    BreakdownLineV2,
    BreakdownV2,
    ComponentConditionV2,
    ComponentV2,
    PreviewSelectionsV2,
    PricingV2Draft,
} from '../../types/pricingV2';

function sourceValue(draft: PricingV2Draft, selections: PreviewSelectionsV2, key: string) {
    const component = draft.components.find(c => c.key === key);

    if (!component) return undefined;
    if (component.type === 'quantity') return selections.quantities[key];
    if (component.type === 'choice') return selections.choices[key];
    if (component.type === 'amount') return selections.amounts?.[key];

    return selections.toggles[key];
}

export function isComponentVisible(
    component: ComponentV2,
    draft: PricingV2Draft,
    selections: PreviewSelectionsV2
) {
    const condition: ComponentConditionV2 = component.conditional;

    if (!condition?.enabled || !condition.source) return true;

    const source = sourceValue(draft, selections, condition.source);

    if (source === undefined) return false;

    const left = typeof source === 'boolean' ? Number(source) : Number(source);
    const right =
        condition.value === 'true' || condition.value === 'false'
            ? Number(condition.value === 'true')
            : Number(condition.value);

    switch (condition.operator) {
        case 'equals':
            return String(source) === condition.value || left === right;
        case 'not_equals':
            return String(source) !== condition.value && left !== right;
        case 'greater_than':
            return left > right;
        case 'less_than':
            return left < right;
        case 'greater_than_equals':
            return left >= right;
        case 'less_than_equals':
            return left <= right;
        default:
            return true;
    }
}

function baseLines(draft: PricingV2Draft, selections: PreviewSelectionsV2) {
    const lines: BreakdownLineV2[] = [];
    const warnings: string[] = [];
    const visas = selections.quantities.visas ?? 0;

    if (draft.flat_amount) {
        lines.push({
            label: draft.pricing_model === 'visa_tiered' ? 'License fee' : 'Base fee',
            amount: draft.flat_amount,
            taxable: true,
            recurrence: draft.flat_fee_recurrence ?? 'one_time',
        });
    }

    if (draft.pricing_model === 'fixed') {
        const pkg = draft.fixed_packages.find(p => p.key === selections.package_key);

        if (pkg) {
            lines.push({
                label: pkg.label || 'Package',
                amount: pkg.price,
                taxable: true,
                recurrence: 'one_time',
            });
        } else {
            warnings.push('No package selected');
        }
    }

    if (draft.pricing_model === 'visa_table') {
        const row = draft.rate_rows.find(r => Number(r.qty) === visas);
        const maxRow = [...draft.rate_rows].sort((a, b) => b.qty - a.qty)[0];

        if (row) {
            lines.push({
                label: `Base (${visas} visa${visas === 1 ? '' : 's'})`,
                amount: row.price,
                taxable: true,
                recurrence: 'one_time',
            });
        } else if (maxRow && visas > maxRow.qty && draft.extra_visa_fee) {
            const amount = maxRow.price + (visas - maxRow.qty) * draft.extra_visa_fee;

            lines.push({
                label: `Base (${visas} visas)`,
                amount,
                taxable: true,
                recurrence: 'one_time',
            });
        } else {
            warnings.push(`No price for ${visas} visas — rate table gap`);
        }
    }

    if (draft.pricing_model === 'visa_tiered') {
        if (visas > 0) {
            const tier = draft.tier_rows.find(t => visas >= t.min && visas <= t.max);

            if (tier) {
                lines.push({
                    label: `Visas (${visas} × tier rate)`,
                    amount: tier.unit_price * visas,
                    taxable: true,
                    recurrence: 'one_time',
                });
            } else {
                warnings.push(`No tier covers ${visas} visas — tier gap`);
            }
        }
    }

    return { lines, warnings };
}

function includedFor(draft: PricingV2Draft, selections: PreviewSelectionsV2, key: string) {
    if (draft.pricing_model === 'fixed') {
        const pkg = draft.fixed_packages.find(p => p.key === selections.package_key);
        const fromPkg = pkg?.quantities?.[key];

        if (fromPkg !== undefined && fromPkg !== null) return Number(fromPkg);
    }

    return draft.components.find(c => c.key === key)?.included ?? 0;
}

export function computeV2Breakdown(
    draft: PricingV2Draft,
    selections: PreviewSelectionsV2
): BreakdownV2 {
    const base = baseLines(draft, selections);
    const lines = [...base.lines];
    const warnings = [...base.warnings];

    draft.components.forEach(component => {
        if (!component.key || !isComponentVisible(component, draft, selections)) return;

        const isVisaBase =
            component.key === 'visas' &&
            (draft.pricing_model === 'visa_table' || draft.pricing_model === 'visa_tiered');

        if (component.type === 'quantity' && !isVisaBase) {
            const selected = selections.quantities[component.key] ?? 0;
            const extra = Math.max(0, selected - includedFor(draft, selections, component.key));

            if (extra > 0) {
                if (component.unit_price) {
                    lines.push({
                        label: `Extra ${component.label.toLowerCase()} (${extra} × ${component.unit_price})`,
                        amount: extra * component.unit_price,
                        taxable: component.taxable,
                        recurrence: component.recurrence ?? 'one_time',
                    });
                } else {
                    warnings.push(
                        `${component.label}: ${extra} extra unit(s) have no per-unit price`
                    );
                }
            }
        }

        if (component.type === 'choice') {
            const selectedKey = selections.choices[component.key];
            const option = component.options?.find(o => o.key === selectedKey);

            if (option) {
                lines.push({
                    label: `${component.label} — ${option.label}`,
                    amount: option.price,
                    taxable: component.taxable,
                    recurrence: component.recurrence ?? 'one_time',
                });
            } else if (component.required) {
                warnings.push(`${component.label}: selection required`);
            }
        }

        if (component.type === 'toggle' && selections.toggles[component.key]) {
            lines.push({
                label: component.label,
                amount: component.price ?? 0,
                taxable: component.taxable,
                recurrence: component.recurrence ?? 'one_time',
            });
        }

        if (component.type === 'amount') {
            const value = selections.amounts?.[component.key] ?? 0;

            if (value > 0) {
                if (component.amount_strategy === 'percent') {
                    let fee = value * (component.percent_rate ?? 0);

                    if (component.min_fee) fee = Math.max(fee, component.min_fee);
                    if (component.max_fee) fee = Math.min(fee, component.max_fee);
                    if (fee > 0) {
                        lines.push({
                            label: `${component.label} (${((component.percent_rate ?? 0) * 100).toFixed(2)}% of ${value})`,
                            amount: fee,
                            taxable: component.taxable,
                            recurrence: component.recurrence ?? 'one_time',
                        });
                    }
                } else {
                    const bracket = (component.brackets ?? []).find(
                        b => value >= b.min && value <= b.max
                    );

                    if (bracket) {
                        lines.push({
                            label: `${component.label} (${value})`,
                            amount: bracket.fee,
                            taxable: component.taxable,
                            recurrence: component.recurrence ?? 'one_time',
                        });
                    } else {
                        warnings.push(`${component.label}: no bracket covers ${value}`);
                    }
                }
            }
        }
    });

    // Fee components run after everything else so percent_of_subtotal has its base.
    const subtotalBeforeFees = lines.reduce((sum, l) => sum + l.amount, 0);

    draft.components.forEach(component => {
        if (
            component.type !== 'fee' ||
            !component.key ||
            !isComponentVisible(component, draft, selections)
        ) {
            return;
        }

        if (component.fee_strategy === 'percent_of_subtotal') {
            let fee = subtotalBeforeFees * (component.percent_rate ?? 0);

            if (component.min_fee) fee = Math.max(fee, component.min_fee);
            if (component.max_fee) fee = Math.min(fee, component.max_fee);
            if (fee > 0) {
                lines.push({
                    label: `${component.label} (${((component.percent_rate ?? 0) * 100).toFixed(2)}% of subtotal)`,
                    amount: fee,
                    taxable: component.taxable,
                    recurrence: component.recurrence ?? 'one_time',
                });
            }
        } else if (component.price) {
            lines.push({
                label: component.label,
                amount: component.price,
                taxable: component.taxable,
                recurrence: component.recurrence ?? 'one_time',
            });
        }
    });

    const taxableSubtotal = lines.filter(l => l.taxable).reduce((sum, l) => sum + l.amount, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
    const rate = draft.tax?.rate ?? 0;
    const isExclusive = draft.tax?.mode === 'exclusive';
    const tax_amount = isExclusive ? taxableSubtotal * rate : 0;

    const annualLines = lines.filter(l => l.recurrence === 'annual');
    const annualSubtotal = annualLines.reduce((sum, l) => sum + l.amount, 0);
    const annualTaxable = annualLines.filter(l => l.taxable).reduce((sum, l) => sum + l.amount, 0);
    const annual_total = annualSubtotal + (isExclusive ? annualTaxable * rate : 0);

    return { lines, warnings, tax_amount, total: subtotal + tax_amount, annual_total };
}

// The lowest total a buyer must pay: cheapest package, cheapest required choice
// options, quantities at their included baseline, optional add-ons off. Used for
// the "Starting from" figure.
export function computeStartingPrice(draft: PricingV2Draft): number {
    const selections = getDefaultSelections(draft);

    if (draft.pricing_model === 'fixed') {
        const cheapest = draft.fixed_packages
            .filter(p => p.key)
            .sort((a, b) => a.price - b.price)[0];

        if (cheapest) selections.package_key = cheapest.key;
    }

    draft.components.forEach(component => {
        if (component.type === 'choice' && component.required && component.options?.length) {
            const cheapest = [...component.options].sort((a, b) => a.price - b.price)[0];

            if (cheapest) selections.choices[component.key] = cheapest.key;
        }
    });

    return computeV2Breakdown(draft, selections).total;
}
