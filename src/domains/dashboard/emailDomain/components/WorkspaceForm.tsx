import React, { useState } from 'react';

import { Button, Col, Flex, Form, Row, Typography } from 'antd';
import { Formik } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useBasicInfoApi from '../../profile/hooks/useBasicInfoApi';
import useForm from '../hooks/useForm';
import { WorkspaceSchema } from '../schema/index';
import { emailProviders } from '../utils/index';

interface Props {
    setFormData: (data: any) => void;
    formData: any;
    setIsFormSubmitted: (data: any) => void;
    isGoogleWorkSpace?: boolean;
}
const { Text } = Typography;

const WorkspaceForm = ({ setFormData, formData, setIsFormSubmitted, isGoogleWorkSpace }: Props) => {
    const dispatch = useAppDispatch();
    const userBasicInfo = useAppSelector(state => state.reducer.basicInfo);
    const { data } = useBasicInfoApi({});
    const { handleFormSubmit } = useForm();
    const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
    const {
        companyName,
        domainName,
        emailId,
        mobileNumber,
        name,
        numberOfUsers,
        alternativeEmailId,
        city,
        companyAddress,
        currentEmailProvider,
        emirates,
        zipcode,
    } = useAppSelector(state => state.reducer.businessEmail);
    return (
        <Formik
            initialValues={{
                agreeToTerms: false,
                companyName: companyName || data?.name || '',
                currentEmailProvider: currentEmailProvider || '',
                numberOfUsers: numberOfUsers || '',
                name: name || data?.contactPersonName || '',
                domainName: domainName || '',
                emailId: emailId || data?.email || '',
                alternativeEmailId: alternativeEmailId || '',
                mobileNumber: mobileNumber || data?.mobileNo || '',
                companyAddress: companyAddress || '',
                emirates: emirates || '',
                city: city || userBasicInfo?.data?.city || '',
                zipcode: zipcode || '',
            }}
            enableReinitialize
            onSubmit={values => {
                if (isGoogleWorkSpace && values.alternativeEmailId === values.emailId) {
                    dispatch(
                        showToast({
                            description:
                                'Your primary email ID and alternative email ID cannot be the same',
                            variant: 'error',
                        })
                    );
                    return Promise.reject();
                }
                const formattedValues = {
                    ...values,
                    numberOfUsers: Number(values.numberOfUsers),
                };

                handleFormSubmit(formattedValues);
                setFormData(formattedValues);
                setIsFormSubmitted(true);
                setFormSubmitted(true);
                return Promise.resolve();
            }}
            validationSchema={WorkspaceSchema(isGoogleWorkSpace || false)}
        >
            {({ handleSubmit, isSubmitting, setFieldValue, values }) => (
                <Form layout="vertical" className="w-full mt-3" id="emailDomainForm">
                    <fieldset disabled={formSubmitted}>
                        <Row>
                            <Col className="w-full mr-10" md={10}>
                                <TextInput
                                    name="name"
                                    isRequired
                                    label="Name"
                                    placeholder="Enter name"
                                    type="text"
                                    maxLength={50}
                                    isDisabled={formSubmitted}
                                />
                            </Col>
                            <Col className="w-full mr-10" md={10}>
                                <TextInput
                                    name="mobileNumber"
                                    placeholder="Enter mobile number"
                                    type="text"
                                    isRequired
                                    label="Mobile Number"
                                    allowNumbersOnly
                                    maxLength={10}
                                    minLength={9}
                                    isDisabled={formSubmitted}
                                />
                            </Col>
                            <Col className="w-full mr-10" md={10}>
                                <TextInput
                                    name="emailId"
                                    label="Email ID"
                                    isRequired
                                    placeholder="Enter email ID"
                                    type="email"
                                    maxLength={50}
                                    isDisabled={formSubmitted}
                                />
                            </Col>
                            <Col className="w-full mr-10" md={10}>
                                <TextInput
                                    name="numberOfUsers"
                                    isRequired
                                    placeholder="Enter number of email accounts"
                                    type="text"
                                    allowNumbersOnly
                                    maxLength={5}
                                    label="Number of email accounts required "
                                    isDisabled={formSubmitted}
                                />
                            </Col>
                            <Col className="w-full mr-10" md={10}>
                                <TextInput
                                    name="companyName"
                                    isRequired
                                    label="Company Name"
                                    placeholder="Enter company name"
                                    type="text"
                                    maxLength={50}
                                    isDisabled={formSubmitted}
                                />
                            </Col>
                            {isGoogleWorkSpace ? (
                                <Col className="w-full mr-10" md={10}>
                                    <SelectInput
                                        options={emailProviders}
                                        name="currentEmailProvider"
                                        label="Current Email Provider "
                                        placeholder="Select current email provider"
                                        isRequired
                                        isDisabled={formSubmitted}
                                    />
                                </Col>
                            ) : (
                                <>
                                    <Col className="w-full mr-10" md={10}>
                                        <TextInput
                                            name="companyAddress"
                                            isRequired
                                            label="Company Address"
                                            placeholder="Enter company address"
                                            type="text"
                                            maxLength={100}
                                            isDisabled={formSubmitted}
                                        />
                                    </Col>
                                    {/* <Col className="w-full mr-10" md={10}>
                                        <SelectInput
                                            name="emirates"
                                            label="Emirates"
                                            placeholder="Select emirates"
                                            options={Emirates}
                                            isRequired
                                            isDisabled={formSubmitted}
                                        />
                                    </Col> */}
                                    <Col className="w-full mr-10" md={10}>
                                        <TextInput
                                            name="city"
                                            label="City"
                                            placeholder="Enter city"
                                            type="text"
                                            isRequired
                                            maxLength={50}
                                            allowAlphabetsOnly
                                            isDisabled={formSubmitted}
                                        />
                                    </Col>
                                    <Col className="w-full mr-10" md={10}>
                                        <TextInput
                                            name="zipcode"
                                            label="Zip Code"
                                            placeholder="Enter zip code"
                                            type="text"
                                            maxLength={10}
                                            isRequired
                                            allowNumbersOnly
                                            isDisabled={formSubmitted}
                                        />
                                    </Col>
                                </>
                            )}
                            <Col className="w-full mr-10" md={10}>
                                <TextInput
                                    label="Domain Name "
                                    name="domainName"
                                    placeholder="Enter domain name. Example: abc.com, xyz.ai, cba.net…"
                                    type="text"
                                    isRequired
                                    maxLength={50}
                                    isDisabled={formSubmitted}
                                />
                            </Col>
                            {isGoogleWorkSpace && (
                                <Col className="w-full mr-10" md={10}>
                                    <TextInput
                                        name="alternativeEmailId"
                                        placeholder="Enter alternative email ID( e.g., abc@gmail.com , abc@outlook.com)"
                                        type="email"
                                        maxLength={50}
                                        label="Alternative email ID"
                                        isDisabled={formSubmitted}
                                    />
                                </Col>
                            )}
                        </Row>
                        {isGoogleWorkSpace && (
                            <Flex align="center" className="mb-5 mt-2">
                                <CheckboxInput
                                    name="agreeToTerms"
                                    checked={values.agreeToTerms}
                                    onChange={e => setFieldValue('agreeToTerms', e.target.checked)}
                                    disabled={formSubmitted}
                                >
                                    <Text>
                                        I have agreed to all the terms and conditions for the
                                        business email purchase
                                    </Text>
                                </CheckboxInput>
                            </Flex>
                        )}
                        <Button
                            type="primary"
                            className="text-xs sm:text-sm"
                            danger
                            loading={isSubmitting}
                            onClick={() => handleSubmit()}
                        >
                            Next
                        </Button>
                    </fieldset>
                </Form>
            )}
        </Formik>
    );
};

export default WorkspaceForm;
