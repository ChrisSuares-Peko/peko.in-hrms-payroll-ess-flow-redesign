import { useEffect, useState } from 'react';

import { Flex, InputNumber, Skeleton, Typography } from 'antd';

import CtcBreakdownCard from '../components/ctcCalculator/CtcBreakdownCard';
import CtcDeductionDrawer from '../components/ctcCalculator/CtcDeductionDrawer';
import CtcEarningDrawer from '../components/ctcCalculator/CtcEarningDrawer';
import { useGetComplianceSettingsApi } from '../hooks/complianceSettings/useGetComplianceSettingsApi';
import { useCtcCalculatorState } from '../hooks/ctcCalculator/useCtcCalculatorState';
import { useGetSalaryComponent } from '../hooks/OrganizationSettings/useGetCurrentSalaryCompApi';
import { useGetAllDeductions } from '../hooks/OrganizationSettings/useGetDeductionComponentApi';
import {
    resolveEpfApplicableFromComplianceSettings,
    resolveEpfPolicyFromComplianceSettings,
    resolveShowPfInEarningsFromComplianceSettings,
} from '../utils/ctcCalculator/calculateEmployerPf';
import { mapDeductionComponentsToDeductions, mapSalaryComponentsToEarnings } from '../utils/ctcCalculator/mapOrgComponentsToCtcModel';
import { CtcDeductionComponent, CtcEarningComponent } from '../utils/ctcCalculator/types';

const { Text } = Typography;

const CtcCalculatorPage = () => {
    const { data: salaryComponents } = useGetSalaryComponent();
    const { data: deductionComponents, tableLoading } = useGetAllDeductions(1, 100, '', false, true);
    const { complianceData } = useGetComplianceSettingsApi();

    const epfPolicy = resolveEpfPolicyFromComplianceSettings(complianceData);
    const epfApplicable = resolveEpfApplicableFromComplianceSettings(complianceData);
    const showPfInEarnings = resolveShowPfInEarningsFromComplianceSettings(complianceData, epfApplicable);
    const {
        annualCTC,
        setAnnualCTC,
        hydrated,
        hydrate,
        upsertEarning,
        removeEarning,
        upsertDeduction,
        removeDeduction,
        breakdown,
        hasBalancingEarning,
    } = useCtcCalculatorState(epfPolicy, epfApplicable, showPfInEarnings);

    const [earningDrawer, setEarningDrawer] = useState<{ open: boolean; earning: CtcEarningComponent | null }>({
        open: false,
        earning: null,
    });
    const [deductionDrawer, setDeductionDrawer] = useState<{
        open: boolean;
        deduction: CtcDeductionComponent | null;
    }>({ open: false, deduction: null });

    useEffect(() => {
        // Deductions are legitimately empty by default now (PF is configured under
        // Compliance Settings > EPF, not here) — gate on the fetch finishing (tableLoading),
        // not on the list being non-empty, or hydration would never run for an org with no
        // manually-added deductions.
        if (!hydrated && salaryComponents.length > 0 && !tableLoading) {
            hydrate(mapSalaryComponentsToEarnings(salaryComponents), mapDeductionComponentsToDeductions(deductionComponents));
        }
    }, [hydrated, salaryComponents, deductionComponents, tableLoading, hydrate]);

    return (
        <div className="w-full max-w-[800px] mx-auto py-6">
            <Flex vertical>
                <Text className="text-xl font-medium">CTC Calculator</Text>
                <Text type="secondary" className="text-base mt-1">
                    Estimate the full salary breakdown for a target CTC.
                </Text>
            </Flex>

            <div
                className="mt-8 bg-white rounded-xl p-6 md:p-8"
                style={{ border: '1px solid #E2E8F0', boxShadow: '0px 1.5px 16.5px rgba(0, 0, 0, 0.08)' }}
            >
                <Flex vertical gap={8} className="items-center mb-2">
                    <Text className="font-medium" style={{ color: '#181D27' }}>
                        Annual CTC
                    </Text>
                    <Flex align="center" justify="center" gap={16}>
                        <InputNumber
                            value={annualCTC || undefined}
                            onChange={value => setAnnualCTC(Number(value) || 0)}
                            prefix={<span className="text-textGreyColor text-sm pr-1">₹</span>}
                            size="large"
                            style={{ width: 400 }}
                            min={0}
                            controls={false}
                            formatter={value => (value ? Number(value).toLocaleString('en-IN') : '')}
                            parser={value => Number((value || '').replace(/[^0-9]/g, ''))}
                            placeholder="e.g. 6,00,000"
                        />
                        <Text className="text-sm whitespace-nowrap" style={{ color: '#535862' }}>
                            = ₹ {Math.round(breakdown.monthlyCTC).toLocaleString('en-IN')} / month
                        </Text>
                    </Flex>
                </Flex>

                {tableLoading && !hydrated ? (
                    <Skeleton active />
                ) : (
                    <div className="mt-6">
                        <CtcBreakdownCard
                            breakdown={breakdown}
                            editable
                            onAddEarning={() => setEarningDrawer({ open: true, earning: null })}
                            onEditEarning={earning => setEarningDrawer({ open: true, earning })}
                            onRemoveEarning={removeEarning}
                            onAddDeduction={() => setDeductionDrawer({ open: true, deduction: null })}
                            onEditDeduction={deduction => setDeductionDrawer({ open: true, deduction })}
                            onRemoveDeduction={removeDeduction}
                        />
                    </div>
                )}
            </div>

            {earningDrawer.open && (
                <CtcEarningDrawer
                    open={earningDrawer.open}
                    selectedEarning={earningDrawer.earning}
                    allowBalancing={!hasBalancingEarning || !!earningDrawer.earning}
                    breakdown={breakdown}
                    onClose={() => setEarningDrawer({ open: false, earning: null })}
                    onSave={upsertEarning}
                />
            )}
            {deductionDrawer.open && (
                <CtcDeductionDrawer
                    open={deductionDrawer.open}
                    selectedDeduction={deductionDrawer.deduction}
                    onClose={() => setDeductionDrawer({ open: false, deduction: null })}
                    onSave={upsertDeduction}
                />
            )}
        </div>
    );
};

export default CtcCalculatorPage;
