import React from 'react';

import { Button, Flex, Form } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { Formik } from 'formik';

import indianFlag from '@assets/svg/indianFlag.svg';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import useForm from '../hooks/useForm';
import { workInformationSchema } from '../schema';

type Props = {
    planId: string | undefined;
    workId: number | undefined;
    price: string | undefined;
    planName: string | undefined;
    workName: string;
};

const FormComponent = ({ planId, workId, price, planName, workName }: Props) => {
    const { user } = useAppSelector(state => state.reducer.user);
    const formData = useAppSelector(state => state.reducer.works.formData);

    const { handleSubmission, loading } = useForm();

    const initialValues = {
        pocName: formData?.pocName || user?.contactPersonName || '',
        email: formData?.email || user?.email || '',
        mobile: formData?.mobile || user?.mobileNo || '',
        requirement: formData?.requirement || '',
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={workInformationSchema}
            onSubmit={(values, { setSubmitting }) => {
                handleSubmission({ ...values, planId, workId, price, planName, workName });
                setSubmitting(false);
                // clevertap.event.push('works_submit_click', {
                //     click: true,
                // });
            }}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form onFinish={handleSubmit} layout="vertical" className="mt-6 w-full md:w-3/4">
                    <TextInput
                        label="POC Name"
                        name="pocName"
                        placeholder="Enter POC Name"
                        type="text"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="email"
                        label="Email ID"
                        placeholder="Enter Email ID"
                        type="text"
                        isRequired
                        allowedCharacters="A-Za-z0-9._%+-@"
                        allowLowerCaseOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="mobile"
                        placeholder="Enter Mobile Number"
                        label="Mobile Number"
                        type="text"
                        allowNumbersOnly
                        isRequired
                        maxLength={10}
                        prefix={
                            <Flex
                                align="center"
                                gap={6}
                                className="p-[.43rem] h-full border-e me-2 cursor-not-allowed"
                            >
                                <Flex justify="center" align="center">
                                            <img
                                                src={indianFlag}
                                                alt="India Flag"
                                                className="h-4 w-4 mr-2"
                                            />
                                            +91 (India)
                                        </Flex>
                            </Flex>
                        }
                        classes=" p-0"
                    />
                    <InputTextArea
                        label="Write about Requirements"
                        name="requirement"
                        placeholder="Enter Requirements"
                        isRequired
                        showCount
                        maxLength={250}
                    />

                    <Button
                        htmlType="submit"
                        danger
                        type="primary"
                        className="px-10 my-3"
                        loading={loading}
                    >
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormComponent;
