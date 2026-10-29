import React, { useState } from 'react';

import { Button, Col, Flex, Form, Image, Row, Typography } from 'antd';
import { Formik } from 'formik';

import logo from '@assets/mainLogo/standard';
import indianFlag from '@assets/svg/indianFlag.svg';
import reset from '@assets/svg/reset.svg';
import TextInput from '@components/atomic/inputs/TextInput';
import MobileOtpModal from '@domains/dashboard/profile/components/MobileOtpModal';
import { updateBasicInfo } from '@src/domains/dashboard/profile/api/basicInfo';
import { getOtpSms } from '@src/domains/dashboard/profile/api/general';
import { UpdateBasicInfoRequestPayload } from '@src/domains/dashboard/profile/types';
import { Scope } from '@src/enums/enums';
import { useAppSelector } from '@src/hooks/store';

import useSocialLogin from '../../hooks/useSocialLogin';
import { socialRegisterCompletionSchema } from '../../schema';
import { SocialRegisterCompletionPayload } from '../../types';

const COUNTRY_CODE = '91';

const FIELDS = [
    { name: 'name', label: 'Company Name', placeholder: 'Enter Company Name', maxLength: 50 },
    {
        name: 'contactPersonName',
        label: 'Full Name',
        placeholder: 'Enter Full Name',
        maxLength: 50,
    },
    {
        name: 'mobileNo',
        label: 'Mobile Number',
        placeholder: 'Enter Mobile Number',
        maxLength: 10,
        allowNumbersOnly: true,
    },
];

const SocialRegisterCompletionForm = () => {
    const { name, contactPersonName, mobileNo, id, role } = useAppSelector(
        state => state.reducer.auth
    );
    const { finalizeSocialRegistration } = useSocialLogin();

    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formValues, setFormValues] = useState<SocialRegisterCompletionPayload>();

    const requestOtp = (target: string) =>
        getOtpSms({ userId: id, userType: role, newMobileNo: `${COUNTRY_CODE}${target}` });

    const handleSubmit = async (values: {
        name: string;
        contactPersonName: string;
        mobileNo: string;
    }) => {
        setLoading(true);
        const payload: SocialRegisterCompletionPayload = {
            name: values.name,
            contactPersonName: values.contactPersonName,
            mobileNo: values.mobileNo,
            isSocialRegUpdate: true,
            userId: id,
            userType: role,
        };
        setFormValues(payload);

        // The number is new to the account, so verify ownership before storing it.
        const resp = await requestOtp(values.mobileNo);
        if (resp) setIsOtpOpen(true);
        setLoading(false);
    };

    const submitWithOtp = async (otp: string) => {
        if (!formValues) return;
        setIsSaving(true);
        const saved = await updateBasicInfo({
            ...formValues,
            otp,
            scope: Scope.MOBILE,
        } as unknown as UpdateBasicInfoRequestPayload);
        setIsSaving(false);

        if (!saved) {
            return;
        }

        setIsOtpOpen(false);
        finalizeSocialRegistration({
            name: formValues.name,
            contactPersonName: formValues.contactPersonName,
            mobileNo: formValues.mobileNo,
        });
    };

    return (
        <Flex vertical align="center" justify="center" className="mt-3 gap-4 items-center w-full">
            <Image
                src={logo}
                alt=""
                preview={false}
                className="hidden md:block left-10"
                width={120}
            />
            <Image src={reset} alt="" preview={false} />
            <Typography.Title className="text-center" level={3}>
                Complete your profile registration!
            </Typography.Title>
            <div className="w-full max-w-2xl">
                <Formik
                    initialValues={{
                        name: name || '',
                        contactPersonName: contactPersonName || '',
                        mobileNo: mobileNo || '',
                    }}
                    enableReinitialize
                    onSubmit={handleSubmit}
                    validationSchema={socialRegisterCompletionSchema}
                >
                    {({ handleSubmit: submitForm }) => (
                        <Form onFinish={submitForm} layout="vertical">
                            <Row className="mt-6" gutter={[20, 5]}>
                                {FIELDS.map((field, i) => (
                                    <Col xs={24} md={12} order={i + 1} key={field.name}>
                                        <TextInput
                                            isRequired
                                            name={field.name}
                                            type="text"
                                            label={field.label}
                                            placeholder={field.placeholder}
                                            maxLength={field.maxLength}
                                            allowNumbersOnly={field.allowNumbersOnly}
                                            isDisabled={field.name === 'mobileNo' && !!mobileNo}
                                            prefix={
                                                field.name === 'mobileNo' && (
                                                    <Flex
                                                        align="center"
                                                        gap={6}
                                                        className="h-full cursor-not-allowed border-e me-2"
                                                    >
                                                        <img src={indianFlag} alt="" />
                                                        <p>+{COUNTRY_CODE}</p>
                                                    </Flex>
                                                )
                                            }
                                        />
                                    </Col>
                                ))}
                            </Row>

                            <Flex className="mt-6 mb-3" align="center" justify="center">
                                <Button
                                    type="primary"
                                    loading={loading}
                                    danger
                                    htmlType="submit"
                                    className="w-36"
                                >
                                    Continue
                                </Button>
                            </Flex>
                        </Form>
                    )}
                </Formik>
            </div>
            <MobileOtpModal
                isOpen={isOtpOpen}
                isLoading={isSaving}
                handleCancel={() => setIsOtpOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    await requestOtp(formValues?.mobileNo || '');
                    setIsOtpSending(false);
                }}
                handleSubmit={submitWithOtp}
                title="Confirmation"
            />
        </Flex>
    );
};

export default SocialRegisterCompletionForm;
