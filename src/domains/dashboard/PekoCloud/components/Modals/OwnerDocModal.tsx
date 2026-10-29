import React from 'react';

import { Flex, Form, Space, Typography } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateOwnerDoc } from '../../hooks/ownerDocHooks/useUpdateOwnerDocApi';
import { ownerDocSchema } from '../../schema';

interface OwnerDocModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    owner?: any;
}

const OwnerDocModal = ({
    open,
    handleCancel,
    selectedData,
    reloadTable,
    owner,
}: OwnerDocModalProps) => {
    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        if (string === 'emiratesId') return 'Emirates ID';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    const { updateOwnerDoc, submitLoading } = useUpdateOwnerDoc(handleCancel);
    const handleFormSubmit = async (values: any) => {
        await updateOwnerDoc({ [selectedData.documentType]: { ...values } }, selectedData);
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle={
                selectedData
                    ? `Update ${capitalizeFirstLetter(selectedData?.documentType ?? 'document')}`
                    : 'Add Document Details'
            }
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                documentType: capitalizeFirstLetter(selectedData?.documentType ?? ''),
                issueDate: selectedData?.issueDate ?? '',
                expireDate: selectedData?.expireDate ?? '',
                documentNumber: selectedData?.documentNumber ?? '',
                document: selectedData?.document ?? '',
            }}
            validationSchema={ownerDocSchema}
            reinitialise
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="documentType"
                        type="text"
                        placeholder="Enter document name"
                        label="Document Name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        isDisabled
                        maxLength={50}
                    />
                    <DatePickerInput
                        name="issueDate"
                        label="Issued Date"
                        placeholder="Select issued date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                        maxDate={
                            selectedData?.documentType === 'passport'
                                ? dayjs(new Date())
                                : undefined
                        }
                    />
                    <DatePickerInput
                        name="expireDate"
                        label="Expiry Date"
                        placeholder="Select expiry date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                        isDisabled={!values.issueDate}
                        minDate={values.issueDate && dayjs(values.issueDate)}
                    />
                    <TextInput
                        name="documentNumber"
                        type="text"
                        label="Document Number"
                        placeholder="Enter document number"
                        isRequired
                        allowAlphabetsAndNumbersOnly
                        maxLength={30}
                    />
                    <Flex vertical>
                        <Space direction="vertical" size={0}>
                            <Typography.Text>Upload Document Copy</Typography.Text>

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

export default OwnerDocModal;
