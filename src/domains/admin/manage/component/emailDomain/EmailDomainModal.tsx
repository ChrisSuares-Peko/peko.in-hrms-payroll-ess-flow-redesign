import React from 'react';

import { Flex, Form } from 'antd';
import { useDispatch } from 'react-redux';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import emailWorkspaceSchema from '@src/domains/admin/manage/schema/emailWorkspaceSchema';
import { showToast } from '@src/slices/apiSlice';

import UseCreateEmailDomain from '../../hooks/emailDomain/useCreateEmailDomain';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    mode: string;
}
const EmailDomainModal = ({ handleCancel, open, data, setRefresh, mode }: modalProps) => {
    const { createNewEmailDomain, isLoading, allVendors, updateEmailDomainDetails } =
        UseCreateEmailDomain();
    const modalHeader = mode === 'edit' ? 'Edit Business Emails' : 'Add Business Emails';
    const dispatch = useDispatch();
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle={modalHeader}
            open={open}
            validationSchema={emailWorkspaceSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const emailsArray = values.pekoEmail
                    .split(/[,\s]+/)
                    .filter((email: string) => email.trim() !== '');
                let res: any;
                if (values.displayOrder === '') {
                    values.displayOrder = undefined;
                }
                if (values.id) {
                    res = await updateEmailDomainDetails({
                        ...values,
                        pekoEmail: emailsArray,
                    });
                } else {
                    res = await createNewEmailDomain({ ...values, pekoEmail: emailsArray });
                }
                if (res.status === true) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                    handleCancel();
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                id: data?.id || '',
                name: data?.name || '',
                type: data?.type || '',
                vendorId: data?.vendorId || '',
                pekoEmail: data?.pekoEmail.join(',') || '',
                offersText: data?.offersText || '',
                sendInternalMail: data?.sendInternalMail || false,
                sendVendorMail: data?.sendVendorMail || false,
                image: data?.image || '',
                peko_key: data?.peko_key || '',
                displayOrder: data?.displayOrder || '',
            }}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    <TextInput
                        name="name"
                        label="Business Email Name"
                        type="text"
                        placeholder="Enter Name"
                        isRequired
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="peko_key"
                        label="Peko Key"
                        type="text"
                        placeholder="Enter Peko Key"
                        isRequired
                        classes=" rounded-sm"
                    />
                    <SelectInput
                        name="type"
                        isRequired
                        options={[
                            {
                                label: 'Email',
                                value: 'EMAIL',
                            },
                            {
                                label: 'Domain',
                                value: 'DOMAIN',
                            },
                        ]}
                        placeholder="Please select a type"
                        label="Type "
                        filterOption={false}
                    />
                    <SelectInput
                        name="vendorId"
                        isRequired
                        options={allVendors}
                        placeholder="Please select a vendor"
                        label="Vendor"
                        filterOption={false}
                    />
                    <InputTextArea
                        name="pekoEmail"
                        label="Peko Email ID"
                        placeholder="Enter Peko Email ID"
                        isRequired
                        showToolTip
                        tooltipText="Multiple Email IDs are seperated by commas"
                    />
                    <TextInput
                        name="offersText"
                        label="Offers"
                        type="text"
                        placeholder="Enter Offers"
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="displayOrder"
                        label="Display Order"
                        type="text"
                        placeholder="Enter display order"
                        maxLength={3}
                        allowNumbersOnly
                        classes=" rounded-sm"
                    />
                    <SwitchInput name="sendInternalMail" label="Send Email Internally" />
                    <SwitchInput name="sendVendorMail" label="Send Email to Vendor" />
                    <CustomFileUploadInput
                        label="Image"
                        name="image"
                        format="imageFormat"
                        existingFileUrl={data?.image}
                        showFileName
                        showNotification
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default EmailDomainModal;
