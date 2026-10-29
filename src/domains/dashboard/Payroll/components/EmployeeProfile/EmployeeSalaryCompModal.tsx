import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';

import EmployeeSalaryCompModalForm from './EmployeeSalaryCompModalForm';
import { useSalaryCompActions } from '../../hooks/OrganizationSettings/useSalaryComponentApi';
import { salaryCompFormSchema } from '../../schema/organizationSettings';
import { resetState } from '../../slices/orgSettings';

interface EmployeeSalaryCompModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeId: string;
}

const EmployeeSalaryCompModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeId,
}: EmployeeSalaryCompModalProps) => {
    const dispatch = useAppDispatch();
    const { addEmployeeSalaryCompAction, updateEmployeeSalaryCompAction, isAdding, isUpdating } =
        useSalaryCompActions(handleCancel);
    dispatch(resetState());
    const handleFormSubmit = async (values: any) => {
        // addEmployeeSalaryCompAction/updateEmployeeSalaryCompAction already close this
        // modal themselves on success — only reload the table when they actually succeeded,
        // rather than unconditionally, so a genuine backend rejection (duplicate name,
        // doesn't fit the available CTC, etc.) leaves the modal open with what the user
        // typed intact instead of silently discarding it.
        const result = selectedRecordData
            ? await updateEmployeeSalaryCompAction(values, selectedRecordData.id, selectedRecordData?.isGlobal, employeeId)
            : await addEmployeeSalaryCompAction(values, employeeId);
        if (result && reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Component' : 'Add New Component'}
            open={open}
            isLoading={selectedRecordData ? isUpdating : isAdding}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            reinitialise
            initialValues={{
                componentName: selectedRecordData?.componentName || '',
                calculationType: selectedRecordData?.calculationType || '',
                amountPercentage: selectedRecordData?.amountPercentage || '',
                calculationBasedOn: selectedRecordData?.calculationBasedOn || '',
                status: selectedRecordData?.status || '',
                isPartOfGross: selectedRecordData?.isPartOfGross ?? true,
            }}
            validationSchema={salaryCompFormSchema}
        >
            <Flex vertical className=" w-full">
                <EmployeeSalaryCompModalForm selectedRecordData={selectedRecordData} />
            </Flex>
        </CustomModalWithForm>
    );
};

export default EmployeeSalaryCompModal;
