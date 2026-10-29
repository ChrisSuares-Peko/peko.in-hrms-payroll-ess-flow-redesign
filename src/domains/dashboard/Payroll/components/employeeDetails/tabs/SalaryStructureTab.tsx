import React, { useRef, useState } from 'react';

// import { EditOutlined } from '@ant-design/icons'; // TDS edit is on the Salary Profile tab only
import { Button, Col, Flex, Row, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import HowThisWorksPanel from './HowThisWorksPanel';
import RevisionHistorySection from './RevisionHistorySection';
import {
    redistributeBasicSalaryApi,
    redistributeEarningComponentApi,
    reviseSalaryApi,
    undoRevisionApi,
} from '../../../api/organizationSettings/index';
import { useGetEmployeeCtc } from '../../../hooks/ctcCalculator/useGetEmployeeCtc';
import { useGetRevisionHistory } from '../../../hooks/ctcCalculator/useGetRevisionHistory';
import { useDeductionActions } from '../../../hooks/employeeProfileHooks/useEmployeeDeductionApi';
import { useGetAllDeduction } from '../../../hooks/employeeProfileHooks/useGetEmployeeDeductionApi';
import { useEmployeeTdsOverride } from '../../../hooks/employeeSalaryHooks/useEmployeeTdsOverride';
import { useSalaryCompActions } from '../../../hooks/OrganizationSettings/useSalaryComponentApi';
import { adaptEmployeeCtcResponse } from '../../../utils/ctcCalculator/adaptEmployeeCtcResponse';
import { CtcDeductionComponent, CtcEarningComponent } from '../../../utils/ctcCalculator/types';
import CtcBreakdownCard from '../../ctcCalculator/CtcBreakdownCard';
import EmployeeSalaryCompModal from '../../EmployeeProfile/EmployeeSalaryCompModal';
// import EditTdsModal from '../../EmployeeSalary/EditTdsModal'; // TDS edit is on the Salary Profile tab only
import EditBasicSalaryModal from '../modals/EditBasicSalaryModal';
import EditEarningComponentModal from '../modals/EditEarningComponentModal';
import EmployeeDeductionModal from '../modals/EmployeeDeductionModal';
import ReviseSalaryModal from '../modals/ReviseSalaryModal';

const { Text } = Typography;

const fmtRupees = (amount: number) =>
    `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

type DeleteTarget = { type: 'earning' | 'deduction'; id: string; label: string };

interface SalaryStructureTabProps {
    employeeData?: any;
}

const SalaryStructureTab = ({ employeeData }: SalaryStructureTabProps) => {
    const location = useLocation();
    const { employeeId, month, year } = location.state || {};
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const employeeName = employeeData?.personalInformation?.fullName || 'this employee';
    const revisionHistoryRef = useRef<HTMLDivElement>(null);

    const [reloadTable, setReloadTable] = useState(false);
    const [salaryModalOpen, setSalaryModalOpen] = useState(false);
    const [deductionModalOpen, setDeductionModalOpen] = useState(false);
    const [basicModalOpen, setBasicModalOpen] = useState(false);
    const [editingEarningComponent, setEditingEarningComponent] =
        useState<CtcEarningComponent | null>(null);
    const [reviseModalOpen, setReviseModalOpen] = useState(false);
    const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
    const [undoLoading, setUndoLoading] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<DeleteTarget | null>(null);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);

    // TDS is shown here for Old Tax Regime employees but edited from the Salary Profile tab
    // only — the edit modal state below is kept commented out for that reason.
    // const [tdsModalOpen, setTdsModalOpen] = useState(false);
    // const currentMonth = new Date().getMonth() + 1;
    // const currentYear = new Date().getFullYear();
    const { info: tdsInfo /* , saveTds */ } = useEmployeeTdsOverride(employeeId);

    const { data: ctcData, refetch: refetchCtc } = useGetEmployeeCtc(employeeId || null);
    const breakdown = ctcData ? adaptEmployeeCtcResponse(ctcData) : null;

    const { data: deductionComponents } = useGetAllDeduction(
        employeeId,
        1,
        100,
        year,
        month,
        reloadTable
    );
    const {
        data: revisionHistory,
        isLoading: revisionHistoryLoading,
        refetch: refetchRevisionHistory,
    } = useGetRevisionHistory(employeeId || null);
    // The employee's initial hire is recorded as a version too (so the CTC tab has a
    // committed figure to anchor on from day one — see getEmployeeCtcBreakdown), but it
    // isn't an actual salary REVISION the way this section/label mean it: nothing was
    // "revised," this is just where their salary started. previousAnnualCTC is null only
    // for that entry (isInitialHire, reviseSalary.js) — every real revision always has one.
    // Filtered out here for display only; the full revisionHistory (initial hire included)
    // still goes to ReviseSalaryModal below, where its effectiveFrom is a real constraint
    // on how far back a new revision can be backdated.
    const displayRevisionHistory = (revisionHistory || []).filter(
        entry => entry.previousAnnualCTC != null
    );

    const { deleteSalaryCompAction, isLoading: deletingSalary } = useSalaryCompActions();
    const { deleteDeductionAction, isLoading: deletingDeduction } = useDeductionActions();

    const refreshAll = () => {
        setReloadTable(prev => !prev);
        refetchCtc();
        refetchRevisionHistory();
    };

    const handleReloadAndRefresh: React.Dispatch<React.SetStateAction<boolean>> = updater => {
        setReloadTable(updater);
        refetchCtc();
    };

    const handleEditEarning = (earning: CtcEarningComponent) => {
        if (earning.componentName === 'Basic Salary') {
            setBasicModalOpen(true);
            return;
        }
        // Special Allowance has no edit button to begin with (CtcBreakdownCard omits it
        // for BALANCING earnings) — this is just a defensive no-op, not a reachable path.
        if (earning.calculationType === 'BALANCING') {
            return;
        }
        setEditingEarningComponent(earning);
    };

    const handleRemoveEarning = (earning: CtcEarningComponent) => {
        setConfirmTarget({ type: 'earning', id: earning.id, label: earning.componentName });
    };

    const handleEditDeduction = (deduction: CtcDeductionComponent) => {
        const raw = deductionComponents.find((c: any) => c.id === deduction.id) || null;
        setSelectedRecordData(raw);
        setDeductionModalOpen(true);
    };

    const handleRemoveDeduction = (deduction: CtcDeductionComponent) => {
        setConfirmTarget({ type: 'deduction', id: deduction.id, label: deduction.deductionName });
    };

    const handleConfirmDelete = async () => {
        if (!confirmTarget) return;
        if (confirmTarget.type === 'earning') {
            await deleteSalaryCompAction(confirmTarget.id);
        } else {
            await deleteDeductionAction(confirmTarget.id);
        }
        setConfirmTarget(null);
        refreshAll();
    };

    const handleSaveBasicSalary = async (payload: {
        calculationType: 'FIXED' | 'PERCENTAGE';
        amountPercentage: number;
        calculationBasis?: 'GROSS_SALARY' | 'CTC';
    }): Promise<true | string> => {
        const result = await redistributeBasicSalaryApi({
            userId,
            userType: role,
            employeeId,
            calculationType: payload.calculationType,
            amountPercentage: payload.amountPercentage,
            calculationBasis: payload.calculationBasis,
        });
        if (result.success) {
            dispatch(
                showToast({ description: 'Basic Salary updated successfully', variant: 'success' })
            );
            refreshAll();
            return true;
        }
        return result.errorMessage || 'Failed to update Basic Salary';
    };

    const handleSaveEarningComponent = async (payload: {
        calculationType: 'FIXED' | 'PERCENTAGE';
        amountPercentage: number;
        calculationBasis?: 'GROSS_SALARY' | 'BASIC_SALARY' | 'CTC';
    }): Promise<true | string> => {
        if (!editingEarningComponent) return 'No component selected.';
        const result = await redistributeEarningComponentApi({
            userId,
            userType: role,
            employeeId,
            componentId: editingEarningComponent.id,
            calculationType: payload.calculationType,
            amountPercentage: payload.amountPercentage,
            calculationBasis: payload.calculationBasis,
        });
        if (result.success) {
            dispatch(
                showToast({ description: 'Component updated successfully', variant: 'success' })
            );
            refreshAll();
            return true;
        }
        return result.errorMessage || 'Failed to update component';
    };

    const handleReviseSalary = async (payload: {
        newAnnualCTC: number;
        effectiveMonth: number;
        effectiveYear: number;
        reason: string;
    }) => {
        const result = await reviseSalaryApi({
            userId,
            userType: role,
            employeeId,
            ...payload,
        });
        if (result.success && result.data) {
            // The modal closes immediately with no confirmation screen, so this toast is
            // the only place an arrears callout (if any) reaches the user — fold it in
            // rather than silently dropping it. esiNote is deliberately NOT included here
            // (kept short/actionable) — that context is already visible on the CTC
            // breakdown itself, via the "ESI Employer's Contribution ... covered until
            // <month>" badge.
            const extraNotes = [
                result.data.arrears &&
                    `Arrears of ${fmtRupees(result.data.arrears.amount)} will be paid with the ${result.data.arrears.payoutMonth}/${result.data.arrears.payoutYear} salary run.`,
            ].filter(Boolean);
            dispatch(
                showToast({
                    description: ['Salary revised successfully', ...extraNotes].join(' '),
                    variant: 'success',
                })
            );
            refreshAll();
            return result.data;
        }
        return result.errorMessage || 'Failed to revise salary';
    };

    const handleUndoLatest = async () => {
        setUndoLoading(true);
        const result = await undoRevisionApi({ userId, userType: role, employeeId });
        setUndoLoading(false);
        setUndoConfirmOpen(false);
        if (result.success) {
            const description = result.data?.reconstructed
                ? 'Revision undone — this revision predated exact-restore support, so the prior split was re-derived from its earlier CTC using current salary rules.'
                : 'Revision undone successfully';
            dispatch(showToast({ description, variant: 'success' }));
            refreshAll();
        } else {
            dispatch(
                showToast({
                    description: result.errorMessage || 'Failed to undo revision',
                    variant: 'error',
                })
            );
        }
    };

    // Only gate on the very first load (breakdown not yet fetched) — gating on ctcLoading
    // too would unmount this whole tab, including any open modal, on every refetch
    // (e.g. the one Revise Salary/Undo trigger right after a successful save), wiping out
    // the modal's own local state (its success screen) before the user ever sees it.
    if (!breakdown) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    return (
        <Flex vertical gap={16} className="pt-6">
            <Row gutter={24}>
                <Col xs={24} md={15}>
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                        <Flex vertical gap={16}>
                            <Flex justify="center" align="center" style={{ position: 'relative' }}>
                                <Flex vertical align="center">
                                    <Text className="text-sm" style={{ color: '#535862' }}>
                                        Annual CTC
                                    </Text>
                                    <Text
                                        className="font-semibold"
                                        style={{ fontSize: 24, color: '#181D27' }}
                                    >
                                        {fmtRupees(breakdown.annualCTC)}
                                    </Text>
                                    <Text className="text-sm" style={{ color: '#535862' }}>
                                        = {fmtRupees(breakdown.monthlyCTC)} / month
                                    </Text>
                                    {displayRevisionHistory.length > 0 && (
                                        <Text
                                            className="text-xs"
                                            style={{ color: '#94A3B8', cursor: 'pointer' }}
                                            onClick={() =>
                                                revisionHistoryRef.current?.scrollIntoView({
                                                    behavior: 'smooth',
                                                })
                                            }
                                        >
                                            Last revised effective{' '}
                                            {dayjs(displayRevisionHistory[0].effectiveFrom).format(
                                                'MMMM YYYY'
                                            )}
                                            {displayRevisionHistory[0].reason
                                                ? ` · ${displayRevisionHistory[0].reason}`
                                                : ''}{' '}
                                            — full history below
                                        </Text>
                                    )}
                                </Flex>
                                <Button
                                    type="primary"
                                    style={{ position: 'absolute', right: 0 }}
                                    onClick={() => setReviseModalOpen(true)}
                                >
                                    Revise Salary
                                </Button>
                            </Flex>

                            <CtcBreakdownCard
                                breakdown={breakdown}
                                editable
                                lockStatutoryDeductions
                                hideNote
                                onAddEarning={() => {
                                    setSelectedRecordData(null);
                                    setSalaryModalOpen(true);
                                }}
                                onEditEarning={handleEditEarning}
                                onRemoveEarning={handleRemoveEarning}
                                onAddDeduction={() => {
                                    setSelectedRecordData(null);
                                    setDeductionModalOpen(true);
                                }}
                                onEditDeduction={handleEditDeduction}
                                onRemoveDeduction={handleRemoveDeduction}
                                incomeTax={
                                    tdsInfo?.isOldRegime
                                        ? {
                                              amount: tdsInfo.amount ?? 0,
                                              badge:
                                                  tdsInfo.amount != null
                                                      ? 'Old Tax Regime — entered by HR'
                                                      : 'Old Tax Regime — not entered yet',
                                              // TDS is edited from the Salary Profile tab only — the edit
                                              // action and "Applies from" label are hidden here.
                                              // onEdit: () => setTdsModalOpen(true),
                                              // footnote: (
                                              //     <Flex wrap align="center" gap={12}>
                                              //         <Button
                                              //             type="link"
                                              //             danger
                                              //             data-testid="ctc-edit-tds-button"
                                              //             icon={<EditOutlined />}
                                              //             className="px-0 h-auto text-xs"
                                              //             onClick={() => setTdsModalOpen(true)}
                                              //         >
                                              //             Edit TDS
                                              //         </Button>
                                              //         {tdsInfo.effectiveFrom && (
                                              //             <span>
                                              //                 Applies from{' '}
                                              //                 {dayjs(
                                              //                     new Date(tdsInfo.effectiveFrom.year, tdsInfo.effectiveFrom.month - 1, 1)
                                              //                 ).format('MMM YYYY')}
                                              //             </span>
                                              //         )}
                                              //     </Flex>
                                              // ),
                                          }
                                        : undefined
                                }
                            />
                            {/* TDS is edited from the Salary Profile tab only.
                            {tdsInfo?.isOldRegime && (
                                <EditTdsModal
                                    open={tdsModalOpen}
                                    month={currentMonth}
                                    year={currentYear}
                                    currentAmount={tdsInfo.amount ?? 0}
                                    allowMonthChange
                                    onCancel={() => setTdsModalOpen(false)}
                                    onSave={saveTds}
                                />
                            )} */}

                            <div ref={revisionHistoryRef}>
                                <RevisionHistorySection
                                    entries={displayRevisionHistory}
                                    isLoading={revisionHistoryLoading}
                                    onUndoLatest={() => setUndoConfirmOpen(true)}
                                    undoLoading={undoLoading}
                                />
                            </div>
                        </Flex>
                    </div>
                </Col>
                <Col xs={24} md={9}>
                    <HowThisWorksPanel employeeName={employeeName} breakdown={breakdown} />
                </Col>
            </Row>

            {salaryModalOpen && (
                <EmployeeSalaryCompModal
                    open={salaryModalOpen}
                    handleCancel={() => setSalaryModalOpen(false)}
                    selectedRecordData={selectedRecordData}
                    reloadTable={handleReloadAndRefresh}
                    employeeId={employeeId}
                />
            )}

            {deductionModalOpen && (
                <EmployeeDeductionModal
                    open={deductionModalOpen}
                    employeeId={employeeId}
                    handleCancel={() => setDeductionModalOpen(false)}
                    selectedRecordData={selectedRecordData}
                    reloadTable={handleReloadAndRefresh}
                />
            )}

            {basicModalOpen && (
                <EditBasicSalaryModal
                    open={basicModalOpen}
                    breakdown={breakdown}
                    onCancel={() => setBasicModalOpen(false)}
                    onSave={handleSaveBasicSalary}
                />
            )}

            {editingEarningComponent && (
                <EditEarningComponentModal
                    open={!!editingEarningComponent}
                    breakdown={breakdown}
                    component={editingEarningComponent}
                    employeeName={employeeName}
                    onCancel={() => setEditingEarningComponent(null)}
                    onSave={handleSaveEarningComponent}
                />
            )}

            {reviseModalOpen && (
                <ReviseSalaryModal
                    open={reviseModalOpen}
                    employeeName={employeeName}
                    breakdown={breakdown}
                    revisionHistory={revisionHistory}
                    onCancel={() => setReviseModalOpen(false)}
                    onSave={handleReviseSalary}
                />
            )}

            <ConfirmationModal
                isOpen={!!confirmTarget}
                handleCancel={() => setConfirmTarget(null)}
                title={`Are you sure you want to remove "${confirmTarget?.label}"?`}
                handleSubmit={handleConfirmDelete}
                isLoading={confirmTarget?.type === 'earning' ? deletingSalary : deletingDeduction}
            />

            <ConfirmationModal
                isOpen={undoConfirmOpen}
                handleCancel={() => setUndoConfirmOpen(false)}
                title="Undo the latest salary revision? This restores the Basic Salary and Special Allowance amounts from before it."
                handleSubmit={handleUndoLatest}
                isLoading={undoLoading}
            />
        </Flex>
    );
};

export default SalaryStructureTab;
