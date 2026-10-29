import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useLeaveActions } from '../../../hooks/leaveSettings/useLeaveComponentApi';
import { leaveConfigFormSchema } from '../../../schema/organizationSettings';
import LeavePolicyForm from '../forms/LeavePolicyForm';

interface LeavePolicyModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeId: string;
}

const LeavePolicyModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeId,
}: LeavePolicyModalProps) => {
    const { addEmployeeLeaveAction, updateLeaveAction, isUpdating, isEmployeeAdding } =
        useLeaveActions(handleCancel);

    const handleFormSubmit = async (values: any) => {
        if (!selectedRecordData) {
            await addEmployeeLeaveAction({
                ...values,
                employeeId,
            });
        } else {
            let payload = {
                ...values,
                employeeId,
            };

            if (selectedRecordData.isGlobal) {
                payload = {
                    ...payload,
                    globalComponentId: selectedRecordData.id,
                };
            } else {
                payload = {
                    ...payload,
                    id: selectedRecordData.id,
                };
            }

            await updateLeaveAction(payload, selectedRecordData.id);
        }

        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Leave Policy' : 'Add New Leave Policy'}
            open={open}
            isLoading={selectedRecordData ? isUpdating : isEmployeeAdding}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                leaveType: selectedRecordData?.leaveType || '',
                accrualType: selectedRecordData?.accrualType || '',
                accrualRate: selectedRecordData?.accrualRate || '',
                maximumAccrual: selectedRecordData?.maximumAccrual || '',
                leaveBalanceCarryover: selectedRecordData?.leaveBalanceCarryover || '',
                maximumNumberOfLeaves: selectedRecordData?.maximumNumberOfLeaves || '',
                applicableGender: selectedRecordData?.applicableGender || '',
            }}
            validationSchema={leaveConfigFormSchema}
        >
            <Flex vertical className="w-full">
                <LeavePolicyForm selectedRecordData={selectedRecordData} />
            </Flex>
        </CustomModalWithForm>
    );
};

export default LeavePolicyModal;
