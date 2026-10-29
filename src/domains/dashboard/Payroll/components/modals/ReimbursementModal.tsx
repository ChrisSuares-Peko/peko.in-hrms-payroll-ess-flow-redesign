import { useState } from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppSelector } from '@src/hooks/store';

import useReimbursementCreate from '../../hooks/employeeSalaryHooks/ReimbursementHooks/useAddReimbursementApi';
import { useUpdateReimbursement } from '../../hooks/employeeSalaryHooks/ReimbursementHooks/useUpdateReimbursementApi';
import { payrollReimbursementSchema } from '../../schema/EmployeeSalary';
import {
    ReimbursementRequestFormType,
    reimbursementTableType,
} from '../../types/salaryProfileTypes/ReimbursementTypes/index';
import ReimbursementForm, { expenseCategoryOptions } from '../Forms/ReimbursementForm';

const categoryValues = expenseCategoryOptions.map(o => o.value);

// expenseDetails is stored as a single string ("Category — Description", matching
// the ESS "Submit New Claim" format) — split back into the two form fields for editing.
const parseExpenseDetails = (expenseDetails?: string) => {
    if (!expenseDetails) return { category: '', description: '' };
    const [maybeCategory, ...rest] = expenseDetails.split(' — ');
    if (rest.length > 0 && categoryValues.includes(maybeCategory)) {
        return { category: maybeCategory, description: rest.join(' — ') };
    }
    if (categoryValues.includes(expenseDetails)) {
        return { category: expenseDetails, description: '' };
    }
    // Pre-existing free-text record that doesn't match the new format.
    return { category: 'Others', description: expenseDetails };
};

type ReimbursementModalProps = {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: reimbursementTableType | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
};

const ReimbursementModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: ReimbursementModalProps) => {
    const { handleReimbursementCreation, isCreating } = useReimbursementCreate(handleCancel);
    const { updateReimbursementId, isUpdating } = useUpdateReimbursement(handleCancel);
    const { dateOfJoin } = useAppSelector(state => state.reducer.payrollSalary);
    const [dateOfJoined, setDateOfJoin] = useState<string | undefined>();
    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Reimbursement' : 'Add Reimbursement'}
            open={open}
            isLoading={selectedRecordData ? isUpdating : isCreating}
            handleCancel={handleCancel}
            handleFormSubmit={async (values: ReimbursementRequestFormType) => {
                const { category, description, ...rest } = values;
                const payload = {
                    ...rest,
                    expenseDetails: [category, description].filter(Boolean).join(' — '),
                };
                if (selectedRecordData) {
                    await updateReimbursementId(payload, selectedRecordData);
                } else {
                    await handleReimbursementCreation(payload);
                }
                if (reloadTable) reloadTable(p => !p);
            }}
            initialValues={{
                employeeId: selectedRecordData?.employeeId || employeeIdFromProfile || '',
                expenseDate: selectedRecordData?.expenseDate || '',
                ...parseExpenseDetails(selectedRecordData?.expenseDetails),
                managerEmail: selectedRecordData?.managerEmail || '',
                totalPay: selectedRecordData?.amountPaid || '',
                paymentStatus: selectedRecordData?.paymentStatus || '',
            }}
            reinitialise
            validationSchema={payrollReimbursementSchema}
            validateOnChange
        >
            <Flex vertical className="w-full">
                <Flex className="text-gray-500 text-[.8rem] mb-4">
                    The total reimbursement amount to be credited to the employee, in addition to
                    their salary
                </Flex>

                <ReimbursementForm
                    selectedRecordData={selectedRecordData}
                    employeeIdFromProfile={employeeIdFromProfile}
                    dateOfJoin={dateOfJoin}
                    dateOfJoined={dateOfJoined}
                    setDateOfJoin={setDateOfJoin}
                    month={month}
                    year={year}
                />
            </Flex>
        </CustomModalWithForm>
    );
};

export default ReimbursementModal;
