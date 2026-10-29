import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';

interface UpdateServiceDatesModalProps {
    open: boolean;
    handleCancel: () => void;
    handleSubmit: (values: { lastServiceDate: string; nextServiceDue: string }) => void;
    initialValues?: { lastServiceDate?: string; nextServiceDue?: string };
    isLoading?: boolean;
}

const UpdateServiceDatesModal = ({
    open,
    handleCancel,
    handleSubmit,
    initialValues,
    isLoading = false,
}: UpdateServiceDatesModalProps) => {
    const validationSchema = Yup.object().shape({
        lastServiceDate: Yup.string().required('Please select the last service date'),
        nextServiceDue: Yup.string()
            .required('Please select the next service date')
            .test(
                'after-last-service',
                'Next service date must be after the last service date',
                (value, ctx) =>
                    !value ||
                    !ctx.parent.lastServiceDate ||
                    dayjs(value).isAfter(dayjs(ctx.parent.lastServiceDate))
            ),
    });

    const formInitialValues = {
        lastServiceDate: initialValues?.lastServiceDate || '',
        nextServiceDue: initialValues?.nextServiceDue || '',
    };

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            closeIcon={null}
            centered
            width={560}
            footer={null}
            styles={{ content: { borderRadius: 16 }, body: { padding: 8 } }}
        >
            <Formik
                initialValues={formInitialValues}
                validationSchema={validationSchema}
                enableReinitialize
                validateOnChange={false}
                onSubmit={values => handleSubmit(values)}
            >
                {({ handleSubmit: submitForm, values }: FormikProps<typeof formInitialValues>) => (
                    <Form layout="vertical">
                        <Flex justify="space-between" align="center" className="mb-8">
                            <Typography.Text className="text-2xl font-semibold">
                                Update Service Dates
                            </Typography.Text>
                            <Button
                                type="text"
                                shape="circle"
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                            />
                        </Flex>

                        <DatePickerInput
                            name="lastServiceDate"
                            label="Last Service Date"
                            placeholder="Select Last Service Date"
                            classes="w-full"
                            needConfirm={false}
                            isRequired
                            maxDate={dayjs()}
                        />
                        <DatePickerInput
                            name="nextServiceDue"
                            label="Next Service Due"
                            placeholder="Select Next Service Date"
                            classes="w-full"
                            needConfirm={false}
                            isRequired
                            minDate={
                                values.lastServiceDate
                                    ? dayjs(values.lastServiceDate)
                                    : undefined
                            }
                        />

                        <Flex gap={20} className="mt-6">
                            <Button
                                size="large"
                                danger
                                className="flex-1"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="large"
                                type="primary"
                                danger
                                className="flex-1"
                                loading={isLoading}
                                onClick={() => submitForm()}
                            >
                                Save Dates
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default UpdateServiceDatesModal;
