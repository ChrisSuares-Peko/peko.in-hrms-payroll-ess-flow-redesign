import React, { useMemo, useState } from 'react';

import { Alert, Button, Flex, InputNumber, Modal, Radio, Select, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { CtcBreakdown, CtcEarningComponent } from '../../../utils/ctcCalculator/types';

const { Text } = Typography;

const fmtRupees = (amount: number) =>
    `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

interface EffectiveRule {
    calculationType?: string;
    calculationBasis?: string;
    calculationBasedOnName?: string | null;
    amountPercentage?: number;
}

type Mode = 'PERCENTAGE' | 'FIXED';
type Basis = 'GROSS_SALARY' | 'BASIC_SALARY' | 'CTC';

const isPercentageRule = (rule: EffectiveRule) =>
    rule.calculationType === 'PERCENTAGE' &&
    (rule.calculationBasis === 'BASIC_SALARY' ||
        rule.calculationBasis === 'GROSS_SALARY' ||
        rule.calculationBasis === 'CTC' ||
        rule.calculationBasedOnName === 'Basic Salary');

// A component previously saved with calculationBasis: 'COMPONENT' pointing at Basic Salary
// (calculationBasedOnName) is treated as % of Basic here too — same fallback the org-level
// Salary Components form and resolveEarnings itself already apply.
const initialBasisFor = (rule: EffectiveRule): Basis =>
    rule.calculationBasis === 'GROSS_SALARY' || rule.calculationBasis === 'CTC'
        ? rule.calculationBasis
        : 'BASIC_SALARY';

const basisOptions: { label: string; value: Basis }[] = [
    { label: '% of Gross Salary', value: 'GROSS_SALARY' },
    { label: '% of Basic Salary', value: 'BASIC_SALARY' },
    { label: '% of CTC', value: 'CTC' },
];

// HRA leads with % of Basic — its near-universal convention — but can follow Gross or CTC
// like any other earning.
const hraBasisOptions: { label: string; value: Basis }[] = [
    { label: '% of Basic Salary', value: 'BASIC_SALARY' },
    { label: '% of CTC', value: 'CTC' },
    { label: '% of Gross Salary', value: 'GROSS_SALARY' },
];

const followsLabelFor = (basis: Basis) => {
    if (basis === 'CTC') return 'CTC';
    return basis === 'GROSS_SALARY' ? 'Gross' : 'Basic';
};

const percentSuffixFor = (basis: Basis) => {
    if (basis === 'CTC') return '% of CTC';
    return basis === 'GROSS_SALARY' ? '% of Gross' : '% of Basic';
};

interface EditEarningComponentModalProps {
    open: boolean;
    breakdown: CtcBreakdown;
    component: CtcEarningComponent;
    employeeName: string;
    isLoading?: boolean;
    onCancel: () => void;
    // Returns `true` on success (modal closes) or an error message string to show inline.
    onSave: (payload: {
        calculationType: Mode;
        amountPercentage: number;
        calculationBasis?: Basis;
    }) => Promise<true | string>;
}

// Redistributes THIS one component's amount while holding every other earning (other than
// Basic, which isn't changing here either) at its current value — mirrors the backend's
// redistributeEarningComponent (payroll/src/models/use-cases/salaryComponent.js) exactly,
// so the preview always matches what saving will actually persist.
const previewComponentRedistribution = (
    earnings: CtcEarningComponent[],
    targetId: string,
    newAmount: number,
    grossSalary: number,
    basicSalary: number
) => {
    const balancingComponent = earnings.find(e => e.calculationType === 'BALANCING');
    if (!balancingComponent) return null;

    const sumOfOthers = earnings
        .filter(
            e =>
                e.id !== targetId &&
                e.componentName !== 'Basic Salary' &&
                e.calculationType !== 'BALANCING' &&
                e.isPartOfGross !== false
        )
        .reduce((sum, e) => sum + e.calculatedAmount, 0);

    const available = grossSalary - basicSalary - sumOfOthers;
    const specialAllowance = available - newAmount;
    return { specialAllowance, available };
};

const EditEarningComponentModal = ({
    open,
    breakdown,
    component,
    employeeName,
    isLoading = false,
    onCancel,
    onSave,
}: EditEarningComponentModalProps) => {
    // HRA gets the same plain treatment as Basic Salary's own editor (it's core salary
    // structure, not an org-wide benefit default) — every other earning (Medical
    // Allowance, or any custom one) gets the "for this employee only" framing, since those
    // are typically configured as an HR Settings default that this edit overrides just for
    // this one employee.
    const isHRA = component.componentName === 'House Rent Allowance';

    // The Balancing component's name is configurable (e.g. "Other Allowances" instead of
    // the default "Special Allowance") — read it from the actual structure.
    const balancingName =
        breakdown.earnings.find(e => e.calculationType === 'BALANCING')?.componentName ||
        'Special Allowance';

    // What mode this modal OPENS in must reflect what this component is actually set to
    // right now (its own stored calculationType/basis) — never the org's global template's
    // rule, or the toggle would default to "Percentage of Basic" just because the org
    // template happens to be percentage-based, even when this employee was explicitly set
    // to Fixed in a previous edit.
    const initialRule: EffectiveRule = {
        calculationType: component.calculationType,
        calculationBasis: component.calculationBasis,
        calculationBasedOnName:
            component.calculationBasedOn === 'Basic Salary' ? 'Basic Salary' : undefined,
        amountPercentage: component.amountPercentage,
    };
    const initialMode: Mode = isPercentageRule(initialRule) ? 'PERCENTAGE' : 'FIXED';
    const initialBasis: Basis = initialBasisFor(initialRule);

    const [mode, setMode] = useState<Mode>(initialMode);
    const [basis, setBasis] = useState<Basis>(initialBasis);
    const [percentValue, setPercentValue] = useState<number | null>(
        initialMode === 'PERCENTAGE' ? (initialRule.amountPercentage ?? 0) : 50
    );
    const [fixedValue, setFixedValue] = useState<number | null>(component.calculatedAmount);
    const [error, setError] = useState<string | null>(null);

    const amount = mode === 'PERCENTAGE' ? percentValue : fixedValue;
    // The committed (agreed) monthly CTC — annualCTC, not costToCompany, which can carry
    // on-top extras (see ctcCalculator.js's annualCtc comment). Matches the backend's base.
    let percentageBaseAmount = breakdown.basicSalary;
    if (basis === 'GROSS_SALARY') percentageBaseAmount = breakdown.grossSalary;
    else if (basis === 'CTC') percentageBaseAmount = breakdown.annualCTC / 12;
    const percentSuffix = percentSuffixFor(basis);

    const preview = useMemo(() => {
        if (amount === null) return null;
        const newAmount =
            mode === 'PERCENTAGE' ? ((amount || 0) / 100) * percentageBaseAmount : amount;
        return previewComponentRedistribution(
            breakdown.earnings,
            component.id,
            newAmount,
            breakdown.grossSalary,
            breakdown.basicSalary
        );
    }, [
        amount,
        mode,
        percentageBaseAmount,
        breakdown.earnings,
        breakdown.grossSalary,
        breakdown.basicSalary,
        component.id,
    ]);

    let newComponentAmount = null;
    if (amount !== null) {
        newComponentAmount =
            mode === 'PERCENTAGE' ? ((amount || 0) / 100) * percentageBaseAmount : amount;
    }

    // The Balancing component (Special/Other Allowance) must never go negative — block
    // Save client-side too, rather than relying solely on the backend's rejection, so the
    // error shows up before a round trip.
    const fitError =
        preview && preview.specialAllowance < 0
            ? `This doesn't fit: after Basic, HRA and the other components, only ${fmtRupees(
                  Math.max(0, preview.available)
              )} / month of this CTC is left. Reduce the percentage, or increase the Gross.`
            : null;

    const handleSave = async () => {
        if (amount === null || fitError) return;
        const result = await onSave({
            calculationType: mode,
            amountPercentage: amount,
            calculationBasis: mode === 'PERCENTAGE' ? basis : undefined,
        });
        if (result === true) {
            onCancel();
        } else {
            setError(result);
        }
    };

    return (
        <Modal
            title={isHRA ? 'Edit HRA' : `Edit ${component.componentName} — for this employee only`}
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
                    {isHRA ? (
                        <>
                            Gross income stays fixed at {fmtRupees(breakdown.grossSalary)} / month —{' '}
                            {balancingName} absorbs this change.
                        </>
                    ) : (
                        <>
                            This changes {employeeName}&apos;s {component.componentName} only — the
                            HR Settings default and other employees are untouched. Gross stays fixed
                            at {fmtRupees(breakdown.grossSalary)} / month.
                        </>
                    )}
                </Text>

                <Radio.Group
                    value={mode}
                    onChange={e => {
                        setMode(e.target.value);
                        setError(null);
                    }}
                >
                    <Radio value="PERCENTAGE">Percentage</Radio>
                    <Radio value="FIXED">Fixed amount</Radio>
                </Radio.Group>

                {mode === 'PERCENTAGE' ? (
                    <>
                        <Flex vertical gap={4}>
                            <Text className="text-xs" style={{ color: '#535862' }}>
                                Calculation Basis
                            </Text>
                            <Select
                                className="w-full"
                                value={basis}
                                options={isHRA ? hraBasisOptions : basisOptions}
                                onChange={value => {
                                    setBasis(value);
                                    setError(null);
                                }}
                            />
                        </Flex>
                        <InputNumber
                            className="w-full"
                            min={0}
                            max={100}
                            controls={false}
                            suffix={percentSuffix}
                            value={percentValue}
                            onChange={value => {
                                setPercentValue(value);
                                setError(null);
                            }}
                        />
                    </>
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

                {newComponentAmount !== null &&
                    !fitError &&
                    (isHRA ? (
                        <>
                            <Text className="text-xs" style={{ color: '#535862' }}>
                                HRA becomes {fmtRupees(newComponentAmount)} / month
                                {mode === 'PERCENTAGE'
                                    ? ` and will follow ${followsLabelFor(basis)} automatically from now on.`
                                    : '.'}
                            </Text>
                            {preview && (
                                <Text className="text-xs" style={{ color: '#535862' }}>
                                    {balancingName} becomes {fmtRupees(preview.specialAllowance)} /
                                    month.
                                </Text>
                            )}
                        </>
                    ) : (
                        preview && (
                            <Text className="text-xs" style={{ color: '#535862' }}>
                                {component.componentName} becomes {fmtRupees(newComponentAmount)} /
                                month; {balancingName} becomes {fmtRupees(preview.specialAllowance)}{' '}
                                / month.
                            </Text>
                        )
                    ))}

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

export default EditEarningComponentModal;
