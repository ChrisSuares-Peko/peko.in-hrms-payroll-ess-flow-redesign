import React, { useState } from 'react';

import { useLocation } from 'react-router-dom';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import StatutoryCardShell from './StatutoryCardShell';
import { PROFESSIONAL_TAX_INFO } from './statutoryInfoContent';
import { useDeductionActions } from '../../../hooks/employeeProfileHooks/useEmployeeDeductionApi';
import { ProfessionalTaxCardData } from '../../../hooks/employeeProfileHooks/useEmployeeStatutoryDetails';
import { useGetAllDeduction } from '../../../hooks/employeeProfileHooks/useGetEmployeeDeductionApi';
import UpdatePtAmountModal from '../modals/UpdatePtAmountModal';

interface ProfessionalTaxStatutoryCardProps {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    data: ProfessionalTaxCardData;
    toggleLoading?: boolean;
    onToggle: (checked: boolean) => void;
    onAmountUpdated: () => void;
}

const ProfessionalTaxStatutoryCard = ({
    employeeId,
    employeeName,
    employeeCode,
    data,
    toggleLoading,
    onToggle,
    onAmountUpdated,
}: ProfessionalTaxStatutoryCardProps) => {
    const location = useLocation();
    const { month, year } = location.state || {};
    const [modalOpen, setModalOpen] = useState(false);
    const [reloadTable, setReloadTable] = useState(false);

    const { data: deductions } = useGetAllDeduction(employeeId, 1, 100, year, month, reloadTable);
    const ptComponent = deductions.find(d => d.deductionName === 'Professional Tax');
    const { addDeductionAction, updateDeductionAction, isAdding, isUpdating } = useDeductionActions();

    let basis = '—';
    if (data.hasComponent) {
        basis = data.isEmployeeSpecific
            ? 'Set on this employee — added with their salary structure'
            : "Using the organization's default rate";
    }

    const handleSave = async (amount: number) => {
        const basePayload = {
            deductionName: 'Professional Tax',
            calculationType: 'FIXED',
            amountPercentage: amount,
            status: 'ACTIVE',
        };

        let result;
        if (ptComponent?.isGlobal) {
            result = await addDeductionAction({
                ...basePayload,
                calculationBasis: ptComponent.calculationBasis || 'MONTHLY',
                eId: employeeId,
                globalComponentId: ptComponent.id,
            } as any);
        } else if (ptComponent) {
            result = await updateDeductionAction(
                { ...basePayload, calculationBasis: ptComponent.calculationBasis || 'MONTHLY' } as any,
                ptComponent.id
            );
        } else {
            result = await addDeductionAction({
                ...basePayload,
                calculationBasis: 'MONTHLY',
                eId: employeeId,
            } as any);
        }

        if (result) {
            setReloadTable(prev => !prev);
            onAmountUpdated();
        }
        return result;
    };

    return (
        <>
            <StatutoryCardShell
                title="Professional Tax"
                statusText={data.isActive ? 'Active' : 'Inactive'}
                statusPositive={data.isActive}
                actionLabel="Update Amount"
                onAction={() => setModalOpen(true)}
                showToggle
                toggleChecked={data.isActive}
                toggleLoading={toggleLoading}
                onToggle={onToggle}
                infoContent={PROFESSIONAL_TAX_INFO}
                fields={[
                    {
                        label: 'Monthly Deduction',
                        value: `₹${formatNumberWithLocalStringWithoutDecimalPoint(Math.round(data.monthlyDeduction))}`,
                    },
                    { label: 'Basis', value: basis },
                ]}
            />
            {modalOpen && (
                <UpdatePtAmountModal
                    open={modalOpen}
                    employeeName={employeeName}
                    employeeCode={employeeCode}
                    initialAmount={data.monthlyDeduction}
                    isLoading={isAdding || isUpdating}
                    onCancel={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

export default ProfessionalTaxStatutoryCard;
