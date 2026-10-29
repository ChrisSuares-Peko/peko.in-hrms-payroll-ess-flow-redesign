import React, { useMemo, useState } from 'react';

import { Alert, Button, Flex, InputNumber, Modal, Radio, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { isBasicSalaryCompliant } from '../../../utils/ctcCalculator/isBasicSalaryCompliant';
import { CtcBreakdown, CtcEarningComponent } from '../../../utils/ctcCalculator/types';

const { Text } = Typography;

const fmtRupees = (amount: number) =>
    `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

interface EditBasicSalaryModalProps {
    open: boolean;
    breakdown: CtcBreakdown;
    isLoading?: boolean;
    onCancel: () => void;
    // Returns `true` on success (modal closes) or an error message string to show inline.
    onSave: (payload: {
        calculationType: 'FIXED' | 'PERCENTAGE';
        amountPercentage: number;
        calculationBasis?: 'GROSS_SALARY' | 'CTC';
    }) => Promise<true | string>;
}

interface EffectiveRule {
    calculationType?: string;
    calculationBasis?: string;
    calculationBasedOn?: string;
    calculationBasedOnName?: string | null;
    amountPercentage?: number;
}

// The rule to actually resolve a component with — its globalRule (the org's live
// template, e.g. HRA "50% of Basic") when it overrides one, falling back to its own
// definition otherwise. Real hired employees have HRA frozen as a FIXED snapshot at
// hire, so resolving against the component's own definition would leave it unchanged
// when Basic moves — re-deriving from the org's rule instead matches exactly what
// redistributeBasicSalary (payroll/src/models/use-cases/salaryComponent.js) now persists.
const effectiveRule = (component: CtcEarningComponent): EffectiveRule =>
    component.globalRule || {
        calculationType: component.calculationType,
        calculationBasis: component.calculationBasis,
        calculationBasedOn: component.calculationBasedOn,
        amountPercentage: component.amountPercentage,
    };

const previewRedistribution = (
    earnings: CtcEarningComponent[],
    newBasicAmount: number,
    grossSalary: number,
    monthlyCtc: number
) => {
    const basicComponent = earnings.find(e => e.componentName === 'Basic Salary');
    const balancingComponent = earnings.find(e => e.calculationType === 'BALANCING');
    if (!basicComponent || !balancingComponent) return null;

    const amountCache = new Map<string, number>([[basicComponent.id, newBasicAmount]]);
    const resolve = (component?: CtcEarningComponent): number => {
        if (!component) return 0;
        if (amountCache.has(component.id)) return amountCache.get(component.id) as number;
        const rule = effectiveRule(component);
        let amount = 0;
        if (rule.calculationType === 'FIXED') {
            amount = rule.amountPercentage || 0;
        } else if (rule.calculationType === 'PERCENTAGE') {
            if (rule.calculationBasis === 'CTC') {
                amount = ((rule.amountPercentage || 0) / 100) * monthlyCtc;
            } else if (rule.calculationBasis === 'BASIC_SALARY') {
                amount = ((rule.amountPercentage || 0) / 100) * newBasicAmount;
            } else if (rule.calculationBasis === 'GROSS_SALARY') {
                amount = ((rule.amountPercentage || 0) / 100) * grossSalary;
            } else {
                // Both the templated (globalRule.calculationBasedOnName) and standalone
                // (component's own calculationBasedOn) shapes now resolve their COMPONENT-
                // basis reference to a stable componentName, never a raw id — see
                // mergeComponents.js/reviseSalary.js's earnings-construction, which always
                // resolves it before this ever reaches the frontend.
                const base = earnings.find(
                    o =>
                        o.componentName === (rule.calculationBasedOnName || rule.calculationBasedOn)
                );
                amount = ((rule.amountPercentage || 0) / 100) * resolve(base);
            }
        }
        amountCache.set(component.id, amount);
        return amount;
    };

    const nonBalancing = earnings.filter(
        e => e.calculationType !== 'BALANCING' && e !== basicComponent
    );
    const resolved = nonBalancing.map(e => ({ component: e, amount: resolve(e) }));
    const othersTotal = resolved.reduce((sum, r) => sum + r.amount, 0);
    // Mirrors the backend's `availableForBasic` (redistributeBasicSalary) — Gross minus every
    // other earning, i.e. what's left to split between Basic and the Balancing component.
    const available = grossSalary - othersTotal;
    const specialAllowance = available - newBasicAmount;

    // HRA is the one percentage-of-Basic earning called out explicitly (matching the
    // product's exact copy — "HRA (50% of Basic) becomes ₹X / month with it.") — any other
    // %-of-Basic components (e.g. a Medical Allowance) still correctly feed into
    // specialAllowance above, just without their own callout line. Checked via its
    // EFFECTIVE rule so a frozen-FIXED HRA that overrides a %-of-Basic template still
    // shows here, matching what actually gets persisted. A "% of Basic" rule can arrive
    // as either calculationBasis: 'BASIC_SALARY' directly, or as calculationBasis:
    // 'COMPONENT' with calculationBasedOnName pointing at "Basic Salary" (how a global
    // template expresses "50% of Basic" via the general COMPONENT-basis mechanism) — both
    // mean the same thing here, so both are recognized.
    const hra = resolved.find(r => {
        if (r.component.componentName !== 'House Rent Allowance') return false;
        const rule = effectiveRule(r.component);
        if (rule.calculationType !== 'PERCENTAGE') return false;
        return (
            rule.calculationBasis === 'BASIC_SALARY' ||
            rule.calculationBasedOnName === 'Basic Salary'
        );
    });
    const hraPercentage = hra ? effectiveRule(hra.component).amountPercentage : undefined;

    return {
        hra,
        hraPercentage,
        specialAllowance,
        available,
        balancingName: balancingComponent.componentName,
    };
};

// The two percentage modes differ only in their base — Gross (which this edit holds fixed)
// or the employee's committed monthly CTC.
type Mode = 'GROSS_SALARY' | 'CTC' | 'FIXED';

const initialModeFor = (rule: EffectiveRule): Mode => {
    if (rule.calculationType !== 'PERCENTAGE') return 'FIXED';
    if (rule.calculationBasis === 'CTC') return 'CTC';
    return rule.calculationBasis === 'GROSS_SALARY' ? 'GROSS_SALARY' : 'FIXED';
};

const EditBasicSalaryModal = ({
    open,
    breakdown,
    isLoading = false,
    onCancel,
    onSave,
}: EditBasicSalaryModalProps) => {
    const basicComponent = breakdown.earnings.find(e => e.componentName === 'Basic Salary');
    // The Balancing component's name is configurable (e.g. "Other Allowances" instead of
    // the default "Special Allowance") — read it from the actual structure.
    const balancingName =
        breakdown.earnings.find(e => e.calculationType === 'BALANCING')?.componentName ||
        'Special Allowance';
    // What mode this modal OPENS in must reflect what the employee's Basic is actually
    // set to right now (its own stored calculationType/basis) — NOT effectiveRule, which
    // deliberately prefers the org's live global template for the redistribution PREVIEW
    // below. Using effectiveRule here would default the toggle to "Percentage of Gross"
    // just because the org's template happens to be percentage-based, even when this
    // employee was explicitly set to Fixed in a previous edit.
    const initialRule: EffectiveRule = basicComponent
        ? {
              calculationType: basicComponent.calculationType,
              calculationBasis: basicComponent.calculationBasis,
              amountPercentage: basicComponent.amountPercentage,
          }
        : {};
    const initialMode = initialModeFor(initialRule);

    const [mode, setMode] = useState<Mode>(initialMode);
    const [percentValue, setPercentValue] = useState<number | null>(
        initialMode !== 'FIXED' ? (initialRule.amountPercentage ?? 50) : 50
    );
    const [fixedValue, setFixedValue] = useState<number | null>(breakdown.basicSalary || null);
    const [error, setError] = useState<string | null>(null);

    const isPercentage = mode !== 'FIXED';
    // annualCTC is the committed (agreed) CTC — same base the backend resolves against.
    const monthlyCtc = breakdown.annualCTC / 12;
    const percentageBase = mode === 'CTC' ? monthlyCtc : breakdown.grossSalary;
    const amount = isPercentage ? percentValue : fixedValue;
    let newBasicAmount = null;
    if (amount !== null) {
        newBasicAmount = isPercentage ? ((amount || 0) / 100) * percentageBase : amount;
    }

    const preview = useMemo(() => {
        if (newBasicAmount === null) return null;
        return previewRedistribution(
            breakdown.earnings,
            newBasicAmount,
            breakdown.grossSalary,
            monthlyCtc
        );
    }, [newBasicAmount, breakdown.earnings, breakdown.grossSalary, monthlyCtc]);

    // Below 50% of Gross is a compliance concern, not something to block saving over —
    // matches the CTC Calculator/Revise Salary preview's identical non-blocking warning
    // (calculateCtcBreakdown.ts) so all four edit-Basic-Salary surfaces agree. Checked
    // against the just-ENTERED rule first (see isBasicSalaryCompliant's doc comment) —
    // "50% of Gross" can never be non-compliant, whatever newBasicAmount rounds to — nor
    // can "50% of CTC", since Gross never exceeds CTC.
    const belowFloorWarning =
        newBasicAmount !== null &&
        !isBasicSalaryCompliant(
            newBasicAmount,
            breakdown.grossSalary,
            isPercentage ? (amount ?? undefined) : undefined
        )
            ? 'The Basic Salary is below 50% of Gross. You may not be compliant as per the labor codes. Please double check before proceeding.'
            : null;

    // The Balancing component (Special/Other Allowance) must never go negative — block
    // Save client-side too, rather than relying solely on the backend's rejection, so the
    // error shows up before a round trip. Mirrors EditEarningComponentModal's fitError.
    const fitError =
        preview && preview.specialAllowance < 0
            ? `This doesn't fit: after Basic and the other components, only ${fmtRupees(
                  Math.max(0, preview.available)
              )} / month of this CTC is left. Reduce the percentage, or increase the Gross.`
            : null;

    const handleSave = async () => {
        if (amount === null || fitError) return;
        const result = await onSave(
            mode === 'FIXED'
                ? { calculationType: 'FIXED', amountPercentage: amount }
                : {
                      calculationType: 'PERCENTAGE',
                      amountPercentage: amount,
                      calculationBasis: mode,
                  }
        );
        if (result === true) {
            onCancel();
        } else {
            setError(result);
        }
    };

    return (
        <Modal
            title="Edit Basic Salary"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    loading={isLoading}
                    disabled={amount === null || !!fitError}
                    onClick={handleSave}
                >
                    Save
                </Button>,
            ]}
        >
            <Flex vertical gap={12} className="py-2">
                <Text className="text-xs" style={{ color: '#535862' }}>
                    Gross income stays fixed at {fmtRupees(breakdown.grossSalary)} / month —{' '}
                    {balancingName}
                    absorbs this change.
                </Text>

                <Radio.Group
                    value={mode}
                    onChange={e => {
                        setMode(e.target.value);
                        setError(null);
                    }}
                >
                    <Radio value="GROSS_SALARY">Percentage of Gross</Radio>
                    {/* No committed CTC yet (annualCTC 0) — nothing for "% of CTC" to resolve against. */}
                    <Radio value="CTC" disabled={!(monthlyCtc > 0)}>
                        Percentage of CTC
                    </Radio>
                    <Radio value="FIXED">Fixed amount</Radio>
                </Radio.Group>

                {isPercentage ? (
                    <InputNumber
                        className="w-full"
                        min={0}
                        max={100}
                        controls={false}
                        suffix={mode === 'CTC' ? '% of CTC' : '% of Gross'}
                        value={percentValue}
                        onChange={value => {
                            setPercentValue(value);
                            setError(null);
                        }}
                    />
                ) : (
                    <InputNumber
                        className="w-full"
                        prefix={<span className="text-textGreyColor text-sm pr-1">₹</span>}
                        min={0}
                        value={fixedValue}
                        onChange={value => {
                            setFixedValue(value);
                            setError(null);
                        }}
                    />
                )}

                {newBasicAmount !== null && (
                    <Text className="text-xs" style={{ color: '#535862' }}>
                        Basic Salary becomes {fmtRupees(newBasicAmount)} / month
                        {isPercentage
                            ? ` and will follow ${mode === 'CTC' ? 'CTC' : 'Gross'} automatically from now on.`
                            : '.'}
                    </Text>
                )}
                {preview?.hra && !fitError && (
                    <Text className="text-xs" style={{ color: '#535862' }}>
                        HRA ({preview.hraPercentage}% of Basic) becomes{' '}
                        {fmtRupees(preview.hra.amount)} / month with it.
                    </Text>
                )}
                {preview && !fitError && (
                    <Text className="text-xs" style={{ color: '#535862' }}>
                        {preview.balancingName} becomes {fmtRupees(preview.specialAllowance)} /
                        month.
                    </Text>
                )}
                {belowFloorWarning && <Alert type="warning" showIcon message={belowFloorWarning} />}
                {fitError && <Alert type="error" showIcon message={fitError} />}
                {error && (
                    <Text type="danger" className="text-sm">
                        {error}
                    </Text>
                )}
            </Flex>
        </Modal>
    );
};

export default EditBasicSalaryModal;
