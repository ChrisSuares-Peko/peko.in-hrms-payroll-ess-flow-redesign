import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useEployeeBankApi } from '../../../hooks/employeeProfileHooks/useEmployeeBankApi';
import { bankSchema } from '../../../schema/bankDetails/bankDetailsSchema';
import BankDetailsForm from '../forms/BankDetailsForm';

interface DeductionCompModalProps {
    open: boolean;
    employeeId: string;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

const BankDetailsModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeId,
}: DeductionCompModalProps) => {
    const { addBankDetailsAction, updateBankDetailsAction, isUpdating, isAdding } =
        useEployeeBankApi(handleCancel);

    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateBankDetailsAction({
                ...values,
                bankId: selectedRecordData.id,
            });
        } else {
            await addBankDetailsAction({
                ...values,
                employeeId, // Include employeeId in the payload
            });
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Bank Details' : 'Add New Bank Details'}
            isLoading={selectedRecordData ? isUpdating : isAdding}
            open={open}
            validateOnChange
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                accountName: selectedRecordData?.accountName || '',
                accountNumber: selectedRecordData?.accountNumber || '',
                bankName: selectedRecordData?.bankName || '',
                ifscCode: selectedRecordData?.ifscCode || '',
                isDefaultAccount: selectedRecordData?.isDefaultAccount || false,
            }}
            validationSchema={bankSchema}
        >
            <Flex vertical className="w-full">
                <BankDetailsForm selectedRecordData={selectedRecordData} />
            </Flex>
        </CustomModalWithForm>
    );
};

export default BankDetailsModal;
