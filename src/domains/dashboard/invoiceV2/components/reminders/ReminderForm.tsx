import { useState } from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Input, Row, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { ErrorMessage, FieldArray, useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import { showToast } from '@src/slices/apiSlice';
import { removeEmoji } from '@utils/regex';

import GuideLineModal from './GuideLineModal';

interface Props {
    handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    invoiceId: number;
    loading: boolean;
    dueDate?: string;
    status?: string;
    templateData: any[];
    invoiceDetails: { invoiceNo?: string; dueDate?: string };
    paymentDetails: { amountDue?: string };
    recipientDetails: { customerName?: string; customerPhone?: string; customerEmail?: string };
}

const ReminderForm = ({
    handleSubmit,
    invoiceId,
    loading,
    dueDate,
    status,
    templateData,
    invoiceDetails,
    paymentDetails,
    recipientDetails,
}: Props) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const isPaid = status === 'PAID';

    const reminderStatusClassMap: Record<string, string> = {
        pending: 'bg-[#FFF7ED] text-[#F97316]',
        completed: 'bg-[#ECFDF5] text-[#43B75D]',
        cancelled: 'bg-[#FEF2F2] text-[#EF4444]',
    };

    const addNewRow = () => {
        setFieldValue(`data[${values.data.length}]`, {
            _clientKey: Date.now(),
            days: '',
            sms: false,
            email: false,
            notification: false,
            invoiceId,
            status: undefined,
            templet: {},
        });
    };

    const handleRemoveTemplate = (name: string, index: number, checked: boolean) => {
        if (!checked) {
            setFieldValue(`data[${index}].templet.${name}`, null);
            const other = name === 'email' ? 'sms' : 'email';
            if (!values.data[index][other]) {
                dispatch(
                    showToast({
                        description: 'Please select at least one action (SMS or Email) to proceed.',
                        variant: 'error',
                    })
                );
            }
        }
    };

    const handleOpenModal = (index: number) => {
        const row = values.data[index];
        if (!row?.sms && !row?.email) {
            dispatch(
                showToast({
                    description: 'Please select at least one action (SMS or Email) to proceed.',
                    variant: 'error',
                })
            );
            return;
        }
        setSelectedIndex(index);
        setOpen(true);
    };

    const sharedTemplateProps = { invoiceDetails, paymentDetails, recipientDetails };

    const statusTextTransformer = (text: string) =>
        text[0].toUpperCase() + text.slice(1).toLowerCase();

    return (
        <form onSubmit={handleSubmit}>
            <FieldArray name="data">
                {({ remove }) =>
                    values.data.map((row: any, index: number) => (
                        <Row
                            key={`${index}-${row._clientKey ?? row.id}`}
                            className={`my-4 ${index + 1 !== values.data.length ? 'border-b border-gray-200 pb-2' : ''} border sm:border-0 px-3 sm:px-0 py-5 sm:py-0 rounded-md sm:rounded-none`}
                            gutter={[10, 10]}
                            align="middle"
                        >
                            <Col xs={24} md={12} xl={8} className="pl-2">
                                <Flex vertical gap={4}>
                                    <Typography.Text className="xl:hidden text-xs text-gray-400">
                                        Days
                                    </Typography.Text>
                                    <Flex align="center" gap={8} className="flex-wrap">
                                        <Typography.Text className="whitespace-nowrap">
                                            Reminder will be sent
                                        </Typography.Text>
                                        <Form.Item className="mb-0">
                                            <Input
                                                disabled={isPaid}
                                                placeholder="5"
                                                value={row.days}
                                                style={{ width: 64 }}
                                                onChange={e => {
                                                    const filtered = e.target.value
                                                        .replace(/[^\d]/g, '')
                                                        .replace(removeEmoji, '');
                                                    const newActionDate = dayjs(
                                                        dueDate || undefined
                                                    )
                                                        .subtract(Number(filtered), 'day')
                                                        .format('YYYY-MM-DD');
                                                    setFieldValue(`data[${index}].days`, filtered);
                                                    setFieldValue(
                                                        `data[${index}].actionDate`,
                                                        newActionDate
                                                    );
                                                }}
                                            />
                                            <ErrorMessage name={`data[${index}].days`}>
                                                {msg => (
                                                    <div
                                                        className="mt-1"
                                                        style={{ color: 'red', fontSize: 12 }}
                                                    >
                                                        {msg}
                                                    </div>
                                                )}
                                            </ErrorMessage>
                                        </Form.Item>
                                        <Typography.Text className="whitespace-nowrap">
                                            days before due date
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            </Col>

                            <Col xs={24} md={12} xl={10} className="pl-2">
                                <Flex vertical gap={4}>
                                    <Typography.Text className="xl:hidden text-xs text-gray-400">
                                        Action
                                    </Typography.Text>
                                    <Flex className="flex-col sm:flex-row sm:gap-2.5">
                                        <Flex className="mt-2 xl:mr-10 hidden xl:flex">
                                            <Typography.Text>Action to be taken</Typography.Text>
                                        </Flex>
                                        <Flex className="gap-10 xl:gap-28">
                                            <CheckboxInput
                                                disabled={isPaid}
                                                name={`data[${index}].sms`}
                                                onChange={e =>
                                                    handleRemoveTemplate(
                                                        'sms',
                                                        index,
                                                        e.target.checked
                                                    )
                                                }
                                            >
                                                SMS
                                            </CheckboxInput>
                                            <CheckboxInput
                                                disabled={isPaid}
                                                name={`data[${index}].email`}
                                                onChange={e =>
                                                    handleRemoveTemplate(
                                                        'email',
                                                        index,
                                                        e.target.checked
                                                    )
                                                }
                                            >
                                                Email
                                            </CheckboxInput>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Col>

                            <Col xs={14} md={14} xl={4} className="pl-2">
                                <Flex vertical gap={4}>
                                    <Typography.Text className="xl:hidden text-xs text-gray-400">
                                        Template
                                    </Typography.Text>
                                    <Button
                                        type="default"
                                        className="w-fit"
                                        danger
                                        disabled={
                                            !(
                                                values.data[index]?.sms ||
                                                values.data[index]?.email
                                            ) || isPaid
                                        }
                                        onClick={() => handleOpenModal(index)}
                                    >
                                        Change Template
                                    </Button>
                                </Flex>
                            </Col>

                            <Col xs={8} md={8} xl={2} className="pl-2">
                                <Flex vertical gap={4}>
                                    <Typography.Text className="xl:hidden text-xs text-gray-400">
                                        Status
                                    </Typography.Text>
                                    {row.status && (
                                        <Tag
                                            className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${
                                                reminderStatusClassMap[
                                                    row.status.toLowerCase()
                                                ] ?? 'bg-[#F4F4F5] text-[#71717A]'
                                            }`}
                                        >
                                            {statusTextTransformer(row.status)}
                                        </Tag>
                                    )}
                                </Flex>
                            </Col>

                            <Col xs={2} md={2}>
                                {index !== 0 && !isPaid && (
                                    <Button
                                        type="text"
                                        onClick={() => remove(index)}
                                        className="py-0 px-0"
                                    >
                                        <DeleteOutlined className="text-xl text-bgOrange2" />
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    ))
                }
            </FieldArray>

            {open && (
                <GuideLineModal
                    index={selectedIndex}
                    handleCancel={() => setOpen(false)}
                    open={open}
                    templateData={templateData}
                    {...sharedTemplateProps}
                />
            )}

            {!isPaid && (
                <Flex className="items-center justify-center mt-5">
                    <Button type="text" onClick={addNewRow}>
                        <Flex gap={5} align="center">
                            <PlusOutlined className="text-bgOrange2" />
                            <Typography.Text className="font-medium text-bgOrange2">
                                {values.data.length === 0
                                    ? 'Add Condition'
                                    : 'Add another condition'}
                            </Typography.Text>
                        </Flex>
                    </Button>
                </Flex>
            )}

            {values.data.length > 0 && (
                <Button
                    htmlType="submit"
                    type="primary"
                    danger
                    loading={loading}
                    disabled={isPaid}
                    className="mt-3"
                >
                    Submit
                </Button>
            )}
        </form>
    );
};

export default ReminderForm;
