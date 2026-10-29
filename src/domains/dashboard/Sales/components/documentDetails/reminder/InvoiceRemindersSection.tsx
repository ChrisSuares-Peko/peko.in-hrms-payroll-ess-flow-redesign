import { Col, Empty, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '@src/hooks/hooks';
import { showToast } from '@src/slices/apiSlice';

import ReminderForm from './ReminderForm';
import useInvoiceReminders from '../../../hooks/documentDetails/useInvoiceReminders';

interface Props {
    invoiceId: number;
    status?: string;
    invoiceDetails: { invoiceNo?: string; dueDate?: string };
    paymentDetails: { amountDue?: string };
    recipientDetails: { customerName?: string; customerPhone?: string; customerEmail?: string };
}

const DaysSchema = Yup.object().shape({
    data: Yup.array().of(
        Yup.object().shape({
            days: Yup.string()
                .matches(/^\d+$/, 'Days must be a number')
                .required('Please enter number of days')
                .test('not-zero', 'Days cannot be zero', v => Number(v) !== 0)
                .test('max-31', 'Days cannot exceed 31', v => {
                    const n = Number(v);
                    return n >= 1 && n <= 31;
                }),
        })
    ),
});

const InvoiceRemindersSection = ({
    invoiceId,
    status,
    invoiceDetails,
    paymentDetails,
    recipientDetails,
}: Props) => {
    const dispatch = useAppDispatch();
    const { guidelines, templateData, loading, submitLoading, submitReminders, validateForm } =
        useInvoiceReminders(invoiceId);

    const isPaid = status === 'PAID';

    if (loading) {
        return (
            <Flex vertical className="mt-5">
                <Typography.Text className="text-xl font-medium">Invoice Reminders</Typography.Text>
                <Skeleton className="mt-4" />
            </Flex>
        );
    }

    if (!guidelines.length && isPaid) {
        return (
            <Flex vertical className="mt-5">
                <Typography.Text className="text-xl font-medium">Invoice Reminders</Typography.Text>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="mt-6"
                    description="No reminders were set for this invoice"
                />
            </Flex>
        );
    }

    const isNew = guidelines.length === 0;

    return (
        <Flex vertical className="mt-5">
            <Typography.Text className="text-xl font-medium">Invoice Reminders</Typography.Text>
            <Flex vertical className="mt-5">
                <Content className="bg-gray-50 py-4 hidden xl:block rounded-sm">
                    <Row>
                        <Col span={8} className="pl-2">
                            <Typography.Text className="text-sm font-medium">Days</Typography.Text>
                        </Col>
                        <Col span={10} className="pl-2">
                            <Typography.Text className="text-sm font-medium">
                                Action
                            </Typography.Text>
                        </Col>
                        <Col span={4} className="pl-2">
                            <Typography.Text className="text-sm font-medium">
                                Template
                            </Typography.Text>
                        </Col>
                        <Col span={2} className="pl-2">
                            <Typography.Text className="text-sm font-medium">
                                Status
                            </Typography.Text>
                        </Col>
                    </Row>
                </Content>

                <Formik
                    initialValues={{ data: guidelines }}
                    enableReinitialize
                    validationSchema={DaysSchema}
                    onSubmit={values => {
                        const hasChanged =
                            JSON.stringify(values) !== JSON.stringify({ data: guidelines });
                        if (!hasChanged && !isNew) {
                            dispatch(
                                showToast({
                                    description:
                                        'No changes detected. Please update the invoice reminder before submitting.',
                                    variant: 'error',
                                })
                            );
                            return;
                        }
                        if (!validateForm(values)) return;

                        const cleanedData = values.data.map((row: any) => {
                            const r = { ...row };
                            delete r._clientKey;
                            if (typeof r.id !== 'number') delete r.id;
                            return r;
                        });
                        submitReminders(cleanedData, isNew);
                    }}
                >
                    {({ handleSubmit }) => (
                        <ReminderForm
                            handleSubmit={handleSubmit}
                            invoiceId={invoiceId}
                            loading={submitLoading}
                            dueDate={invoiceDetails?.dueDate}
                            status={status}
                            templateData={templateData}
                            invoiceDetails={invoiceDetails}
                            paymentDetails={paymentDetails}
                            recipientDetails={recipientDetails}
                        />
                    )}
                </Formik>
            </Flex>
        </Flex>
    );
};

export default InvoiceRemindersSection;
