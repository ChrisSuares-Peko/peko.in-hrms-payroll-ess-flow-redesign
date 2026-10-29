import React, { useMemo, useState } from 'react';

import { Alert, Button, DatePicker, Flex, Input, InputNumber, Modal, Select, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { ReviseSalaryResult, SalaryRevisionHistoryEntry } from '../../../api/organizationSettings/index';
import { calculateCtcBreakdown } from '../../../utils/ctcCalculator/calculateCtcBreakdown';
import { stripPfEarningsLine } from '../../../utils/ctcCalculator/pfEarningsLine';
import { CtcBreakdown } from '../../../utils/ctcCalculator/types';
import CtcBreakdownCard from '../../ctcCalculator/CtcBreakdownCard';

const { Text } = Typography;

const fmtRupees = (amount: number) => `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

const REASON_OPTIONS = ['Annual Appraisal', 'Promotion', 'Market Correction', 'Retention', 'Role Change', 'Other'].map(
    r => ({ label: r, value: r })
);
const QUICK_RAISE_PERCENTAGES = [5, 10, 15, 20];

const WHAT_CHANGES_ACCENT = '#FF4F4F';

const WhatChangesRow = ({ label, from, to, delta }: { label: string; from: string; to: string; delta: string }) => (
    <Flex wrap="wrap" align="center" justify="space-between">
        <Text style={{ fontSize: 15 }}>{label}</Text>
        <Text className="font-semibold" style={{ fontSize: 15 }}>
            {from} → {to} <span style={{ color: WHAT_CHANGES_ACCENT }}>{delta}</span>
        </Text>
    </Flex>
);

interface ReviseSalaryModalProps {
    open: boolean;
    employeeName: string;
    breakdown: CtcBreakdown;
    // Newest-first, matching RevisionHistorySection's ordering — entries[0] is the latest
    // revision, the only one Undo can act on. Used here to block picking an effective
    // month that's already covered by it, before the user even submits.
    revisionHistory?: SalaryRevisionHistoryEntry[];
    onCancel: () => void;
    // Returns `true` on success (modal closes) or an error message string to show inline.
    onSave: (payload: { newAnnualCTC: number; effectiveMonth: number; effectiveYear: number; reason: string }) => Promise<
        ReviseSalaryResult | string
    >;
}

const ReviseSalaryModal = ({
    open,
    employeeName,
    breakdown,
    revisionHistory,
    onCancel,
    onSave,
}: ReviseSalaryModalProps) => {
    const currentAnnualCTC = breakdown.annualCTC;

    const [ctcInput, setCtcInput] = useState('');
    const [pctInput, setPctInput] = useState('0');
    const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(dayjs());
    const [reason, setReason] = useState('Annual Appraisal');
    const [customReason, setCustomReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyCtc = (value: string) => {
        setCtcInput(value);
        setError(null);
        const ctc = Number(value);
        if (ctc > 0 && currentAnnualCTC > 0) {
            setPctInput((((ctc - currentAnnualCTC) / currentAnnualCTC) * 100).toFixed(1));
        } else {
            setPctInput('0');
        }
    };

    const applyPct = (value: string) => {
        setPctInput(value);
        setError(null);
        const pct = Number(value) || 0;
        setCtcInput(String(Math.round(currentAnnualCTC * (1 + pct / 100))));
    };

    const previewBreakdown: CtcBreakdown | null = useMemo(() => {
        const ctc = Number(ctcInput);
        if (!ctc || !breakdown.epfPolicy) return null;
        // calculateCtcBreakdown re-solves each earning from its globalRule (the org's
        // current template — e.g. "Basic = 50% of Gross") when the earning carries one,
        // rather than the frozen rupee amount stored on the employee's own override.
        const solved = calculateCtcBreakdown({
            annualCTC: ctc,
            epfPolicy: breakdown.epfPolicy,
            epfApplicable: breakdown.epfApplicable,
            showPfInEarnings: breakdown.showPfInEarnings,
            // The display-only PF Earnings line is stripped (Special Allowance gets its
            // amount back) before re-solving, so it's never counted twice.
            earnings: stripPfEarningsLine(breakdown.earnings),
            deductions: breakdown.deductions,
        });
        // ESI eligibility/continuation and LWF schedule/config don't change from a CTC
        // solve — carried over from the current breakdown as-is for the preview; the
        // actual submission re-resolves both server-side against the new gross.
        return { ...solved, esi: breakdown.esi, lwf: breakdown.lwf };
    }, [ctcInput, breakdown]);

    // A revision can't land at/before the latest existing REAL revision — Undo only ever
    // restores the single latest revision, so anything earlier would leave that Undo path
    // unable to cleanly unwind. Block it here, before the user even submits.
    //
    // The initial-hire entry (previousAnnualCTC: null) is deliberately excluded from this
    // check — same filter RevisionHistorySection uses (SalaryStructureTab's
    // displayRevisionHistory) — it isn't a revision to protect an Undo chain around, it's
    // just where the employee's salary started. Without this filter, an employee whose
    // hire month equals "now" could never revise their salary at all: the guard would
    // treat their own initial hire as an unrelated prior revision blocking this month, and
    // undoLatestRevision refuses to undo an initial-hire entry (nothing to revert to),
    // making that suggested fix a dead end. Revising into an already-paid month is exactly
    // what arrears exist for (see reviseSalary.js's findAlreadyPaidCoveredMonths) — the
    // backend settles the difference in the next payroll cycle rather than needing this
    // guard to prevent it.
    const realRevisionHistory = revisionHistory?.filter(entry => entry.previousAnnualCTC != null) ?? [];
    const latestRevision = realRevisionHistory[0] ?? null;
    const conflictError = useMemo(() => {
        if (!latestRevision || !effectiveDate) return null;
        const latestEffective = dayjs(latestRevision.effectiveFrom);
        if (!effectiveDate.isAfter(latestEffective, 'month')) {
            return `${employeeName}'s salary was already revised effective ${latestEffective.format(
                'MMMM YYYY'
            )} — choose a later month, or undo that revision first.`;
        }
        return null;
    }, [latestRevision, effectiveDate, employeeName]);

    const pct = Number(pctInput) || 0;
    const grossDelta = previewBreakdown ? previewBreakdown.grossSalary - breakdown.grossSalary : null;
    const takeHomeDelta = previewBreakdown ? previewBreakdown.netTakeHome - breakdown.netTakeHome : null;

    const handleClose = () => {
        setCtcInput('');
        setPctInput('0');
        setEffectiveDate(dayjs());
        setReason('Annual Appraisal');
        setCustomReason('');
        setError(null);
        onCancel();
    };

    const handleSave = async () => {
        if (!ctcInput || !effectiveDate) return;
        setSaving(true);
        const response = await onSave({
            newAnnualCTC: Number(ctcInput),
            effectiveMonth: effectiveDate.month() + 1,
            effectiveYear: effectiveDate.year(),
            reason: reason === 'Other' ? customReason : reason,
        });
        setSaving(false);
        if (typeof response === 'string') {
            setError(response);
        } else {
            // Success is communicated via the toast onSave already fires — no in-modal
            // confirmation screen, just close straight back to the (now-updated) tab.
            handleClose();
        }
    };

    let previewSection;
    if (conflictError) {
        // A blocked month can't be revised at all, so there's nothing valid
        // to preview — showing the full structure card here would just be a
        // long scroll of numbers the user can't act on. Keep the modal short.
        previewSection = <Alert type="error" showIcon message={conflictError} />;
    } else if (previewBreakdown) {
        previewSection = (
            <Flex vertical gap={6}>
                <Flex vertical>
                    <Text className="text-sm font-semibold">New salary structure</Text>
                    <Text className="text-xs" style={{ color: '#94A3B8' }}>
                        The break-up below follows this employee&apos;s existing salary rules — only the amounts
                        change with the new CTC. To change amounts, rules or deductions, use the Salary Structure
                        tab — changes there carry into revisions automatically.
                    </Text>
                </Flex>
                <CtcBreakdownCard breakdown={previewBreakdown} lockStatutoryDeductions hideNote />
            </Flex>
        );
    } else {
        previewSection = (
            <Text className="text-xs" style={{ color: '#94A3B8' }}>
                Enter a new CTC (or use a quick-raise chip) to continue.
            </Text>
        );
    }

    return (
        <Modal
            title={`Revise Salary — ${employeeName}`}
            open={open}
            onCancel={handleClose}
            width={860}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={saving}
                    disabled={!ctcInput || !effectiveDate || !!conflictError}
                    onClick={handleSave}
                >
                    Revise Salary
                </Button>,
            ]}
        >
            <Flex vertical gap={14} className="py-2" style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 8 }}>
                <Text className="text-xs" style={{ color: '#535862' }}>
                    Current: {fmtRupees(currentAnnualCTC)} annual CTC · {fmtRupees(breakdown.grossSalary)} gross /
                    month
                </Text>

                <Flex wrap="wrap" gap={12}>
                    <Flex vertical gap={6} className="flex-1" style={{ minWidth: 220 }}>
                        <Text className="text-sm font-medium">New Annual CTC</Text>
                        <InputNumber
                            className="w-full"
                            prefix={<span className="text-textGreyColor text-sm pr-1">₹</span>}
                            placeholder="e.g. 12,00,000"
                            controls={false}
                            min={0}
                            value={ctcInput ? Number(ctcInput) : undefined}
                            formatter={value => (value ? Number(value).toLocaleString('en-IN') : '')}
                            parser={value => Number((value || '').replace(/[^0-9]/g, ''))}
                            onChange={value => applyCtc(value ? String(value) : '')}
                        />
                    </Flex>
                    <Flex vertical gap={6} style={{ width: 140 }}>
                        <Text className="text-sm font-medium">Increase %</Text>
                        <Input
                            addonAfter="%"
                            value={pctInput}
                            onChange={e => applyPct(e.target.value.replace(/[^0-9.-]/g, ''))}
                        />
                    </Flex>
                    <Flex vertical gap={6} className="flex-1" style={{ minWidth: 180 }}>
                        <Text className="text-sm font-medium">Effective Month</Text>
                        <DatePicker
                            picker="month"
                            className="w-full"
                            placeholder="Select month"
                            value={effectiveDate}
                            onChange={setEffectiveDate}
                        />
                    </Flex>
                    <Flex vertical gap={6} className="flex-1" style={{ minWidth: 180 }}>
                        <Text className="text-sm font-medium">Reason</Text>
                        <Select className="w-full" options={REASON_OPTIONS} value={reason} onChange={setReason} />
                    </Flex>
                </Flex>

                {reason === 'Other' && (
                    <Input
                        placeholder="Describe the reason"
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                    />
                )}

                <Flex align="center" gap={8}>
                    <Text className="text-xs" style={{ color: '#94A3B8' }}>
                        Quick raise:
                    </Text>
                    {QUICK_RAISE_PERCENTAGES.map(quickRaisePct => (
                        <Button key={quickRaisePct} size="small" onClick={() => applyPct(String(quickRaisePct))}>
                            +{quickRaisePct}%
                        </Button>
                    ))}
                </Flex>

                {ctcInput && Number(ctcInput) > 0 && (
                    <Text className="text-sm" style={{ color: '#535862' }}>
                        {fmtRupees(currentAnnualCTC)} → {fmtRupees(Number(ctcInput))} / year{' '}
                        <Text style={{ color: pct < 0 ? '#DC2626' : '#05BE63', fontWeight: 600 }}>
                            ({pct >= 0 ? '+' : ''}
                            {pctInput}%)
                        </Text>
                        {grossDelta !== null && (
                            <>
                                {' '}
                                · Gross{' '}
                                <Text style={{ color: grossDelta < 0 ? '#DC2626' : '#05BE63', fontWeight: 600 }}>
                                    {grossDelta >= 0 ? '+' : '-'}
                                    {fmtRupees(Math.abs(grossDelta))} / month
                                </Text>
                            </>
                        )}
                    </Text>
                )}

                {previewSection}

                {!conflictError && previewBreakdown && grossDelta !== null && takeHomeDelta !== null && (
                    <Flex
                        vertical
                        gap={10}
                        className="mt-2 px-4 py-4"
                        style={{ background: '#FFF2F2', border: '1px solid #FFD9D9', borderRadius: 12 }}
                    >
                        <Text className="font-semibold" style={{ fontSize: 16, color: '#181D27' }}>
                            What changes
                        </Text>
                        <WhatChangesRow
                            label="Annual CTC"
                            from={fmtRupees(currentAnnualCTC)}
                            to={fmtRupees(Number(ctcInput))}
                            delta={`${pct >= 0 ? '+' : ''}${pctInput}%`}
                        />
                        <WhatChangesRow
                            label="Monthly gross"
                            from={fmtRupees(breakdown.grossSalary)}
                            to={fmtRupees(previewBreakdown.grossSalary)}
                            delta={`(${grossDelta >= 0 ? '+' : '-'}${fmtRupees(Math.abs(grossDelta))}/month)`}
                        />
                        <WhatChangesRow
                            label="Take-home (before income tax)"
                            from={fmtRupees(breakdown.netTakeHome)}
                            to={fmtRupees(previewBreakdown.netTakeHome)}
                            delta={`(${takeHomeDelta >= 0 ? '+' : '-'}${fmtRupees(Math.abs(takeHomeDelta))}/month)`}
                        />
                    </Flex>
                )}

                {error && <Alert type="error" showIcon message={error} />}
            </Flex>
        </Modal>
    );
};

export default ReviseSalaryModal;
