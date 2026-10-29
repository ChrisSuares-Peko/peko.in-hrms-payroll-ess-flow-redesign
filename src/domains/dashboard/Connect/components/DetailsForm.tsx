import React from 'react';

import { Button, Flex, Form, theme } from 'antd';
import { Formik } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import useConnectionRequest from '../hooks/useConnectionRequest';
import { connectRequestSchema } from '../schema/index';

type Props = {
    connectId?: number;
};

const DetailsForm = ({ connectId }: Props) => {
    const { user } = useAppSelector(state => state.reducer.user);
    const {
        token: { colorPrimary },
    } = theme.useToken();

    const { handleConnectionRequest } = useConnectionRequest();
    const scrollToError = (errors: Record<string, any>) => {
        const firstErrorKey = Object.keys(errors)[0];
        if (!firstErrorKey) return;

        const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
        if (errorElement) {
            (errorElement as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
            (errorElement as HTMLElement).focus();
        }
    };

    return (
        <Flex vertical>
            <Formik
                initialValues={{
                    name: user?.contactPersonName || '',
                    mobile: user?.mobileNo || '',
                    email: user?.email || '',
                    preferredMode: 'EMAIL',
                    requirement: '',
                }}
                validationSchema={connectRequestSchema}
                onSubmit={values => handleConnectionRequest({ ...values, connectId })}
            >
                {({ handleSubmit, isSubmitting, errors }) => (
                    <Form
                        onFinish={() => {
                            if (Object.keys(errors).length > 0) {
                                scrollToError(errors);
                            } else {
                                handleSubmit();
                            }
                        }}
                        layout="vertical"
                        className="w-full mt-5 md:w-96"
                    >
                        <TextInput
                            name="name"
                            label="Name"
                            placeholder="Enter Name"
                            type="text"
                            isRequired
                            allowAlphabetsAndSpaceOnly
                            maxLength={50}
                        />
                        <TextInput
                            name="mobile"
                            label="Mobile Number"
                            placeholder="Enter Mobile Number"
                            type="text"
                            isRequired
                            allowNumbersOnly
                            maxLength={10}
                        />
                        <TextInput
                            name="email"
                            label="Email ID"
                            placeholder="Enter Email ID"
                            type="test"
                            allowLowerCaseOnly
                            isRequired
                            maxLength={50}
                        />
                        <SelectInput
                            name="preferredMode"
                            label="Preferred Mode"
                            placeholder="Enter Preferred mode"
                            options={[
                                {
                                    value: 'EMAIL',
                                    label: 'Email',
                                },
                                {
                                    value: 'MOBILE',
                                    label: 'Mobile',
                                },
                            ]}
                            isRequired
                        />
                        <InputTextArea
                            name="requirement"
                            placeholder="Enter Requirement"
                            label="Description (optional)"
                            autoSize={{ minRows: 3, maxRows: 5 }}
                            maxLength={200}
                        />
                        <Button
                            style={{
                                backgroundColor: colorPrimary,
                                color: 'white',
                            }}
                            type="primary"
                            htmlType="submit"
                            loading={isSubmitting}
                            className="w-100 sm:w-[10rem] mb-24 "
                        >
                            Submit
                        </Button>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default React.memo(DetailsForm);
