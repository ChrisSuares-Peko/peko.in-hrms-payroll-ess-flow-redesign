import React, { useEffect, useRef } from 'react';

import { Col, Divider, Flex, Row } from 'antd';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import TextInput from '@components/atomic/inputs/TextInput';
import TypographyText from '@components/atomic/typography/typographyText';

import { TRANSPORT_MODES } from '../constants/eWaybill';
import { EWaybillFormValues } from '../types/eWaybill';

const EWaybillForm: React.FC = () => {
    const { values, setValues, setTouched } = useFormikContext<EWaybillFormValues>();
    const isRoad = values.transportMode === 'road';
    const previousTransportMode = useRef(values.transportMode);

    useEffect(() => {
        if (previousTransportMode.current === values.transportMode) return;
        previousTransportMode.current = values.transportMode;
        setValues(prev => ({
            ...prev,
            transportMode: values.transportMode,
            distance: '',
            transporterGstin: '',
            transporterName: '',
            vehicleNumber: '',
            vehicleType: 'regular',
            transactionNumber: '',
            transactionDate: '',
        }));
        setTouched({});
    }, [values.transportMode, setValues, setTouched]);

    return (
        <Flex vertical gap={16} className="w-full [&_.ant-form-item]:mb-0">
            {/* Transport Mode + Distance */}
            <Row gutter={[20, 16]}>
                <Col xs={24} sm={12}>
                    <RadioGroupInput
                        name="transportMode"
                        label="Transport Mode"
                        options={TRANSPORT_MODES}
                        isRequired
                        hideRadio
                        classes="gap-1"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <Flex vertical gap={4}>
                        <TextInput
                            name="distance"
                            label="Distance (km)"
                            placeholder="Enter Distance (km)"
                            type="text"
                            allowNumbersOnly
                            maxLength={7}
                            isRequired
                        />
                        <TypographyText className="text-[#71717A] text-xs">
                            Max 4000 km per trip
                        </TypographyText>
                    </Flex>
                </Col>
            </Row>

            <Divider className="my-0" />

            {/* Transporter Information */}
            <Flex vertical gap={10}>
                <TypographyText className="text-sm font-semibold">
                    Transporter Information
                </TypographyText>
                <Row gutter={[20, 16]}>
                    {!isRoad && (
                        <>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="transDocNo"
                                    label="Transport Document Number"
                                    placeholder="Enter Transport Document Number"
                                    type="text"
                                    isRequired
                                    maxLength={15}
                                    convertToUppercase
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DatePickerInput
                                    name="transDocDt"
                                    label="Transport Document Date"
                                    placeholder="Select Transport Document Date"
                                    classes="w-full"
                                    isRequired
                                    needConfirm={false}
                                />
                            </Col>
                        </>
                    )}
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="transporterGstin"
                            label="Transporter GSTIN/ID"
                            placeholder="Enter Transporter GSTIN/ID"
                            type="text"
                            convertToUppercase
                            maxLength={15}
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="transporterName"
                            label="Transporter Name"
                            placeholder="Enter Transporter Name"
                            type="text"
                        />
                    </Col>
                </Row>
            </Flex>

            {isRoad && (
                <>
                    <Divider className="my-0" />
                    <Flex vertical gap={10}>
                        <TypographyText className="text-sm font-semibold">
                            Vehicle Details
                        </TypographyText>
                        <Row gutter={[20, 16]}>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="vehicleNumber"
                                    label="Vehicle Number"
                                    placeholder="Enter Vehicle Number"
                                    type="text"
                                    convertToUppercase
                                    allowedCharacters="A-Z0-9-"
                                    maxLength={11}
                                    isRequired
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <RadioGroupInput
                                    name="vehicleType"
                                    label="Vehicle Type"
                                    options={[
                                        { value: 'regular', label: 'Regular' },
                                        { value: 'odc', label: 'ODC(Over Dimensional Cargo)' },
                                    ]}
                                    simple
                                    classes="items-center"
                                    isRequired
                                />
                            </Col>
                        </Row>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default EWaybillForm;
