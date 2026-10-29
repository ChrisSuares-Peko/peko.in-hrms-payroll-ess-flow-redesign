// CorporateUserFormFields.tsx
import { useState } from 'react';

import { Form, Flex, Skeleton } from 'antd';
import { useFormikContext } from 'formik';

import indianFlag from '@assets/svg/indianFlag.svg';
import CityAutoCompleteInput from '@components/atomic/inputs/CityAutoCompleteInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import VerificationModal from './VerificationModalAdmin';
import VerifyTextInputAdmin from './VerifyTextInputAdmin';
import useVerification from '../hooks/useVerification';

interface CorporateUserFormFieldsProps {
    data: any;
    stateData: any;
    kycStatus: any;
    handleRefresh?: (s: boolean) => void;
    handleCancelModal?: () => void;
}

const CorporateUserFormFields = ({
    data,
    stateData,
    kycStatus,
    handleRefresh,
    handleCancelModal,
}: CorporateUserFormFieldsProps) => {
    const { setFieldValue, validateField, values, errors } = useFormikContext<any>();
    const { verifyGST, verifyPAN, verifyCIN, isLoadingGST, isLoadingPAN, isLoadingCIN } =
        useVerification();
    const dispatch = useAppDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [resp, setResp] = useState<any>(null); // Store API response
    const [formValues, setFormValues] = useState<any>(null); // Store form values
    const openModal = (response: any, value: any) => {
        setResp(response);
        setFormValues(value);
        setIsOpen(true);
    };
    const cancelModal = () => {
        setIsOpen(false);
        setResp(null);
        setFormValues(null);
    };
    const validateGstNumber = (gstNumber: string) => {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstNumber) {
            dispatch(
                showToast({
                    description: 'Please enter your GST number',
                    variant: 'error',
                })
            );
            return false;
        }
        if (gstNumber.length !== 15) {
            dispatch(
                showToast({
                    description: 'GST number must be exactly 15 characters',
                    variant: 'error',
                })
            );
            return false;
        }
        if (!gstRegex.test(gstNumber)) {
            dispatch(
                showToast({
                    description: 'Invalid GSTIN format',
                    variant: 'error',
                })
            );
            return false;
        }

        return true;
    };
    const validatePanNumber = (panNumber: string) => {
        const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;

        if (!panNumber) {
            dispatch(
                showToast({
                    description: 'Please enter your PAN',
                    variant: 'error',
                })
            );
            return false;
        }
        if (panNumber.length !== 10) {
            dispatch(
                showToast({
                    description: 'PAN must be exactly 10 characters',
                    variant: 'error',
                })
            );
            return false;
        }
        if (!panRegex.test(panNumber)) {
            dispatch(
                showToast({
                    description: 'Invalid PAN format',
                    variant: 'error',
                })
            );
            return false;
        }

        return true;
    };
    const validateCinNumber = (cinNumber: string) => {
        const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

        if (!cinNumber) {
            dispatch(
                showToast({
                    description: 'Please enter your CIN',
                    variant: 'error',
                })
            );
            return false;
        }
        if (cinNumber.length !== 21) {
            dispatch(
                showToast({
                    description: 'CIN must be exactly 21 characters',
                    variant: 'error',
                })
            );
            return false;
        }
        if (!cinRegex.test(cinNumber)) {
            dispatch(
                showToast({
                    description: 'Invalid CIN format',
                    variant: 'error',
                })
            );
            return false;
        }
        return true;
    };
    const handleVerifyGSTNumber = async () => {
        if (errors.gstNumber && errors.gstNumber !== 'GST number must be verified') {
            return;
        }
        if (values.gstNumber === data.gstNumber) {
            dispatch(
                showToast({
                    description: 'GST number already verified',
                    variant: 'error',
                })
            );
            return;
        }
        if (validateGstNumber(values.gstNumber)) {
            const response = await verifyGST(values.gstNumber, data.email);
            if (response?.success !== false) {
                openModal(response, values);
            }
        }
    };

    const handleVerifyPanNumber = async () => {
        if (errors.panNumber && errors.panNumber !== 'PAN must be verified') {
            return;
        }
        if (values.panNumber === data.panNumber) {
            dispatch(
                showToast({
                    description: 'PAN already verified',
                    variant: 'error',
                })
            );
            return;
        }
        if (validatePanNumber(values.panNumber)) {
            const response = await verifyPAN(values.panNumber, data.email);
            if (response?.success !== false) {
                openModal(response, values);
            }
        }
    };

    const handleVerifyCINNumber = async () => {
        if (errors.cinNumber && errors.cinNumber !== 'CIN must be verified') {
            return;
        }
        if (values.cinNumber === data.cinNumber) {
            dispatch(
                showToast({
                    description: 'CIN number already verified',
                    variant: 'error',
                })
            );
            return;
        }
        if (validateCinNumber(values.cinNumber)) {
            const response = await verifyCIN(values.cinNumber, data.email);
            if (response?.success !== false) {
                openModal(response, values);
            }
        }
    };
    return (
        <>
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <TextInput
                        name="username"
                        label="Account ID"
                        type="text"
                        placeholder=""
                        classes="rounded-sm"
                        isDisabled
                    />

                    <TextInput
                        name="contactPersonName"
                        label="Full Name"
                        type="text"
                        placeholder="Enter full name"
                        classes="rounded-sm"
                        isRequired
                        maxLength={50}
                    />

                    <TextInput
                        name="name"
                        label="Company Name"
                        type="text"
                        placeholder="Enter company name"
                        classes="rounded-sm"
                        isRequired
                        maxLength={50}
                    />

                    <TextInput
                        name="email"
                        label="Email ID"
                        type="text"
                        placeholder="Enter email address"
                        isRequired
                        classes="rounded-sm"
                        maxLength={50}
                    />

                    <TextInput
                        name="designation"
                        label="Designation"
                        type="text"
                        placeholder="Enter designation"
                        isRequired
                        classes="rounded-sm"
                        maxLength={50}
                    />

                    <TextInput
                        name="mobileNo"
                        label="Mobile Number"
                        type="text"
                        placeholder="Enter mobile number"
                        isRequired
                        classes="rounded-sm"
                        allowNumbersOnly
                        minLength={10}
                        maxLength={10}
                        prefix={
                            <Flex
                                align="center"
                                gap={6}
                                className="h-full p-1 cursor-not-allowed border-e me-2"
                            >
                                <img src={indianFlag} alt="" />
                                <p>+91</p>
                            </Flex>
                        }
                    />

                    <SelectInputWithSearch
                        name="state"
                        options={stateData || []}
                        placeholder="Select State"
                        label="State"
                        isRequired
                        classes="rounded-sm"
                    />

                    <CityAutoCompleteInput
                        name="city"
                        stateFieldName="state"
                        label="City"
                        placeholder="Enter city"
                        isRequired
                        classes="rounded-sm"
                    />

                    <TextInput
                        name="activity"
                        label="Activity"
                        type="text"
                        placeholder="Enter activity"
                        classes="rounded-sm"
                        maxLength={50}
                    />

                    <VerifyTextInputAdmin
                        name="cinNumber"
                        label="Corporate Identification Number"
                        type="text"
                        placeholder="Enter Corporate Identification Number"
                        classes="rounded-sm"
                        verifyText="cinVerified"
                        onVerify={handleVerifyCINNumber}
                        isVerified={data?.cinVerified}
                        maxLength={21}
                        convertToUppercase
                        allowAlphabetsAndNumbersOnly
                        handleChange={value => {
                            const sanitized = value?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
                            setFieldValue('cinNumber', sanitized);
                            setTimeout(() => validateField('cinNumber'), 0);
                        }}
                        loading={isLoadingCIN}
                    />

                    <VerifyTextInputAdmin
                        name="gstNumber"
                        label="GSTIN"
                        type="text"
                        placeholder="Enter GSTIN"
                        classes="rounded-sm"
                        maxLength={15}
                        onVerify={handleVerifyGSTNumber}
                        verifyText="gstVerified"
                        isVerified={data?.gstVerified}
                        convertToUppercase
                        handleChange={value => {
                            const sanitized = value?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
                            setFieldValue('gstNumber', sanitized);
                            setTimeout(() => validateField('gstNumber'), 0);
                        }}
                        loading={isLoadingGST}
                    />

                    <VerifyTextInputAdmin
                        name="panNumber"
                        label="PAN"
                        type="text"
                        placeholder="Enter PAN"
                        classes="rounded-sm"
                        maxLength={10}
                        onVerify={handleVerifyPanNumber}
                        verifyText="panVerified"
                        isVerified={data?.panVerified}
                        convertToUppercase
                        handleChange={value => {
                            const sanitized = value?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
                            setFieldValue('panNumber', sanitized);
                            setTimeout(() => validateField('panNumber'), 0);
                        }}
                        loading={isLoadingPAN}
                    />

                    {kycStatus ? (
                        <SelectInput
                            isRequired
                            name="kycStatus"
                            options={kycStatus}
                            placeholder="Please update KYC status"
                            label="KYC status"
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}

                    <SwitchInput label="Enable Password Protection" name="passwordProtection" />
                </Form>
            </Flex>
            <VerificationModal
                isOpen={isOpen}
                handleCancel={cancelModal}
                data={resp}
                formValues={formValues}
                handleRefresh={handleRefresh}
                handleCancelModal={handleCancelModal}
            />
        </>
    );
};

export default CorporateUserFormFields;
