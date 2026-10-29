import React, { useEffect, useRef } from 'react';

import { Card, Col, Flex, Form, Input, Row, Typography } from 'antd';
import { Field, FieldProps, Formik, FormikProps } from 'formik';

import NumberWithUnit from '@components/atomic/inputs/NumberWIthUnit';
import { useAppSelector } from '@src/hooks/store';
import { RootState } from '@store/store';

import { calculateShipmentSchema } from '../../schema';
import { DeliveryCompanyOption, ShipmentData } from '../../types';

const { Text } = Typography;

interface Props {
    handleCalculateRate: (shipmentDetails: ShipmentData) => Promise<DeliveryCompanyOption[]>;
}

const CalculateCost = ({ handleCalculateRate }: Props) => {
    const { shipmentDetails } = useAppSelector((state: RootState) => state.reducer.logisticsV3);
    const formikRef = useRef<FormikProps<ShipmentData>>(null);
    useEffect(() => {
        if (formikRef.current) {
            formikRef.current.submitForm();
        }
    }, []);

    return (
        <Card className="mt-10 rounded-2xl shadow-sm p-4 sm:p-6" styles={{ body: { padding: 0 } }}>
            <Flex vertical gap={10}>
                <Flex className="w-[90%]" justify="space-between">
                    <Flex className="w-full xl:w-[50%]" align="center">
                        <Text className="font-medium text-lg">Return shipment</Text>
                    </Flex>
                    <Flex className="hidden xl:flex w-[30%]" align="center" justify="center">
                        <Text className="text-base font-medium">Package Dimensions</Text>
                    </Flex>
                </Flex>
                <Flex align="center" className="w-full flex-col xl:flex-row">
                    <Flex className="w-full">
                        <Formik
                            innerRef={formikRef}
                            initialValues={{
                                originPostCode: shipmentDetails.originPostCode || '',
                                destinationPostCode: shipmentDetails.destinationPostCode || '',
                                weight: Number(shipmentDetails.weight) || 0,
                                length: Number(shipmentDetails.length) || 0,
                                width: Number(shipmentDetails.width) || 0,
                                height: Number(shipmentDetails.height) || 0,
                                isReturn: true,
                            }}
                            onSubmit={values => {
                                handleCalculateRate(values);
                            }}
                            validationSchema={calculateShipmentSchema}
                        >
                            {({ handleSubmit }) => (
                                <Form layout="vertical" className="w-full" onFinish={handleSubmit}>
                                    <Row className="w-full" gutter={10}>
                                        <Col xs={24} lg={10} xl={5} className="mt-5">
                                            <Field name="originPostCode">
                                                {({ field, meta }: FieldProps) => (
                                                    <Form.Item
                                                        label="Origin PIN Code"
                                                        validateStatus={
                                                            meta.touched && meta.error
                                                                ? 'error'
                                                                : ''
                                                        }
                                                        help={meta.touched && meta.error}
                                                    >
                                                        <Input
                                                            {...field}
                                                            placeholder="Origin PIN Code"
                                                            maxLength={6}
                                                            disabled
                                                        />
                                                    </Form.Item>
                                                )}
                                            </Field>
                                        </Col>
                                        <Col xs={24} lg={10} xl={5} className="mt-5">
                                            <Field name="destinationPostCode">
                                                {({ field, meta }: FieldProps) => (
                                                    <Form.Item
                                                        label="Destination PIN Code"
                                                        validateStatus={
                                                            meta.touched && meta.error
                                                                ? 'error'
                                                                : ''
                                                        }
                                                        help={meta.touched && meta.error}
                                                    >
                                                        <Input
                                                            {...field}
                                                            placeholder="Destination PIN Code"
                                                            maxLength={6}
                                                            disabled
                                                        />
                                                    </Form.Item>
                                                )}
                                            </Field>
                                        </Col>
                                        <Col xs={12} lg={4} xl={3} className="sm:mt-5">
                                            <NumberWithUnit
                                                name="weight"
                                                label="Total Weight"
                                                unit="Kg"
                                                isRequired
                                                min={0}
                                                step={0.1}
                                                precision={2}
                                                placeholder="0"
                                                isDisabled
                                            />
                                        </Col>
                                        <Col xs={24} xl={12}>
                                            <Card
                                                styles={{ body: { padding: 0 } }}
                                                className="p-4 rounded-xl"
                                            >
                                                <Row gutter={10}>
                                                    <Col xs={12} sm={8}>
                                                        <NumberWithUnit
                                                            name="length"
                                                            label="Length"
                                                            unit="CM"
                                                            isRequired
                                                            min={0}
                                                            step={0.1}
                                                            precision={2}
                                                            placeholder="X"
                                                            isDisabled
                                                        />
                                                    </Col>
                                                    <Col xs={12} sm={8}>
                                                        <NumberWithUnit
                                                            name="width"
                                                            label="Width"
                                                            unit="CM"
                                                            isRequired
                                                            min={0}
                                                            step={0.1}
                                                            precision={2}
                                                            placeholder="X"
                                                            isDisabled
                                                        />
                                                    </Col>
                                                    <Col xs={12} sm={8}>
                                                        <NumberWithUnit
                                                            name="height"
                                                            label="Height"
                                                            unit="CM"
                                                            isRequired
                                                            min={0}
                                                            step={0.1}
                                                            precision={2}
                                                            placeholder="X"
                                                            isDisabled
                                                        />
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Form>
                            )}
                        </Formik>
                    </Flex>
                </Flex>
            </Flex>
        </Card>
    );
};

export default CalculateCost;
