import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import LeavePolicyForm from './LeavePolicyForm';
import { useLeaveActions } from '../../hooks/leaveSettings/useLeaveComponentApi';
import { leaveConfigFormSchema } from '../../schema/organizationSettings';

interface LeavePolicyModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

const LeavePolicyModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
}: LeavePolicyModalProps) => {
    const { addLeaveAction, updateLeaveAction, isAdding, isUpdating } =
        useLeaveActions(handleCancel);

    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateLeaveAction(values, selectedRecordData.id);
        } else {
            await addLeaveAction(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Leave Policy' : 'Add New Leave Policy'}
            open={open}
            isLoading={selectedRecordData ? isUpdating : isAdding}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                leaveType: selectedRecordData?.leaveType || '',
                accrualType: selectedRecordData?.accrualType || '',
                accrualRate: selectedRecordData?.accrualRate || '',
                maximumAccrual: selectedRecordData?.maximumAccrual || '',
                leaveBalanceCarryover: selectedRecordData?.leaveBalanceCarryover || '',
                maximumNumberOfLeaves: selectedRecordData?.maximumNumberOfLeaves || '',
                applicableGender: selectedRecordData?.applicableGender || 'ALL',
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
