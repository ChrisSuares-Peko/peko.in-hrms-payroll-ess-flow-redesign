import React from 'react';

import { Flex, Form, Space, Typography } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useOwnerDocCreate from '../../hooks/ownerDocHooks/useCreateOwnerDocApi';
import useGeneralApi from '../../hooks/ownerDocHooks/useGetCountryApi';
import { useUpdateOwnerDoc } from '../../hooks/ownerDocHooks/useUpdateOwnerDocApi';
import { ownerDetailsSchema } from '../../schema';

interface OwnerDetailsModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    owner?: any;
}

const OwnerDetailsModal = ({
    open,
    handleCancel,
    selectedData,
    reloadTable,
    owner,
}: OwnerDetailsModalProps) => {
    const { countriesList } = useGeneralApi();
    const { handleOwnerDocCreation, submitLoading: creationLoading } =
        useOwnerDocCreate(handleCancel);
    const { updateOwnerDoc, submitLoading: updationLoading } = useUpdateOwnerDoc(handleCancel);
    const handleFormSubmit = async (values: any) => {
        if (selectedData) {
            await updateOwnerDoc({ ...values }, { ownerId: selectedData?.id });
            if (reloadTable) reloadTable(p => !p);
        } else {
            const res = await handleOwnerDocCreation(values);
            if (res && res?.status) {
                handleCancel();
                if (reloadTable) reloadTable(p => !p);
            }
        }
    };
    return (
        <CustomModalWithForm
            modalTitle={selectedData ? 'Edit Owner Details' : 'Add Owner Details'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                ownerName: selectedData?.ownerName ?? '',
                percentageOfShare: selectedData?.percentageOfShare
                    ? (Number(selectedData?.percentageOfShare).toFixed(2).toString() ?? '')
                    : '',
                homeAddress: selectedData?.homeAddress ?? '',
                nationality: selectedData?.nationality ?? '',
                profilePicture: selectedData?.profilePicture ?? '',
            }}
            validationSchema={ownerDetailsSchema}
            reinitialise
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="ownerName"
                        type="text"
                        placeholder="Enter owner name"
                        label="Owner Name"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                        minLength={3}
                    />
                    <TextInput
                        name="percentageOfShare"
                        type="text"
                        label="Percentage of Share"
                        placeholder="Enter percentage of share"
                        isRequired
                        allowTwoDecimalsOnly
                        maxLength={5}
                    />
                    <TextInput
                        name="homeAddress"
                        type="text"
                        label="Home Address"
                        placeholder="Enter home address"
                        isRequired
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                        minLength={5}
                    />
                    <SelectInputWithSearch
                        name="nationality"
                        label="Nationality"
                        placeholder="Select Nationality"
                        classes="rounded-sm"
                        options={countriesList}
                        isRequired
                    />
                    <Flex vertical>
                        <Space direction="vertical" size={0}>
                            <Typography.Text>Profile Picture</Typography.Text>

                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                (File Formats Supported: JPG, JPEG, PNG, and PDF. Max. size: 2 MB)
                            </Typography.Text>
                        </Space>
                        <FileUploadInput
                            name="profileImageBase"
                            label=""
                            format="profileImageFormat"
                            showFileName
                            allowedFileTypes={['image/jpeg', 'image/png']}
                            maxFileSize={2048}
                        />
                    </Flex>
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default OwnerDetailsModal;
