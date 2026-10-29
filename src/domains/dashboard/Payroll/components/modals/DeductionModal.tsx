import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useAddDeduction } from '../../hooks/employeeSalaryHooks/DeductionHooks/useAddDeductionApi';
import { useUpdateDeduction } from '../../hooks/employeeSalaryHooks/DeductionHooks/useUpdateDeductionApi';
import { payrollDeductionSchema, payrollEditDeductionSchema } from '../../schema/EmployeeSalary';
import {
    DeductionEditFormType,
    DeductionFormType,
    deductionTableType,
    ONE_TIME_DEDUCTION_TYPES,
} from '../../types/salaryProfileTypes/deductionTypes';
import DeductionForm from '../Forms/DeductionForm';

type deductionModalProps = {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: deductionTableType | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month: number;
    year: number;
};

const DeductionModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: deductionModalProps) => {
    const { deductionAdd } = useAddDeduction(handleCancel);
    const { deductionUpdate } = useUpdateDeduction(handleCancel);

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Deduction' : 'Add Deduction'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async (values: DeductionFormType | DeductionEditFormType) => {
                if (selectedRecordData) {
                    await deductionUpdate(
                        values as DeductionEditFormType,
                        selectedRecordData,
                        employeeIdFromProfile!
                    );
                } else {
                    // Belongs to the month selected on Salary Details — it is recovered from
                    // that month's pay (anything over the 50% limit carries to the next).
                    await deductionAdd({ ...(values as DeductionFormType), month: Number(month), year: Number(year) });
                }
                if (reloadTable) reloadTable(p => !p);
            }}
            initialValues={{
                employeeId: selectedRecordData?.employeeId || employeeIdFromProfile || '',
                // Legacy rows predate the type list — their free text is not a valid choice,
                // so editing one asks for a type.
                deductionFor:
                    selectedRecordData?.deductionFor ||
                    (ONE_TIME_DEDUCTION_TYPES as readonly string[]).find(t => t === selectedRecordData?.deductionType) ||
                    '',
                note: selectedRecordData?.note || '',
                amount: selectedRecordData?.deductionAmount ?? '',
            }}
            reinitialise
            validationSchema={selectedRecordData ? payrollEditDeductionSchema : payrollDeductionSchema}
        >
            <Flex vertical className="w-full">
                <DeductionForm
                    year={year}
                    month={Number(month)}
                    selectedRecordData={selectedRecordData}
                    employeeIdFromProfile={employeeIdFromProfile}
                />
            </Flex>
        </CustomModalWithForm>
    );
};

export default DeductionModal;
