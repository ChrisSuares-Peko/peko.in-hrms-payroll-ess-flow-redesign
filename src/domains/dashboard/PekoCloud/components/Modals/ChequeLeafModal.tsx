import React, { useRef } from 'react';

import { Flex, Form, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { FormikProps } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useChequeLeafCreate from '../../hooks/financialDocHooks/useCreateChequeLeafApi';
import { useGetAllChequeBookListApi } from '../../hooks/financialDocHooks/useGetChequeBooksLIstApi';
import { useUpdateChequeLeaf } from '../../hooks/financialDocHooks/useUpdateCheckLeafApi';
import { chequeLeafSchema } from '../../schema/index';
import { chequeLeafStatus } from '../../utils/enumValues';

interface ChequeModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    reloadInfo?: React.Dispatch<React.SetStateAction<boolean>>;
    setRefState?: (num: number) => void;
}

const ChequeLeafModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    reloadInfo,
    setRefState,
}: ChequeModalProps) => {
    const { handleChequeLeafCreation, submitLoading: creationLoading } =
        useChequeLeafCreate(handleCancel);
    const { updateChequeLeafDetails, submitLoading: updationLoading } =
        useUpdateChequeLeaf(handleCancel);
    const { data: booksList, generateChequeBooksDropdown } = useGetAllChequeBookListApi();

    const chequeLeaf = useRef<FormikProps<any>>(null);

    const handleFormSubmit = async (values: any) => {
        if (!values.dueDate) {
            values.dueDate = null;
        }
        if (selectedRecordData) {
            await updateChequeLeafDetails({ ...values }, selectedRecordData?.id);
        } else {
            await handleChequeLeafCreation(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
        if (reloadInfo) reloadInfo(p => !p);
        if (setRefState) setRefState(new Date().valueOf());
    };
    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Cheque' : 'Add Cheque'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                cloudChequeBookId: selectedRecordData?.cloudChequeBookId,
                type: selectedRecordData?.type,
                payeeName: selectedRecordData?.payeeName ?? '',
                chequeBookNumber: selectedRecordData?.chequeBookNumber ?? '',
                chequeNumber: selectedRecordData?.chequeNumber ?? '',
                bankAccount: selectedRecordData?.bankAccount ?? '',
                dateOfCheque: selectedRecordData?.dateOfCheque ?? '',
                dueDate: selectedRecordData?.dueDate,
                amount: selectedRecordData?.amount ?? '',
                status: selectedRecordData?.status ?? '',
                document: selectedRecordData?.document ?? '',
                documentBase: '',
                remarks: selectedRecordData?.remarks ?? '',
                signedBy: selectedRecordData?.signedBy ?? '',
                voucherReferance: selectedRecordData?.voucherReferance ?? '',
            }}
            reinitialise
            formRefName={chequeLeaf}
            validationSchema={chequeLeafSchema}
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInputWithSearch
                        name="cloudChequeBookId"
                        options={generateChequeBooksDropdown(booksList) || []}
                        placeholder="Select cheque book"
                        label="Cheque Book"
                        handleChange={value => {
                            // eslint-disable-next-line eqeqeq
                            const bookData = booksList.find(book => book.id == value);
                            chequeLeaf.current?.setFieldValue('chequeBookNumber', bookData?.bookId);
                            chequeLeaf.current?.setFieldValue('bankAccount', bookData?.bankName);
                            chequeLeaf.current?.setFieldValue('type', 'Debit');
                        }}
                    />
                    <TextInput
                        name="chequeBookNumber"
                        type="text"
                        label="Cheque Book Number"
                        placeholder="Enter cheque book number"
                        isRequired
                        allowNumbersOnly
                        isDisabled={chequeLeaf.current?.values?.cloudChequeBookId}
                        maxLength={40}
                    />
                    <SelectInput
                        name="type"
                        label="Cheque Type"
                        placeholder="Select cheque type"
                        isRequired
                        isDisabled={chequeLeaf.current?.values?.cloudChequeBookId}
                        options={[
                            { label: 'Credit', value: 'Credit' },
                            { label: 'Debit', value: 'Debit' },
                        ]}
                    />
                    <TextInput
                        name="payeeName"
                        type="text"
                        label="Payee Name"
                        placeholder="Enter payee name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={30}
                    />
                    <TextInput
                        name="chequeNumber"
                        type="text"
                        label="Cheque Number"
                        placeholder="Enter cheque number"
                        isRequired
                        allowNumbersOnly
                        maxLength={30}
                    />
                    <TextInput
                        name="bankAccount"
                        type="text"
                        label="Bank Name"
                        placeholder="Enter bank name"
                        isDisabled={chequeLeaf.current?.values?.cloudChequeBookId}
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={30}
                    />
                    <DatePickerInput
                        name="dateOfCheque"
                        label="Cheque Date"
                        placeholder="Select cheque date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                        maxDate={values.dueDate && dayjs(values.dueDate)}
                    />
                    <DatePickerInput
                        name="dueDate"
                        label="Due Date"
                        placeholder="Select due date"
                        classes="w-full"
                        needConfirm={false}
                        minDate={values.dateOfCheque && dayjs(values.dateOfCheque)}
                    />
                    <TextInput
                        name="amount"
                        type="text"
                        label="Amount"
                        placeholder="Enter amount"
                        isRequired
                        allowDecimalsOnly
                        maxLength={9}
                    />{' '}
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        options={chequeLeafStatus}
                    />
                    <TextInput
                        name="remarks"
                        type="text"
                        label="Remarks"
                        placeholder="Enter remarks"
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={30}
                    />
                    <TextInput
                        name="signedBy"
                        type="text"
                        label="Signed By"
                        placeholder="Enter name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={30}
                    />
                    <TextInput
                        name="voucherReferance"
                        type="text"
                        label="Voucher Reference"
                        placeholder="Enter voucher reference"
                        allowAlphabetsAndNumbersOnly
                        maxLength={30}
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
export default ChequeLeafModal;
