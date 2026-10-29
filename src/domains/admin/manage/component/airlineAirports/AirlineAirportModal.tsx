import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import FieldLabelValue from '@components/molecular/Text/FieldLabelValue';

interface Props {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    mode: 'add' | 'edit';
    onSave: (values: any) => void;
    isLoading: boolean;
}

const addSchema = Yup.object().shape({
    airportCode: Yup.string().trim().required('Airport code is required').max(10),
    airportName: Yup.string().trim().required('Airport name is required').max(200),
    cityCode: Yup.string().trim().max(10),
    cityName: Yup.string().trim().required('City name is required').max(100),
    countryCode: Yup.string().trim().max(10),
    countryName: Yup.string().trim().required('Country name is required').max(100),
    priority: Yup.number()
        .typeError('Priority must be a number')
        .integer('Priority must be a whole number')
        .min(1, 'Priority must be at least 1')
        .nullable()
        .transform((value, original) => (original === '' ? null : value)),
});

const editSchema = Yup.object().shape({
    priority: Yup.number()
        .typeError('Priority must be a number')
        .integer('Priority must be a whole number')
        .min(1, 'Priority must be at least 1')
        .nullable()
        .transform((value, original) => (original === '' ? null : value)),
});

const AirlineAirportModal = ({ open, handleCancel, data, mode, onSave, isLoading }: Props) => {
    const isAdd = mode === 'add';

    const initialValues = isAdd
        ? {
              airportCode: '',
              airportName: '',
              cityCode: '',
              cityName: '',
              countryCode: '',
              countryName: '',
              priority: '',
          }
        : {
              priority: data?.priority != null ? String(data.priority) : '',
          };

    const handleSubmit = (values: typeof initialValues) => {
        if (isAdd) {
            const v = values as any;
            onSave({
                airportCode: v.airportCode.trim().toUpperCase(),
                airportName: v.airportName.trim(),
                cityCode: v.cityCode?.trim() || undefined,
                cityName: v.cityName.trim(),
                countryCode: v.countryCode?.trim() || undefined,
                countryName: v.countryName.trim(),
                priority: v.priority !== '' ? Number(v.priority) : null,
            });
        } else {
            const v = values as any;
            onSave({ priority: v.priority !== '' ? Number(v.priority) : null });
        }
        handleCancel();
    };

    return (
        <CustomModalWithForm
            open={open}
            handleCancel={handleCancel}
            initialValues={initialValues}
            modalTitle={isAdd ? 'Add Airport' : 'Set Airport Priority'}
            validationSchema={isAdd ? addSchema : editSchema}
            handleFormSubmit={handleSubmit}
            isLoading={isLoading}
            firstBtnTxt="Save"
            reinitialise
        >
            <Flex vertical gap={12}>
                {!isAdd && (
                    <Row gutter={[16, 8]}>
                        <Col xs={24} md={12}>
                            <FieldLabelValue label="Airport Code" value={data?.airportCode} />
                        </Col>
                        <Col xs={24} md={12}>
                            <FieldLabelValue label="City" value={data?.cityName} />
                        </Col>
                        <Col xs={24}>
                            <FieldLabelValue label="Airport Name" value={data?.airportName} />
                        </Col>
                    </Row>
                )}

                {isAdd && (
                    <Row gutter={[16, 8]}>
                        <Col xs={24} md={12}>
                            <TextInput
                                name="airportCode"
                                type="text"
                                label="Airport Code (IATA)"
                                placeholder="e.g. DEL"
                                isRequired
                                maxLength={10}
                                convertToUppercase
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput
                                name="cityCode"
                                type="text"
                                label="City Code"
                                placeholder="e.g. DEL"
                                maxLength={10}
                                convertToUppercase
                            />
                        </Col>
                        <Col xs={24}>
                            <TextInput
                                name="airportName"
                                type="text"
                                label="Airport Name"
                                placeholder="e.g. Indira Gandhi International Airport"
                                isRequired
                                maxLength={200}
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput
                                name="cityName"
                                type="text"
                                label="City Name"
                                placeholder="e.g. New Delhi"
                                isRequired
                                maxLength={100}
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput
                                name="countryCode"
                                type="text"
                                label="Country Code"
                                placeholder="e.g. IN"
                                maxLength={10}
                                convertToUppercase
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput
                                name="countryName"
                                type="text"
                                label="Country Name"
                                placeholder="e.g. India"
                                isRequired
                                maxLength={100}
                            />
                        </Col>
                    </Row>
                )}

                <Typography.Text type="secondary" className="text-xs">
                    Enter a priority number (e.g. 1 = highest). Leave blank to skip.
                </Typography.Text>
                <TextInput
                    name="priority"
                    type="text"
                    label="Priority"
                    placeholder="Enter priority number"
                    allowNumbersOnly
                    maxLength={5}
                />
            </Flex>
        </CustomModalWithForm>
    );
};

export default AirlineAirportModal;
