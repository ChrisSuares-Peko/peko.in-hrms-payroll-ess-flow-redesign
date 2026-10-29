import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Modal, Row, Skeleton, Switch, Typography } from 'antd';
import { Formik } from 'formik';
import moment from 'moment';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import useAddEpfSettingsApi from '../../hooks/complianceSettings/useAddEpfSettingsApi';
import useEpfApplicabilityApi from '../../hooks/complianceSettings/useEpfApplicabilityApi';
import { payrollEPFSchema } from '../../schema/EmployeeSalary';
import { resolvePfMonthlyCap, resolvePfWageCeiling } from '../../utils/ctcCalculator/calculateEmployerPf';
import InfoCard from '../organizationSettings/InfoCard';

const { Text } = Typography;

const BORDER = '#E2E8F0';
const TEXT_DARK = '#181D27';
const TEXT_MUTED = '#535862';

type EPFProps = {
    setActiveTabKey?: any;
    complianceData?: any;
};

// Labels read the ceiling in force this month (₹25,000 → ₹3,000 cap from September 2026).
// Only the wording changes — the stored value stays 'CAPPED_15000' so every saved org
// setting and every PF calculation keyed on it is untouched.
const formatRupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const currentPfCap = formatRupees(resolvePfMonthlyCap());
const currentPfCeiling = formatRupees(resolvePfWageCeiling());

const pfWagesPolicyOptions = [
    {
        label: `12% of Basic salary, capped at ${currentPfCap} a month (${currentPfCeiling} wage ceiling)`,
        value: 'CAPPED_15000',
    },
    {
        label: `12% of Basic salary, no cap (can go beyond ${currentPfCap})`,
        value: 'FULL_BASIC',
    },
];

const SettingsCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
        <div className="px-5 py-3" style={{ background: '#F8FAFC', borderBottom: `1px solid ${BORDER}` }}>
            <Text className="text-sm font-medium" style={{ color: TEXT_DARK }}>
                {title}
            </Text>
        </div>
        {children}
    </div>
);

const EPF: React.FC<EPFProps> = ({ setActiveTabKey, complianceData }) => {
    const isLoading = false;

    const { handleSaveEpfData, nextStep } = useAddEpfSettingsApi();
    const {
        applicability,
        loading: applicabilityLoading,
        updating,
        updateApplicability,
        updatingEarningsLine,
        updateEarningsLine,
    } = useEpfApplicabilityApi();

    // Until the first fetch returns, don't guess — the switches show loading instead of
    // starting on and flipping off.
    const applicabilityPending = applicabilityLoading && !applicability;
    const isApplicable = applicability
        ? applicability.isApplicable
        : !applicabilityPending && complianceData?.epf?.isApplicable !== false;
    // At 20+ active employees EPF is mandatory, so the switch stays on. Turning it back ON
    // is always allowed.
    const isLocked = !!applicability && isApplicable && !applicability.canDisable;
    const showInEarnings = applicability
        ? applicability.showEmployeePfInEarnings
        : complianceData?.epf?.showEmployeePfInEarnings === true;
    const effectiveFromLabel = applicability
        ? moment({ year: applicability.nextEffectiveYear, month: applicability.nextEffectiveMonth - 1 }).format('MMMM YYYY')
        : '';

    const handleApplicabilityToggle = (checked: boolean) => {
        if (checked || !applicability?.hasProcessedPayroll) {
            updateApplicability(checked);
            return;
        }
        // Payrolls have already run with EPF — the establishment is on record as covered.
        Modal.confirm({
            title: 'Turn off EPF for this establishment?',
            content: (
                <Flex vertical gap={8}>
                    <Text>
                        Payrolls have already been processed with EPF. Under Section 1(5) of the EPF Act, an establishment
                        that is covered stays covered even if its headcount later falls below 20.
                    </Text>
                    <Text>
                        Turn EPF off only if your establishment was never required to register, or you have confirmed this
                        with your EPF advisor. It takes effect from the {effectiveFromLabel} payroll. Months already paid
                        keep their PF.
                    </Text>
                </Flex>
            ),
            okText: 'Turn off EPF',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => updateApplicability(false),
        });
    };

    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical gap={20} className="pt-6">
            <Row gutter={[24, 24]}>
                <Col xs={24} md={16}>
                    <Flex vertical gap={16}>
                        <SettingsCard title="Establishment settings">
                            <Flex justify="space-between" align="start" gap={24} className="px-5 py-4">
                                <Flex vertical gap={4} className="min-w-0">
                                    <Text className="text-sm font-medium" style={{ color: TEXT_DARK }}>
                                        EPF applies to this establishment
                                    </Text>
                                    <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                                        Mandatory for establishments with 20 or more employees. Below 20, EPF is optional
                                        — you can still choose to contribute for your team.
                                    </Text>
                                    {isLocked && (
                                        <Text className="text-xs" style={{ color: '#B42318' }}>
                                            EPF is mandatory under Section 1(3) of the EPF Act once an establishment has{' '}
                                            {applicability?.mandatoryThreshold} or more employees. You have{' '}
                                            {applicability?.activeEmployeeCount} active employees, so it can&apos;t be
                                            turned off.
                                        </Text>
                                    )}
                                    {/* Hidden to match the prototype — the effective month is still shown in
                                        the confirm dialog when turning EPF off after payrolls have run.
                                    {applicability && !isLocked && (
                                        <Text className="text-xs" style={{ color: '#94A3B8' }}>
                                            A change takes effect from the {effectiveFromLabel} payroll. Months already paid
                                            keep what they had.
                                        </Text>
                                    )} */}
                                </Flex>
                                {applicabilityPending ? (
                                    <Skeleton.Button active size="small" style={{ width: 44, minWidth: 44 }} />
                                ) : (
                                    <Switch
                                        data-testid="epf-applicable-switch"
                                        checked={isApplicable}
                                        disabled={applicabilityLoading || isLocked}
                                        loading={updating}
                                        onChange={handleApplicabilityToggle}
                                    />
                                )}
                            </Flex>
                            <Flex
                                justify="space-between"
                                align="start"
                                gap={24}
                                className="px-5 py-4"
                                style={{ borderTop: '1px solid #F1F5F9' }}
                            >
                                <Flex vertical gap={4} className="min-w-0">
                                    <Text className="text-sm font-medium" style={{ color: TEXT_DARK }}>
                                        Show PF Employee&apos;s Contribution in Earnings
                                    </Text>
                                    {applicabilityPending ? (
                                        <Skeleton active title={false} paragraph={{ rows: 1, width: '80%' }} />
                                    ) : (
                                    <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                                        {showInEarnings
                                            ? "On — the employee's PF share is also listed in Earnings (taken out of Other Allowance) and still deducted. Gross, CTC and take-home are the same either way."
                                            : "Off — the employee's PF share appears in Deductions only. It is recommended to keep this off, as most companies do not show this in earnings."}
                                    </Text>
                                    )}
                                    {!isApplicable && !applicabilityPending && (
                                        <Text className="text-xs" style={{ color: '#94A3B8' }}>
                                            Available once EPF applies to this establishment.
                                        </Text>
                                    )}
                                    {/* Hidden to match the prototype.
                                    {isApplicable && applicability && (
                                        <Text className="text-xs" style={{ color: '#94A3B8' }}>
                                            A change takes effect from the {effectiveFromLabel} payroll. Payslips already
                                            issued stay as they are.
                                        </Text>
                                    )} */}
                                </Flex>
                                {applicabilityPending ? (
                                    <Skeleton.Button active size="small" style={{ width: 44, minWidth: 44 }} />
                                ) : (
                                    <Switch
                                        data-testid="employee-pf-in-earnings-switch"
                                        checked={isApplicable && showInEarnings}
                                        disabled={applicabilityLoading || !isApplicable}
                                        loading={updatingEarningsLine}
                                        onChange={updateEarningsLine}
                                    />
                                )}
                            </Flex>
                        </SettingsCard>

                        <SettingsCard title="Registration & wages policy">
                            <div className="px-5 pt-5 pb-4">
                                <Formik
                                    initialValues={{
                                        epfNumber: complianceData?.epf?.epfNumber || '',
                                        pfWagesPolicy: complianceData?.epf?.pfWagesPolicy || 'CAPPED_15000',
                                        enableProRatedPfWage: complianceData?.epf?.enableProRatedPfWage || true,
                                        considerSalaryComponents: complianceData?.epf?.considerSalaryComponents || true,
                                    }}
                                    enableReinitialize
                                    validationSchema={payrollEPFSchema}
                                    onSubmit={async values => {
                                        await handleSaveEpfData(values);
                                        if (nextStep) setActiveTabKey('2');
                                    }}
                                >
                                    {({ handleSubmit }) => (
                                        <Form layout="vertical" onFinish={handleSubmit}>
                                            <Row gutter={[20, 8]}>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        isRequired
                                                        showToolTip
                                                        tooltipText="EPF Establishment Code format: State/Region/Establishment Code/Extension/Employee Number (e.g., TN/MAS/0054321/000/0000456)"
                                                        name="epfNumber"
                                                        placeholder="e.g. MHBAN0045761000"
                                                        label="EPF Establishment Code"
                                                        type="text"
                                                        allowAlphabetsNumberAndSpecialCharacters={['/']}
                                                        convertToUppercase
                                                        maxLength={30}
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <SelectInput
                                                        name="pfWagesPolicy"
                                                        placeholder="Select PF wages policy"
                                                        label="PF Wages Policy"
                                                        showToolTip
                                                        tooltipText="Decides whether EPF contributions are computed on the statutory PF wage ceiling (₹15,000/month up to 16 September 2026, ₹25,000/month from 17 September 2026) or on the employee's full Basic Salary. Contribution rates themselves are fixed by statute."
                                                        options={pfWagesPolicyOptions}
                                                        isRequired
                                                    />
                                                </Col>
                                            </Row>
                                            <Flex className="mt-2" gap={16} justify="space-between" align="center" wrap="wrap">
                                                <Button className="px-4" type="primary" danger htmlType="submit">
                                                    Save
                                                </Button>
                                                <Text className="text-xs" style={{ color: '#94A3B8' }}>
                                                    <InfoCircleOutlined style={{ marginRight: 6 }} />
                                                    Rates are fixed by law and cannot be changed: employee 12% of PF wages;
                                                    employer 12% + 1% admin/EDLI.
                                                </Text>
                                            </Flex>
                                        </Form>
                                    )}
                                </Formik>
                            </div>
                        </SettingsCard>
                    </Flex>
                </Col>
                <Col xs={24} md={8}>
                    <InfoCard
                        title="Why Is EPF Important?"
                        description={`EPF ensures that employees save a portion of their salary every month for future financial security, such as retirement or emergencies.

As an employer, EPF is legally required once your establishment has 20 or more employees. Below 20 it is optional — many small companies still choose to contribute, and once covered an establishment stays covered.

The PF wages policy decides whether contributions are computed on the statutory ₹25,000 ceiling (the most common setup, and what your offer letters use) or on the employee's full Basic salary. The ceiling moved from ₹15,000 to ₹25,000 from 17 September 2026 (Union Cabinet decision of 16 September 2026), so September 2026 is split by days — 1–16 Sep on ₹15,000, 17–30 Sep on ₹25,000. From October 2026 the employee's capped share is ₹3,000 and the employer's ₹3,250 a month. Payrolls already processed keep their ₹15,000 figures.

"Show PF Employee's Contribution in Earnings" is a presentation choice: some companies list the employee's PF share as a line in the salary structure (taken out of Other Allowance) as well as a deduction. Gross and take-home are the same either way.`}
                    />
                </Col>
            </Row>
        </Flex>
    );
};

export default EPF;
