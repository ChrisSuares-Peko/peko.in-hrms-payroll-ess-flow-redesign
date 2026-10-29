import React from 'react';

import { Flex, Form, Space, Typography } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useChequeBookCreate from '../../hooks/financialDocHooks/useCreateChequeBookApi';
import { useUpdateChequeBook } from '../../hooks/financialDocHooks/useUpdateChequeBookApi';
import { chequeBookSchema } from '../../schema/index';
import { chequeBookCurrencies, chequeBookStatus } from '../../utils/enumValues';

interface ChequeBookModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    reloadInfo?: React.Dispatch<React.SetStateAction<boolean>>;
    setRefState?: (num: number) => void;
}

const ChequeBookModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    reloadInfo,
    setRefState,
}: ChequeBookModalProps) => {
    const { handleChequeBookCreation, submitLoading: creationLoading } =
        useChequeBookCreate(handleCancel);
    const { updateCheqBookDetails, submitLoading: updationLoading } =
        useUpdateChequeBook(handleCancel);

    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateCheqBookDetails({ ...values }, selectedRecordData?.id);
        } else {
            await handleChequeBookCreation(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
        if (reloadInfo) reloadInfo(p => !p);
        if (setRefState) setRefState(new Date().valueOf());
    };
    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Cheque Book' : 'Add Cheque Book'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                bookId: selectedRecordData?.bookId,
                accountName: selectedRecordData?.accountName ?? '',
                accountNumber: selectedRecordData?.accountNumber ?? '',
                bankName: selectedRecordData?.bankName ?? '',
                currency: selectedRecordData?.currency,
                currencyDivision: selectedRecordData?.currencyDivision,
                chequeStarting: selectedRecordData?.chequeStarting,
                numberOfLeaves: selectedRecordData?.numberOfLeaves,
                accountBalance: selectedRecordData?.accountBalance,
                status: selectedRecordData?.status ?? '',
                document: selectedRecordData?.document ?? '',
                documentBase: '',
            }}
            reinitialise
            validationSchema={chequeBookSchema}
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="bookId"
                        type="text"
                        placeholder="Enter cheque book ID"
                        label="Cheque Book ID"
                        isRequired
                        allowNumbersOnly
                        maxLength={30}
                    />
                    <TextInput
                        name="accountName"
                        type="text"
                        label="Account Holder Name"
                        placeholder="Enter account holder name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={30}
                    />
                    <TextInput
                        name="accountNumber"
                        type="text"
                        label="Account Number"
                        placeholder="Enter account number"
                        isRequired
                        allowNumbersOnly
                        maxLength={16}
                        minLength={15}
                    />
                    <TextInput
                        name="bankName"
                        type="text"
                        label="Bank Name"
                        placeholder="Enter bank name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={30}
                    />
                    <SelectInput
                        name="currency"
                        label="Currency"
                        placeholder="Select currency"
                        options={chequeBookCurrencies}
                    />
                    <TextInput
                        name="currencyDivision"
                        type="text"
                        placeholder="Enter currency division"
                        label="Currency Division"
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="chequeStarting"
                        type="text"
                        placeholder="Enter cheque starting number"
                        label="Cheque Starting Number"
                        allowAlphabetsAndNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="numberOfLeaves"
                        type="text"
                        placeholder="Enter no. of leaves"
                        label="No. of leaves"
                        allowNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="accountBalance"
                        type="text"
                        label="Account Balance"
                        placeholder="Enter account balance"
                        allowDecimalsOnly
                        maxLength={30}
                    />
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        isRequired
                        options={chequeBookStatus}
                    />
                    <Flex vertical>
                        <Space direction="vertical" size={0}>
                            <Typography.Text>Upload Cheque Copy</Typography.Text>

                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                (File Formats Supported: JPG, JPEG, PNG, and PDF. Max. size: 2 MB)
                            </Typography.Text>
                        </Space>
                        <FileUploadInput
                            name="documentBase"
                            label=""
                            format="documentFormat"
                            showFileName
                            allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                            maxFileSize={2048}
                        />
                    </Flex>
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default ChequeBookModal;
