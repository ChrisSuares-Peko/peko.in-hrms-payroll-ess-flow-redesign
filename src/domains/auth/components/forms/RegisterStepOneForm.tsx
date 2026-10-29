import { useMemo, useState } from 'react';

import { Form, Button, Flex, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import IndianFlag from '@assets/svg/indianFlag.svg';
import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import usePrivacyPolicyDetailsApi from '@src/domains/auth/hooks/usePrivacyPolicyDetailsApi';
import useStateOptions from '@src/domains/auth/hooks/useStateOptions';
import { useAppSelector } from '@src/hooks/store';

import { ValidateUser } from '../../api/index';
import { getRegisterSteponeSchema } from '../../schema';
import { setPasswordPolicy } from '../../slices/passwordPolicySlice';
import { nextStep, setFormData } from '../../slices/registerSlice';
import { ValidateUserValues } from '../../types/index';

const RegisterStepOneForm = () => {
    const dispatch = useDispatch();
    const { formData, signupType } = useAppSelector(state => state.reducer.registration);
    const [isLoading, setIsLoading] = useState(false);
    const { stateOptions } = useStateOptions();
    const { privacyPolicyDetails, isLoading: isPolicyLoading } = usePrivacyPolicyDetailsApi();

    const validationSchema = useMemo(
        () => getRegisterSteponeSchema(privacyPolicyDetails),
        [privacyPolicyDetails]
    );

    const initialValues = useMemo(() => {
        const policyConsentValues = privacyPolicyDetails.reduce(
            (acc, item) => {
                acc[`policyConsent_${item.id}`] = false;
                return acc;
            },
            {} as Record<string, boolean>
        );
        return {
            accountType: signupType === 'FREELANCER' ? 'freelancer' : 'corporate',
            state: formData.state || '',
            name: formData.name,
            contactPersonName: formData.contactPersonName,
            phonenumber: formData.phonenumber,
            email: formData.email,
            referralCode: formData.referralCode,
            signupType,
            marketingConsent: formData.marketingConsent || false,
            ...policyConsentValues,
        };
    }, [privacyPolicyDetails, formData, signupType]);

    const handleValidateUser = async (values: ValidateUserValues) => {
        setIsLoading(true);
        const policyIds = privacyPolicyDetails.reduce(
            (acc, item) => {
                acc[item.id] = !!(values as Record<string, unknown>)[`policyConsent_${item.id}`];
                return acc;
            },
            {} as Record<number, boolean>
        );

        const res = await ValidateUser({
            mobileNo: values.phonenumber,
            email: values.email,
            referralCode: values.referralCode,
            name: values.name,
            contactPersonName: values.contactPersonName,
        });

        if (res.status === true) {
            if (!values.referralCode) {
                delete values.referralCode;
            }
            dispatch(setFormData({ ...values, policyIds }));
            dispatch(setPasswordPolicy(res.data));
            dispatch(nextStep());
        }
        setIsLoading(false);
    };

    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('referralCode');

    const renderPolicyText = (text: string, hyperLinkText?: string) => {
        const match = text.match(/^(.*?)\{(.+?)\}(.*)$/s);
        if (!hyperLinkText || !match) {
            return (
                <Typography.Text className="text-[.85rem]" style={{ cursor: 'default' }}>
                    {text}
                </Typography.Text>
            );
        }
        const [, before, linkLabel, after] = match;
        return (
            <Typography.Text className="text-[.85rem]" style={{ cursor: 'default' }}>
                {before}
                <Typography.Link
                    href={hyperLinkText}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={e => e.stopPropagation()}
                >
                    {linkLabel}
                </Typography.Link>
                {after}
            </Typography.Text>
        );
    };

    return (
        <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={values => {
                handleValidateUser(values);
            }}
        >
            {({ handleSubmit }) => (
                <Form onFinish={handleSubmit} className="w-full mt-5">
                    <TextInput
                        name="contactPersonName"
                        label=""
                        placeholder="Full Name"
                        type="text"
                        size="large"
                        classes="md:h-12"
                        maxLength={50}
                    />
                    {signupType === 'EXISTING_COMPANY' && (
                        <TextInput
                            name="name"
                            label=""
                            placeholder="Company Name"
                            type="text"
                            size="large"
                            classes="md:h-12 mt-2"
                            maxLength={50}
                        />
                    )}

                    <TextInput
                        name="phonenumber"
                        label=""
                        placeholder="Mobile Number"
                        type="text"
                        size="large"
                        maxLength={10}
                        allowNumbersOnly
                        inputMode="numeric"
                        prefix={
                            <Flex
                                align="center"
                                gap={6}
                                className="h-full p-2 cursor-not-allowed border-e me-2"
                            >
                                <img src={IndianFlag} alt="" />
                                <p>+91</p>
                            </Flex>
                        }
                        classes="md:h-12 p-0 mt-2"
                    />

                    <TextInput
                        name="email"
                        label=""
                        placeholder={signupType === 'FREELANCER' ? 'Email Address' : 'Business Email'}
                        type="text"
                        size="large"
                        classes="md:h-12 mt-2"
                        maxLength={55}
                    />

                    <SelectInputWithSearch
                        name="state"
                        options={stateOptions}
                        placeholder="Select State"
                        label=""
                        isRequired
                        size="large"
                        classes="mt-2"
                    />

                    <TextInput
                        name="referralCode"
                        label=""
                        placeholder="Referral Code (Optional)"
                        type="text"
                        size="large"
                        classes="md:h-12 mt-2"
                        maxLength={50}
                        isDisabled={!!referralCode}
                    />

                    {isPolicyLoading ? (
                       <Flex className="w-full mb-4" vertical  >
                            <Skeleton.Input active block size="small" className="mt-2" />
                            <Skeleton.Input active block size="small" className="mt-2" />
                        </Flex>
                    ) : (
                        privacyPolicyDetails.map(item => (
                            <CheckboxInput key={item.id} name={`policyConsent_${item.id}`}>
                                {renderPolicyText(
                                    item.privacyPolicyRegistrationText,
                                    item.hyperLinkText
                                )}
                            </CheckboxInput>
                        ))
                    )}

                    <Button
                        htmlType="submit"
                        type="primary"
                        danger
                        className="w-full h-10 font-semibold"
                        loading={isLoading}
                    >
                        Next
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default RegisterStepOneForm;
