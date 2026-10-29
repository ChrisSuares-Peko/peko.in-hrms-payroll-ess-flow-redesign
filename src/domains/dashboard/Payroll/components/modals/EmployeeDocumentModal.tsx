import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useDocumentCreate from '../../hooks/docAndAssetsHooks/useAddDocApi';
import useDocumentUpdate from '../../hooks/docAndAssetsHooks/useUpdateDocumentApi';
import { employeeDocSchema } from '../../schema/docAndAssets';
import { formatDocName, documentOptions, RequiredExpiryDateDocs } from '../../utils/employeeDetails/utils';

interface DocumentModalProps {
    open: boolean;
    handleCancel: () => void;
    setRefresh: (value: any) => void;
    selectedRowData: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    EmpName?: string;
    employeeData?: any;
}

const DocumentsModal = ({
    open,
    handleCancel,
    setRefresh,
    selectedRowData,
    reloadTable,
    employeeIdFromProfile,
    EmpName,
    employeeData,
}: DocumentModalProps) => {
    const { handleDocumentCreation,isLoading:isAddLoading } = useDocumentCreate(handleCancel);
    const { handleDocumentUpdate,isLoading:isUpdateLoading } = useDocumentUpdate(handleCancel);

    const employee = employeeData.id;
    const handleFormSubmit = async (values: any) => {
        if (selectedRowData) {
            values.employee = employee;
            await handleDocumentUpdate(selectedRowData?._id, employeeIdFromProfile, values);
        } else {
            values.employee = employee;
            await handleDocumentCreation(values);
        }

        handleCancel();
        setRefresh((p: any) => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRowData ? 'Edit Document' : 'Add Document'}
            open={open}
            // isLoading={isLoading}
            handleCancel={handleCancel}
            isLoading={selectedRowData ? isUpdateLoading : isAddLoading}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                name: selectedRowData?.name ? formatDocName(selectedRowData?.name) : '',
                employee: EmpName || employeeData._id,
                expiryDate:selectedRowData?.expiryDate ? dayjs(new Date(selectedRowData?.expiryDate)) : '',

                url: selectedRowData?.url || '',
            }}
            validationSchema={employeeDocSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInputWithSearch
                        isRequired
                        label="Document Name"
                        name="name"
                        placeholder="Document Name"
                        classes=" rounded-sm "
                        options={documentOptions}
                    />

                    <DatePickerInput
                        name="expiryDate"
                        label="Expiry Date"
                        placeholder="Select expiry date"
                        classes="w-full"

                        needConfirm={false}
                        isRequired={RequiredExpiryDateDocs.includes(values.name)}
                        minDate={dayjs(new Date())}
                    />

                    <FileUploadInput
                        name="url"
                        label="Document"
                        format="attachmentFormat"
                        showNotification
                        showFileName
                        subLabel='(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)'
                        allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                        isRequired
                        maxFileSize={5120}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default DocumentsModal;
