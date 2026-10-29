import React from 'react';

import { Flex, Form, Space, Typography } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateOwnerDoc } from '../../hooks/ownerDocHooks/useUpdateOwnerDocApi';
import { ownerBankDocSchema } from '../../schema';

interface OwnerBankDetailsModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    owner?: any;
}

const OwnerBankDetailsModal = ({
    open,
    handleCancel,
    selectedData,
    reloadTable,
    owner,
}: OwnerBankDetailsModalProps) => {
    const { updateOwnerDoc, submitLoading } = useUpdateOwnerDoc(handleCancel);
    const handleFormSubmit = async (values: any) => {
        await updateOwnerDoc({ [selectedData.documentType]: { ...values } }, selectedData);
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle={selectedData ? `Update Bank Details` : 'Add Bank Details'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                documentType: selectedData?.documentType ?? '',
                name: selectedData?.name ?? '',
                iban: selectedData?.iban ?? '',
                swiftcode: selectedData?.swiftcode ?? '',
                document: selectedData?.document ?? '',
            }}
            validationSchema={ownerBankDocSchema}
            reinitialise
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    {/* <TextInput
                        name="documentType"
                        type="text"
                        placeholder="Enter name"
                        label="Document Name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        isDisabled
                        maxLength={50}
                    /> */}
                    <TextInput
                        name="name"
                        type="text"
                        placeholder="Enter account holder name"
                        label="Account Holder Name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="swiftcode"
                        type="text"
                        placeholder="Enter swift code"
                        label="Swift Code"
                        isRequired
                        maxLength={11}
                        minLength={8}
                        allowAlphabetsAndNumbersOnly
                    />
                    <TextInput
                        name="iban"
                        type="text"
                        label="IBAN Number"
                        placeholder="Enter IBAN"
                        isRequired
                        allowAlphabetsAndNumbersOnly
                        maxLength={23}
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

export default OwnerBankDetailsModal;
