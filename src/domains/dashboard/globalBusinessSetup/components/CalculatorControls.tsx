import { Checkbox, Col, Flex, InputNumber, Row, Typography } from 'antd';

import SectionLabel from './getStarted/SectionLabel';
import SelectableCard from './getStarted/SelectableCard';
import Stepper from './getStarted/Stepper';
import { ComponentV2, PreviewSelectionsV2, PricingV2Draft } from '../types/pricingV2';
import { formatMoney } from '../utils/pricingCalc';
import { isComponentVisible } from '../utils/pricingV2/engine';

// A quantity renders an editable control only if it's the visa base (its count
// drives the base price) or it has a per-unit price for extras. A quantity fixed
// by the package / included baseline shows no control.
const showsQuantityControl = (draft: PricingV2Draft, c: ComponentV2) => {
    const isVisaBase =
        c.key === 'visas' &&
        (draft.pricing_model === 'visa_table' || draft.pricing_model === 'visa_tiered');
    return isVisaBase || (c.unit_price ?? 0) > 0;
};

const quantityBounds = (pricing: PricingV2Draft, c: ComponentV2) => {
    const isVisaBase =
        c.key === 'visas' &&
        (pricing.pricing_model === 'visa_table' || pricing.pricing_model === 'visa_tiered');
    let tableFloor: number | undefined;
    let tableCap: number | undefined;

    if (isVisaBase && pricing.pricing_model === 'visa_table' && pricing.rate_rows.length) {
        const qtys = pricing.rate_rows.map(r => Number(r.qty) || 0);

        tableFloor = Math.min(...qtys);
        if (!pricing.extra_visa_fee) tableCap = Math.max(...qtys);
    }
    if (isVisaBase && pricing.pricing_model === 'visa_tiered' && pricing.tier_rows.length) {
        tableFloor = Math.min(...pricing.tier_rows.map(t => Number(t.min) || 0));
    }

    const min = Math.max(c.min ?? 0, tableFloor ?? 0);
    const max = tableCap !== undefined ? Math.min(c.max ?? Infinity, tableCap) : c.max;

    return { min, max };
};

// The read-only value shown for a form-bound (locked) component.
const boundValueLabel = (c: ComponentV2, selections: PreviewSelectionsV2): string => {
    if (c.type === 'toggle') return selections.toggles[c.key] ? 'Yes' : 'No';
    if (c.type === 'amount') return String(selections.amounts[c.key] ?? 0);
    if (c.type === 'choice') {
        const opt = (c.options ?? []).find(o => o.key === selections.choices[c.key]);
        return opt ? opt.label : 'None';
    }
    return String(selections.quantities[c.key] ?? 0);
};

type Props = {
    pricing: PricingV2Draft;
    selections: PreviewSelectionsV2;
    onChange: (next: PreviewSelectionsV2) => void;
    // In the application-form context, components driven by a form field/section
    // (form_binding) are shown read-only ("Set by the application form").
    lockBound?: boolean;
};

/**
 * Renders the pricing configuration controls generically from the V2 components
 * (quantity/choice/toggle/amount; `fee` is compute-only and never shown). Every
 * control — choices included — is rendered in the admin's component order, so
 * the agent sees the setup in the sequence set on the pricing. All widgets are
 * controlled off the single `selections` object with an immutable whole-object
 * `onChange`. Ported (antd) from the vendor's CalculatorControls.
 */
export default function CalculatorControls({ pricing, selections, onChange, lockBound }: Props) {
    const { currency } = pricing;

    const rows = pricing.components.filter(c => {
        if (!c.key || !isComponentVisible(c, pricing, selections)) return false;
        if (c.type === 'quantity') return showsQuantityControl(pricing, c);
        return c.type !== 'fee';
    });
    const hasFixedPackages = pricing.pricing_model === 'fixed' && pricing.fixed_packages.length > 1;

    const setQuantity = (key: string, v: number) =>
        onChange({ ...selections, quantities: { ...selections.quantities, [key]: v } });
    const setAmount = (key: string, v: number) =>
        onChange({
            ...selections,
            amounts: { ...selections.amounts, [key]: Number.isNaN(v) ? 0 : v },
        });
    const setToggle = (key: string, v: boolean) =>
        onChange({ ...selections, toggles: { ...selections.toggles, [key]: v } });
    const setChoice = (key: string, v: string | null) =>
        onChange({ ...selections, choices: { ...selections.choices, [key]: v } });
    const setPackage = (key: string) => onChange({ ...selections, package_key: key });

    // The read-only content for a form-bound component (label + "Set by the
    // application form" caption + current value).
    const lockedContent = (c: ComponentV2) => (
        <Flex align="center" justify="space-between" gap={12}>
            <div className="min-w-0 flex-1">
                <Typography.Text className="text-sm font-medium text-neutral-800">
                    {c.label}
                </Typography.Text>
                <Typography.Text className="block text-xs text-neutral-400 break-words">
                    Set by the application form
                    {c.form_binding?.label ? ` — ${c.form_binding.label}` : ''}
                </Typography.Text>
            </div>
            <Typography.Text className="shrink-0 whitespace-nowrap text-sm font-semibold text-neutral-700">
                {boundValueLabel(c, selections)}
            </Typography.Text>
        </Flex>
    );

    const choiceRow = (c: ComponentV2) => {
        const selectedKey = selections.choices[c.key];

        return (
            <Flex vertical gap={10}>
                <Typography.Text className="text-sm font-medium text-neutral-800">
                    {c.label}
                </Typography.Text>
                <Flex gap={12} wrap="wrap" align="stretch">
                    {!c.required && (
                        <SelectableCard
                            selected={selectedKey == null}
                            onClick={() => setChoice(c.key, null)}
                            padding="14px 18px"
                        >
                            <Typography.Text className="text-sm font-semibold text-neutral-900">
                                None
                            </Typography.Text>
                        </SelectableCard>
                    )}
                    {(c.options ?? []).map(o => (
                        <SelectableCard
                            key={o.key}
                            selected={selectedKey === o.key}
                            onClick={() => setChoice(c.key, o.key)}
                            padding="14px 18px"
                        >
                            <Flex vertical gap={2}>
                                <Typography.Text className="text-sm font-semibold text-neutral-900">
                                    {o.label}
                                </Typography.Text>
                                <Typography.Text className="text-xs text-neutral-600">
                                    {formatMoney(o.price, currency)}
                                </Typography.Text>
                            </Flex>
                        </SelectableCard>
                    ))}
                </Flex>
            </Flex>
        );
    };

    const renderRow = (c: ComponentV2) => {
        if (lockBound && c.form_binding) return lockedContent(c);

        if (c.type === 'choice') return choiceRow(c);

        if (c.type === 'quantity') {
            const included = c.included ?? 0;
            const { min, max } = quantityBounds(pricing, c);

            return (
                <Flex align="center" justify="space-between" gap={12}>
                    <Typography.Text className="text-sm text-neutral-800">
                        {included > 0 ? `${c.label} (${included} included)` : c.label}
                    </Typography.Text>
                    <Stepper
                        value={selections.quantities[c.key] ?? 0}
                        min={min}
                        max={max}
                        onChange={v => setQuantity(c.key, v)}
                    />
                </Flex>
            );
        }

        if (c.type === 'amount') {
            return (
                <Flex align="center" justify="space-between" gap={12}>
                    <Typography.Text className="text-sm text-neutral-800">
                        {c.label}
                    </Typography.Text>
                    <InputNumber
                        className="w-40"
                        min={0}
                        value={selections.amounts[c.key] ?? 0}
                        onChange={v => setAmount(c.key, Number(v))}
                    />
                </Flex>
            );
        }

        return (
            <Checkbox
                checked={!!selections.toggles[c.key]}
                onChange={e => setToggle(c.key, e.target.checked)}
            >
                <Typography.Text className="text-sm text-neutral-800">
                    {c.label} (+{formatMoney(c.price ?? 0, currency)}
                    {c.recurrence === 'annual' ? '/yr' : ''})
                </Typography.Text>
            </Checkbox>
        );
    };

    return (
        <Flex vertical gap={20}>
            {hasFixedPackages && (
                <Flex vertical gap={12}>
                    <SectionLabel>Select Package</SectionLabel>
                    <Row gutter={[12, 12]}>
                        {pricing.fixed_packages.map(pkg => (
                            <Col xs={24} md={12} key={pkg.key}>
                                <SelectableCard
                                    selected={selections.package_key === pkg.key}
                                    onClick={() => setPackage(pkg.key)}
                                    padding="16px 20px"
                                >
                                    <Flex vertical gap={4}>
                                        <Typography.Text className="text-sm font-semibold text-neutral-900">
                                            {pkg.label}
                                        </Typography.Text>
                                        <Typography.Text className="text-base font-semibold text-neutral-900">
                                            {formatMoney(pkg.price, currency)}
                                        </Typography.Text>
                                    </Flex>
                                </SelectableCard>
                            </Col>
                        ))}
                    </Row>
                </Flex>
            )}

            {rows.length > 0 && (
                <Flex vertical gap={12}>
                    <SectionLabel>Configure Your Setup</SectionLabel>
                    <div className="rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                        {rows.map(c => (
                            <div key={c.key} className="px-4 py-3">
                                {renderRow(c)}
                            </div>
                        ))}
                    </div>
                </Flex>
            )}
        </Flex>
    );
}
