import React, { lazy, useEffect, useState } from 'react';

import { Button, Col, Flex, Form, Input, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { ErrorMessage, FormikValues, useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

const GuidelineModal = lazy(() => import('./GuidelineModal'));
// import { Row, Row } from '../types/guidelineTypes';

interface WishListFormProps {
    index: number;
    templateData: any[];
    due?: any;
}
const { Text } = Typography;

const AddGuideline = ({ index, templateData, due }: WishListFormProps) => {
    const { xxl } = useScreenSize();

    const dispatch = useDispatch();
    const { values, setFieldValue } = useFormikContext<FormikValues>();
    const { Details } = useAppSelector(state => state.reducer.invoices);
    const [open, setOpen] = useState<boolean>(false);
    const handleOpen = () => {
        setOpen(true);
    };
    const dueDate =
        Details.invoiceDetails?.dueDate !== undefined ? Details.invoiceDetails.dueDate : due;

    const [updated, setUpdated] = useState<boolean>(false);
    useEffect(() => {
        if (updated && values && !values.data[index].sms && !values.data[index].email) {
            dispatch(
                showToast({
                    description: 'Please select the SMS or Email',
                    variant: 'error',
                })
            );
        }
    }, [updated, values, dispatch, index]);

    return (
        // <Flex className="mt-6 w-fit" justify='space-between'>
        <>
            <Row className="w-full mt-6 mb-5 border-b xxl:mb-0" gutter={10}>
                <Col xl={8} xs={24}>
                    <Flex gap={10} className="w-full">
                        <Text className="mt-2">If customer did not pay in</Text>
                        <Form.Item>
                            <Input
                                name={`data[${index}].days`}
                                placeholder="Eg:10 days"
                                // label="If customer did not pay in"
                                type="text"
                                onChange={e => {
                                    const { value } = e.target;
                                    let filteredValue = value;
                                    filteredValue = value.replace(/[^\d]/g, '');
                                    const days = Number(filteredValue);
                                    const newActionDate = dayjs(dueDate)
                                        .add(days, 'day')
                                        .format('YYYY-MM-DD');
                                    setFieldValue(`data[${index}].days`, e.target.value);
                                    setFieldValue(`data[${index}].actionDate`, newActionDate);
                                }}
                                maxLength={2}
                            />
                            <ErrorMessage name={`data[${index}].days`}>
                                {msg => (
                                    <div className="mt-2" style={{ color: 'red' }}>
                                        {msg}
                                    </div>
                                )}
                            </ErrorMessage>
                        </Form.Item>
                    </Flex>
                </Col>
                <Col xs={24} sm={7} xl={4} className="mt-2">
                    <Text>Action to be taken</Text>
                </Col>
                <Col xs={24} sm={8}>
                    <Flex justify="space-around" className="xl:mt-0">
                        <CheckboxInput
                            name={`data[${index}].sms`}
                            onChange={() => setUpdated(true)}
                        >
                            SMS
                        </CheckboxInput>

                        <CheckboxInput
                            name={`data[${index}].email`}
                            onChange={() => setUpdated(true)}
                        >
                            Email
                        </CheckboxInput>

                        {/* <CheckboxInput classes='' name={`data[${index}].notification`}>
                    In Peko Notification
                </CheckboxInput> */}
                    </Flex>
                </Col>
                <Col xl={4} xs={24} className="mb-4 xxl:mb-0">
                    <Flex justify={xxl ? 'end' : 'start'} align="end">
                        <Button
                            type="default"
                            danger
                            onClick={handleOpen}
                            disabled={
                                values.data[index].email === false &&
                                values.data[index].sms === false
                            }
                            // size={screens.sm ? 'middle' : 'small'}
                            // onClick={() => {
                            //     navigate(paths.taxAndMore.TaxHistory);
                            // }}
                        >
                            Setup Template
                        </Button>
                    </Flex>
                </Col>
            </Row>
            {open && (
                <GuidelineModal
                    index={index}
                    handleCancel={() => setOpen(false)}
                    open={open}
                    templateData={templateData}
                />
            )}
        </>
    );
};

export default AddGuideline;
