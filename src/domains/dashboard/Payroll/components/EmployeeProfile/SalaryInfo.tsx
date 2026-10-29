import { useEffect, useRef, useState } from 'react';

import { Alert, Button, Flex, InputNumber, Radio, Skeleton, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useLocation, useNavigate } from 'react-router-dom';

import loadingLottie from '@assets/animation/add-Employee-Loader.json';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { deleteEmployee } from '../../api/employeeApi/index';
import { createEmployeeDeductionComponent } from '../../api/employeeProfileApi/index';
import { createEmployeeSalaryComponent, reviseSalaryApi } from '../../api/organizationSettings/index';
import useEpfApplicabilityApi from '../../hooks/complianceSettings/useEpfApplicabilityApi';
import { useGetComplianceSettingsApi } from '../../hooks/complianceSettings/useGetComplianceSettingsApi';
import { useCtcCalculatorState } from '../../hooks/ctcCalculator/useCtcCalculatorState';
import { invalidateDashboardCache } from '../../hooks/dashboardHooks/useDashboardApi';
import { invalidateEmployeeCountCache } from '../../hooks/dashboardHooks/useGetEmployeeCount';
import { useGetAllEmployeeSalaryComp } from '../../hooks/employeeHooks/useGetSalaryComponentApi';
import useEmployeeInfoApi from '../../hooks/employeeOnboardingHooks/useUpdateEmployeeApi';
import { useGetAllDeductions } from '../../hooks/OrganizationSettings/useGetDeductionComponentApi';
import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { clearCtcDraft } from '../../slices/ctcCalculatorDraft';
import { setPayrollProgress } from '../../slices/payrollAuth';
import {
    resolveEpfApplicableForJoiners,
    resolveEpfPolicyFromComplianceSettings,
    resolveShowPfInEarningsFromComplianceSettings,
    willEpfBecomeMandatory,
} from '../../utils/ctcCalculator/calculateEmployerPf';
import {
    mapDeductionComponentsToDeductions,
    mapSalaryComponentsToEarnings,
} from '../../utils/ctcCalculator/mapOrgComponentsToCtcModel';
import { isPfEarningsLine } from '../../utils/ctcCalculator/pfEarningsLine';
import { CtcDeductionComponent, CtcEarningComponent } from '../../utils/ctcCalculator/types';
import CtcBreakdownCard from '../ctcCalculator/CtcBreakdownCard';
import CtcDeductionDrawer from '../ctcCalculator/CtcDeductionDrawer';
import CtcEarningDrawer from '../ctcCalculator/CtcEarningDrawer';

type Props = {
    nextTab: (key: string) => void;
};

const SalaryInfo = ({ nextTab }: Props) => {
    const navigate = useNavigate();
    // Set when this add-employee flow was entered from the onboarding wizard's final
    // "Add Employees" step (WelcomeAddEmployee.tsx) rather than the regular Employees page's
    // own "+ New Employee" button — changes where a successful creation lands the user.
    const location = useLocation();
    const fromOnboarding = !!(location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding;
    const { createEmployee } = useEmployeeInfoApi();
    const { updateSkipDashboard } = useOrganizationSettingsApi();
    const { data: salaryComponents, tableLoading: salaryLoading } = useGetAllEmployeeSalaryComp();
    const { data: deductionComponents, tableLoading: deductionLoading } = useGetAllDeductions(1, 100, '', false, true);
    const { complianceData } = useGetComplianceSettingsApi();
    const epfPolicy = resolveEpfPolicyFromComplianceSettings(complianceData);
    // This employee is created on submit, so they aren't in the active count yet (+1).
    const { applicability: epfApplicability } = useEpfApplicabilityApi();
    const epfApplicable = resolveEpfApplicableForJoiners(complianceData, epfApplicability, 1);
    const epfTurnsOnWithThisHire = willEpfBecomeMandatory(epfApplicability, 1);
    const showPfInEarnings = resolveShowPfInEarningsFromComplianceSettings(complianceData, epfApplicable);

    const { employeeInformation, personalInformation } = useAppSelector(
        state => state.reducer.employeeSettings
    );
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const ctcDraft = useAppSelector(state => state.reducer.ctcCalculatorDraft.draft);
    const profileImage = useAppSelector(state => state.reducer.employee.imageDetails);
    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);
    const [taxRegime, setTaxRegime] = useState<string>('');
    // Synchronous guard against a double-click firing handleSalaryInfoSubmit twice before
    // the `loading` state re-render disables the button — that race would otherwise create
    // duplicate employee-specific salary/deduction components.
    const isSubmittingRef = useRef(false);
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: loadingLottie,
    };

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
        if (hydrated || salaryLoading || deductionLoading) return;

        if (ctcDraft) {
            hydrate(ctcDraft.earnings, ctcDraft.deductions, ctcDraft.annualCTC);
            dispatch(clearCtcDraft());
        } else if (salaryComponents.length > 0) {
            hydrate(mapSalaryComponentsToEarnings(salaryComponents), mapDeductionComponentsToDeductions(deductionComponents));
        }
    }, [hydrated, salaryLoading, deductionLoading, salaryComponents, deductionComponents, ctcDraft, hydrate, dispatch]);

    const handleSalaryInfoSubmit = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setLoading(true);

        try {
            // Persist the ENGINE'S resolved amounts (breakdown.earnings/deductions), not the
            // raw input state (earnings/deductions) — the latter's calculatedAmount is always
            // the placeholder 0 set at hydrate/edit time; only calculateCtcBreakdown fills it in.
            // The synthetic "PF Employee's Contribution" row is a display echo of the EPF
            // deduction, not a real component, so it's excluded here.
            const resolvedEarnings = breakdown.earnings.filter(
                earning => !earning.id.endsWith('-employee-pf-mirror') && !isPfEarningsLine(earning)
            );

            await Promise.all(
                resolvedEarnings.map(earning => {
                    // Preserve the rule the user actually picked in CtcEarningDrawer (e.g.
                    // "50% of Gross") instead of freezing everything to a FIXED rupee
                    // snapshot — a PERCENTAGE component needs its raw percent + basis
                    // persisted, not the resolved amount, matching how every other
                    // percent-based persist in this app stores it (see
                    // redistributeBasicSalary/redistributeEarningComponent).
                    const isPercentage = earning.calculationType === 'PERCENTAGE';
                    return createEmployeeSalaryComponent({
                        globalComponentId: earning.isGlobal ? earning.id : undefined,
                        componentName: earning.componentName,
                        calculationType: earning.calculationType,
                        amountPercentage: isPercentage
                            ? Number((earning.amountPercentage ?? 0).toFixed(2))
                            : Number(earning.calculatedAmount.toFixed(2)),
                        ...(isPercentage && {
                            calculationBasis: earning.calculationBasis,
                            calculationBasedOn: earning.calculationBasedOn,
                        }),
                        status: 'ACTIVE',
                        employeeEmail: personalInformation.email,
                        isGlobal: false,
                        userId,
                        userType,
                    } as any);
                })
            );

            const payload = {
                profileImage: profileImage?.profileImage,
                personalInformation,
                employeeInformation: {
                    ...employeeInformation,
                    taxRegime,
                },
            };
            const createdEmployee = await createEmployee(payload);

            if (!createdEmployee?.id) {
                dispatch(
                    showToast({
                        description:
                            createdEmployee?.errorMessage ||
                            'Failed to add employee. Please try again.',
                        variant: 'error',
                    })
                );
                return;
            }

            await Promise.all(
                breakdown.deductions.map(deduction =>
                    createEmployeeDeductionComponent({
                        globalComponentId: deduction.isGlobal ? deduction.id : undefined,
                        deductionName: deduction.deductionName,
                        calculationType: 'FIXED',
                        amountPercentage: Number(deduction.calculatedAmount.toFixed(2)),
                        calculationBasis: 'MONTHLY',
                        status: 'ACTIVE',
                        eId: createdEmployee.id,
                        userId,
                        userType,
                    } as any)
                )
            );

            // Records the entered Annual CTC as this employee's actually-committed
            // figure (a SalaryStructureVersion, effective from their join month) rather
            // than leaving the Salary Structure tab to reconstruct an approximation of
            // it from currently-resolved earnings on every view — lossy for a
            // percentage-only structure (Basic "% of Gross", HRA "% of Basic") with no
            // FIXED anchor, and compounds further each time it's viewed and re-persisted.
            const joinDate = new Date(employeeInformation.dateOfJoin);
            const effective = Number.isNaN(joinDate.getTime()) ? new Date() : joinDate;
            const revision = await reviseSalaryApi({
                userId,
                userType,
                employeeId: createdEmployee.id,
                newAnnualCTC: annualCTC,
                effectiveMonth: effective.getMonth() + 1,
                effectiveYear: effective.getFullYear(),
                reason: 'Initial hire',
                isInitialHire: true,
            });

            if (!revision.success) {
                // The Create button is already disabled whenever breakdown.isOverBudget is
                // true, so reaching a rejected CTC here means something changed server-side
                // between page load and submit (e.g. an org component edited concurrently)
                // — genuinely rare, but still shouldn't leave a half-set-up employee behind.
                // Roll back the employee record itself (soft delete, same as the regular
                // Delete Employee action) rather than surfacing an error while leaving them
                // creatable-looking in the list with no real salary structure.
                await deleteEmployee({ userId, userType, idToDelete: createdEmployee.id });
                dispatch(
                    showToast({
                        description: `Could not set up salary: ${revision.errorMessage}. The employee was not created — adjust the CTC or components and try again.`,
                        variant: 'error',
                    })
                );
                // Navigate away rather than leaving the wizard open on the same values —
                // the earnings/deductions already persisted this attempt are keyed by
                // personalInformation.email (not the now-deleted employee id), so an
                // immediate resubmit here would create duplicates of them once a new
                // employee record picks up that same email. Starting over from "+ New
                // Employee" is the safe retry path.
                navigate(`/${paths.payroll.index}/${paths.payroll.employees}`);
                return;
            }

            invalidateDashboardCache();
            invalidateEmployeeCountCache();
            dispatch(
                showToast({
                    description: 'Employee added successfully',
                    variant: 'success',
                })
            );
            if (fromOnboarding) {
                // Land back on the Payroll Dashboard rather than the Employees list —
                // matches "Take me to dashboard" on the onboarding wizard's own final step,
                // so finishing onboarding by adding an employee doesn't eject the user into
                // an unrelated listing page instead of completing the onboarding journey.
                await updateSkipDashboard(true);
                dispatch(setPayrollProgress({ isSkippedDasboard: true }));
                navigate(`/${paths.payroll.index}`);
            } else {
                navigate(`/${paths.payroll.index}/${paths.payroll.employees}`);
            }
        } finally {
            isSubmittingRef.current = false;
            setLoading(false);
        }
    };

    const isSourceLoading = salaryLoading || deductionLoading;

    return isSourceLoading && !hydrated ? (
        <Skeleton />
    ) : (
        <Flex vertical className="my-8">
            <Flex justify="center">
                <Flex vertical className="w-full max-w-[800px]" gap={20}>
                    <Flex vertical gap={8} className="items-center mb-2">
                        <Typography.Text className="font-medium" style={{ color: '#181D27' }}>
                            Annual CTC
                        </Typography.Text>
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
                            <Typography.Text className="text-sm whitespace-nowrap" style={{ color: '#535862' }}>
                                = ₹ {Math.round(breakdown.monthlyCTC).toLocaleString('en-IN')} / month
                            </Typography.Text>
                        </Flex>
                    </Flex>

                    {epfTurnsOnWithThisHire && (
                        <Alert
                            className="mt-6"
                            type="info"
                            showIcon
                            message={`This hire takes you to ${epfApplicability?.mandatoryThreshold} employees — EPF becomes mandatory and will be turned on automatically for your establishment, so PF is included below.`}
                        />
                    )}
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

                    <Flex vertical gap={2} className="mt-2">
                        <Typography.Text className="font-medium">
                            Select tax regime{' '}
                            <Typography.Text className="text-textGrey font-normal">(optional)</Typography.Text>
                        </Typography.Text>
                        <Radio.Group
                            value={taxRegime}
                            onChange={e => setTaxRegime(e.target.value)}
                            className="flex gap-6 mt-2"
                        >
                            <Radio value="New Tax Regime">New Tax Regime</Radio>
                            <Radio value="Old Tax Regime">Old Tax Regime</Radio>
                        </Radio.Group>
                    </Flex>

                    <Flex justify="space-between" className="mt-6">
                        <Button
                            onClick={() => nextTab('2')}
                            type="default"
                            danger
                            className="font-semibold w-[8rem]"
                        >
                            Back
                        </Button>

                        <Button
                            onClick={handleSalaryInfoSubmit}
                            type="primary"
                            danger
                            disabled={!annualCTC || breakdown.isOverBudget}
                            loading={loading}
                            className="font-semibold w-[8rem]"
                        >
                            Create
                        </Button>
                    </Flex>
                </Flex>
            </Flex>

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

            {loading && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        zIndex: 1000,
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <Lottie options={defaultOptions} height={120} width={120} />
                    </div>
                </div>
            )}
        </Flex>
    );
};

export default SalaryInfo;
