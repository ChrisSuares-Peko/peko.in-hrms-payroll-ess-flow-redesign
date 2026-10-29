import { useCallback } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Row, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DateTimePickerInput from '@components/atomic/inputs/DateTimePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { useCalculateRateApi } from '../hooks/useCalculateRateApi';
import { generateLogisticsPickupDetailsSchema } from '../schema/index';
import { setShipmentDetails, setShippingAmount } from '../slice/logisticsSlice';
import { ShipmentDetailForm, shippingAmount } from '../types/index';
import { dateFormatter, formalTextFormatter } from '../utils/helperFunctions';

type Props = {
    setShowReviewScreen: (val: shippingAmount) => void;
};

const ShipmentDetailsForm = ({ setShowReviewScreen }: Props) => {
    const dispatch = useDispatch();
    const { shipmentDetails } = useAppSelector(state => state.reducer.logistics);
    const { handleCalculateRate, isLoading: isLoadingCalculatRate } = useCalculateRateApi();
    const handleFormSubmit = useCallback(
        async ({
            totalWeight,
            serviceType,
            pickupDate,
            orderCategory,
            recieveSMS,
        }: ShipmentDetailForm) => {
            const formattedDate = dateFormatter(pickupDate);
            dispatch(
                setShipmentDetails({
                    packageWeight: totalWeight,
                    serviceType: serviceType.toLocaleUpperCase(),
                    orderCategory,
                    recieveSMS,
                    orderDate: formattedDate.toString(),
                })
            );
            handleCalculateRate({
                packageWeight: totalWeight,
                serviceType: serviceType.toLocaleUpperCase(),
                orderCategory,
                recieveSMS,
                orderDate: pickupDate,
            }).then(({ charges, city }: any) => {
                if (charges) {
                    dispatch(
                        setShippingAmount({
                            charges,
                            city,
                        })
                    );
                    setShowReviewScreen({
                        charges,
                        city,
                    });
                }
            });
        },
        [dispatch, setShowReviewScreen, handleCalculateRate]
    );

    const currentTime = dayjs();
    const minDate = currentTime.add(1, 'day');
    return (
        <Formik
            initialValues={{
                totalWeight: '',
                serviceType: formalTextFormatter(shipmentDetails.serviceType) ?? 'Normal',
                orderCategory: '',
                recieveSMS: true,
                pickupDate: '',
            }}
            validationSchema={generateLogisticsPickupDetailsSchema()}
            onSubmit={handleFormSubmit}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form onFinish={handleSubmit} layout="vertical">
                    <Row gutter={80} className="xl:w-9/12">
                        <Col xs={24} sm={12}>
                            <TextInput
                                label="Order Category"
                                name="orderCategory"
                                placeholder="Enter your Order Category"
                                type="text"
                                isRequired
                                suffix={
                                    <Tooltip title="Please enter your valid order category, Example: Books, Electronics, Machines, etc..">
                                        <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                                    </Tooltip>
                                }
                                allowAlphabetsAndSpaceOnly
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                label="Order Weight"
                                name="totalWeight"
                                placeholder="Enter Total Weight"
                                suffix={
                                    <Tooltip title="Please enter total weight in grams">
                                        <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                                    </Tooltip>
                                }
                                type="text"
                                allowNumbersOnly
                                isRequired
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                label="Service Type"
                                name="serviceType"
                                isDisabled
                                type="text"
                                isRequired
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <DateTimePickerInput
                                minDate={minDate}
                                label="Schedule a Pickup for this Order"
                                name="pickupDate"
                                placeholder="Select Date"
                                classes="w-full"
                                showTime
                                isRequired
                                needConfirm={false}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <CheckboxInput name="recieveSMS" classes="">
                                <Typography.Text className="text-xs text-neutral-500">
                                    {' '}
                                    Check this inbox if you would like to receive order updates via
                                    SMS.
                                </Typography.Text>
                            </CheckboxInput>
                        </Col>
                    </Row>
                    <Flex justify="space-between" className="mt-4">
                        <Button
                            danger
                            loading={isLoadingCalculatRate}
                            htmlType="submit"
                            type="default"
                            className="w-full sm:w-[8rem] "
                        >
                            Update
                        </Button>
                    </Flex>
                </Form>
            )}
        </Formik>
    );
};

export default ShipmentDetailsForm;
