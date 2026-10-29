import { useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Input, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { ErrorMessage, FieldArray, useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import add from '@domains/dashboard/Invoice/assets/add.svg';
import pending from '@domains/dashboard/Invoice/assets/iconPending.svg';
import success from '@domains/dashboard/Invoice/assets/SuccessIcon.svg';
import { showToast } from '@src/slices/apiSlice';

import GuidelineModal from './GuideLineModal';
import useGuidelines from '../../hooks/useGuidelines';

const { Text } = Typography;

const GuideLineForm2 = ({ guideline, handleSubmit, invoiceId, loading, dueDate, status }: any) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const { data } = useGuidelines(invoiceId);
    const dispatch = useDispatch();

    function addNewGuideline() {
        setFieldValue(`data[${values.data.length}]`, {
            id: new Date(),
            days: '',
            sms: false,
            email: false,
            notification: false,
            invoiceId,
            status: undefined,
        });
    }

    const [open, setOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(1);

    const handleRemoveTemplate = (name: string, index: number, checked: boolean) => {
        if (!checked) {
            setFieldValue(`data[${index}].templet.${name}`, null);

            if (
                (name === 'email' && !values.data[index].sms) ||
                (name === 'sms' && !values.data[index].email)
            ) {
                dispatch(
                    showToast({
                        description: 'Please select the SMS or Email',
                        variant: 'error',
                    })
                );
            }
        }
    };

    const handleOpen = (index: number) => {
        setOpen(true);
        setSelectedIndex(index);
    };
    return (
        <form onSubmit={handleSubmit}>
            <FieldArray name="data">
                {({ remove }) =>
                    values?.data.map((value: any, index: number) => (
                        <Row
                            className={`my-4 ${index + 1 !== values.data.length ? 'border-b border-gray-200 pb-2' : ''}`}
                            key={`${index}-${value.id}`}
                            gutter={[10, 10]}
                        >
                            <Col xs={24} md={12} xl={8} className="pl-2">
                                <Flex gap={5}>
                                    <Flex className="mt-2">
                                        <Text>If customer did not pay in</Text>
                                    </Flex>
                                    <Form.Item className="mb-0 relative">
                                        <Input
                                            disabled={status && status === 'PAID'}
                                            name={`data[${index}].days`}
                                            placeholder="10 days"
                                            defaultValue={value.days}
                                            type="text"
                                            onChange={e => {
                                                const { value: daysValue } = e.target;

                                                let filteredValue = daysValue;
                                                filteredValue = daysValue.replace(/[^\d]/g, '');
                                                const days = Number(filteredValue);

                                                const newActionDate = dayjs(dueDate || undefined)
                                                    .add(days, 'day')
                                                    .format('YYYY-MM-DD');

                                                setFieldValue(
                                                    `data[${index}].days`,
                                                    e.target.value
                                                );
                                                setFieldValue(
                                                    `data[${index}].actionDate`,
                                                    newActionDate
                                                );
                                            }}
                                        />
                                        <Flex className="absolute -bottom-6">
                                            <ErrorMessage name={`data[${index}].days`}>
                                                {msg => (
                                                    <div className="mt-2" style={{ color: 'red' }}>
                                                        {msg}
                                                    </div>
                                                )}
                                            </ErrorMessage>
                                        </Flex>
                                    </Form.Item>
                                </Flex>
                            </Col>
                            <Col xs={24} md={12} xl={10} className="pl-2">
                                <Flex gap={10}>
                                    <Flex className="mt-2 xl:mr-10">
                                        <Text>Action to be taken</Text>
                                    </Flex>
                                    <Flex className="gap-10 xl:gap-28">
                                        <CheckboxInput
                                            disabled={status && status === 'PAID'}
                                            name={`data[${index}].sms`}
                                            onChange={e =>
                                                handleRemoveTemplate(`sms`, index, e.target.checked)
                                            }
                                        >
                                            SMS
                                        </CheckboxInput>
                                        <CheckboxInput
                                            disabled={status && status === 'PAID'}
                                            name={`data[${index}].email`}
                                            onChange={e =>
                                                handleRemoveTemplate(
                                                    `email`,
                                                    index,
                                                    e.target.checked
                                                )
                                            }
                                        >
                                            Email
                                        </CheckboxInput>
                                    </Flex>
                                </Flex>
                            </Col>
                            <Col xs={12} md={22} xl={4} className="pl-2">
                                <Flex>
                                    <Button
                                        type="default"
                                        danger
                                        onClick={() => handleOpen(index)}
                                        disabled={
                                            (!value.sms && !value.email) ||
                                            (status && status === 'PAID')
                                        }
                                    >
                                        Change Template
                                    </Button>
                                </Flex>
                            </Col>
                            <Col xs={1} className="pl-2">
                                <Flex align="center" justify="space-between" className="mt-1">
                                    {value?.status === 'COMPLETED' && <ReactSVG src={success} />}
                                    {value?.status === 'PENDING' && <ReactSVG src={pending} />}
                                </Flex>
                            </Col>
                            <Col xs={1}>
                                {index !== 0 && status && status !== 'PAID' && (
                                    <Flex align="center" justify="space-between">
                                        <Button
                                            type="text"
                                            onClick={() => remove(index)}
                                            className="py-0"
                                        >
                                            <DeleteOutlined
                                                className="text-xl text-bgOrange2"
                                                style={index === 0 ? { visibility: 'hidden' } : {}}
                                            />
                                        </Button>
                                    </Flex>
                                )}
                            </Col>
                        </Row>
                    ))
                }
            </FieldArray>
            {open && (
                <GuidelineModal
                    index={selectedIndex}
                    handleCancel={() => setOpen(false)}
                    open={open}
                    templateData={data}
                />
            )}

            {status && status !== 'PAID' && (
                <Flex className="items-center justify-center">
                    <Button type="text" onClick={() => addNewGuideline()}>
                        <Flex gap={5} justify="space-between" align="center">
                            <ReactSVG className="" src={add} />
                            <Text className="font-medium text-bgOrange2">
                                Add another condition
                            </Text>
                        </Flex>
                    </Button>
                </Flex>
            )}

            <Button
                htmlType="submit"
                type="primary"
                danger
                loading={loading}
                disabled={status && status === 'PAID'}
            >
                Submit
            </Button>
        </form>
    );
};

export default GuideLineForm2;
