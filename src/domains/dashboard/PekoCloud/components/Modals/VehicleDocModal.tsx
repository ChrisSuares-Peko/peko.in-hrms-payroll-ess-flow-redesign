import React from 'react';

import { Flex, Form, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useVehicleDocCreate from '../../hooks/fleetHooks/useCreateVehicleDocApi';
import { useUpdateVehicleDoc } from '../../hooks/fleetHooks/useUpdateVehicleDocApi';
import { companyDocSchema } from '../../schema';

interface VehicleDocModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VehicleDocModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
}: VehicleDocModalProps) => {
    const location = useLocation();
    const { fleetId } = location.state;
    const { handleVehicleDocCreation, submitLoading: creationLoading } =
        useVehicleDocCreate(handleCancel);
    const { updateVehicleDocs, submitLoading: updationLoading } = useUpdateVehicleDoc(handleCancel);
    const handleFormSubmit = async (values: any) => {
        if (!values.expireDate) {
            values.expireDate = null;
        }
        if (selectedRecordData) {
            await updateVehicleDocs({ ...values }, selectedRecordData?.id);
        } else {
            await handleVehicleDocCreation(values, fleetId);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Document' : 'Add Document'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                documentName: selectedRecordData?.documentName ?? '',
                documentNumber: selectedRecordData?.documentNumber ?? '',
                documentType: selectedRecordData?.documentType,
                issueDate: selectedRecordData?.issueDate ?? '',
                expireDate: selectedRecordData?.expireDate,
                document: selectedRecordData?.document ?? '',
                documentBase: '',
            }}
            reinitialise
            validationSchema={companyDocSchema}
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="documentName"
                        type="text"
                        placeholder="Enter document name"
                        label="Document Name"
                        isRequired
                        maxLength={20}
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
                    <TextInput
                        name="documentType"
                        type="text"
                        label="Document Type"
                        placeholder="Enter document type"
                        allowAlphabetsAndSpaceOnly
                        maxLength={20}
                    />
                    <DatePickerInput
                        name="issueDate"
                        label="Issued Date"
                        placeholder="Select issued date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                        maxDate={values.expireDate && dayjs(values.expireDate)}
                    />
                    <DatePickerInput
                        name="expireDate"
                        label="Expiry Date"
                        placeholder="Select expiry date"
                        classes="w-full"
                        needConfirm={false}
                        isDisabled={!values.issueDate}
                        minDate={values.issueDate && dayjs(values.issueDate)}
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
export default VehicleDocModal;
