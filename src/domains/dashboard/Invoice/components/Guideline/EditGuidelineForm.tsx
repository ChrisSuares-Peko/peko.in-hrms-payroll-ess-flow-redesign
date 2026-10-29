import React, { lazy, Suspense, useState } from 'react';

import { Button, Col, Flex, Form, Input, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { ErrorMessage, FormikValues, useFormikContext } from 'formik';
import { ReactSVG } from 'react-svg';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import pending from '@domains/dashboard/Invoice/assets/iconPending.svg';
import success from '@domains/dashboard/Invoice/assets/SuccessIcon.svg';

import { Rows } from '../../types/guidelineTypes';

const GuidelineModal = lazy(() => import('../GuidelineModal'));

interface WishListFormProps {
    index: number;
    templateData: Rows[];
}
const { Text } = Typography;

const EditGuidelineForm = ({ index, templateData }: WishListFormProps) => {
    const { values, setFieldValue } = useFormikContext<FormikValues>();
    const [open, setOpen] = useState<boolean>(false);
    const handleOpen = () => {
        setOpen(true);
    };

    return (
        <>
            <Col xs={24} md={12} xl={8}>
                <Flex gap={8} className="w-full">
                    <Text className="mt-2">If customer did not pay in</Text>
                    <Form.Item className="relative mb-0">
                        <Input
                            name={`data[${index}].days`}
                            placeholder="10 days"
                            defaultValue={values.data[index].days}
                            type="text"
                            onChange={e => {
                                const { value } = e.target;

                                let filteredValue = value;
                                filteredValue = value.replace(/[^\d]/g, '');
                                const days = Number(filteredValue);

                                const newActionDate = dayjs(values.data[0].actionDate)
                                    .add(days, 'day')
                                    .format('YYYY-MM-DD');

                                setFieldValue(`data[${index}].days`, e.target.value);
                                setFieldValue(`data[${index}].actionDate`, newActionDate);
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
            <Col xs={8} md={6} xl={3} className="flex mt-7 md:mt-0">
                <Text>Action to be taken</Text>
            </Col>
            <Col xs={3} md={6} xl={7} className="mt-5 md:mt-0">
                <Flex justify="space-around" align="center" className="xl:mt-5">
                    <CheckboxInput name={`data[${index}].sms`}>SMS</CheckboxInput>
                    <CheckboxInput name={`data[${index}].email`}>Email</CheckboxInput>
                </Flex>
            </Col>
            <Col xl={4} xs={24}>
                <Flex>
                    <Button type="default" danger onClick={handleOpen}>
                        Change Template
                    </Button>
                </Flex>
            </Col>
            <Col xl={1} xs={12}>
                {values.data[index].status === 'COMPLETED' ? (
                    <ReactSVG src={success} />
                ) : (
                    <ReactSVG src={pending} />
                )}
            </Col>

            {open && (
                <Suspense fallback={<Spin />}>
                    <GuidelineModal
                        index={index}
                        handleCancel={() => setOpen(false)}
                        open={open}
                        templateData={templateData}
                    />
                </Suspense>
            )}
        </>
    );
};

export default EditGuidelineForm;
