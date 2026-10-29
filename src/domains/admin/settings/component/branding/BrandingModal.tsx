import React from 'react';

import { Flex, Form } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import PasswordInput from '@components/atomic/inputs/PasswordInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useUpdateBranding from '../../hooks/useUpdateBranding';
import brandingSchema from '../../schema/branding';
import { refresh } from '../../types/partnerPermission';

type BrandingModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
};
const BrandingModal = ({ open, handleCancel, data, setRefresh }: BrandingModalProps & refresh) => {
    const { updateBrandingApi, isloading } = useUpdateBranding();

    return (
        <CustomModalWithForm
            isLoading={isloading} // Use combined loading from hooks
            modalTitle="Branding Management"
            open={open}
            validationSchema={brandingSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async (values: any) => {
                const res = await updateBrandingApi(values);
                if (res) {
                    setRefresh(true);
                    handleCancel();
                }
            }}
            initialValues={{
                id: data?.id || '',
                branding: data?.branding || '',
                baseUrl: data?.assets?.baseUrl || '',
                logo: data?.assets?.logo || '',
                signUpLogo: data?.assets?.signUpLogo || '',
                cleverTapProjectId: data?.assets?.clevertap_projectId || '',
                cleverTapPasscode: data?.assets?.clevertap_passCode || '',
                sharePercentage: data?.sharePercentage || '',
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <TextInput
                        name="branding"
                        label="Branding Name"
                        type="text"
                        placeholder="Please enter the branding name"
                        isRequired
                        maxLength={50}
                        classes="rounded-sm"
                        allowAlphabetsAndSpaceOnly
                    />
                    <TextInput
                        name="baseUrl"
                        label="Portal Url"
                        type="text"
                        placeholder="Please enter the portal url"
                        isRequired
                        maxLength={50}
                        classes="rounded-sm"
                    />
                    <PasswordInput
                        name="cleverTapProjectId"
                        label="CleverTap Project ID"
                        type="password"
                        placeholder="Please enter the clevertap project id"
                        isRequired
                        maxLength={50}
                        classes="rounded-sm"
                    />
                    <PasswordInput
                        name="cleverTapPasscode"
                        label="CleverTap Passcode"
                        type="text"
                        placeholder="Please enter the clevertap passcode"
                        isRequired
                        maxLength={50}
                        classes="rounded-sm"
                    />
                    <TextInput
                        name="sharePercentage"
                        label="Share Percentage"
                        type="text"
                        placeholder="Please enter the share percentage"
                        isRequired
                        maxLength={10}
                        classes="rounded-sm"
                        allowDecimalsOnly
                        allowTwoDecimalsOnly
                    />
                    <FileUploadInput
                        name="logo"
                        label="Logo"
                        format="logoFormat"
                        showFileName
                        allowedFileTypes={['image/jpeg', 'image/png']}
                        maxFileSize={2048}
                    />
                    <FileUploadInput
                        name="signUpLogo"
                        label="Signup Logo"
                        format="signUpLogoFormat"
                        showFileName
                        allowedFileTypes={['image/jpeg', 'image/png']}
                        maxFileSize={2048}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default BrandingModal;
