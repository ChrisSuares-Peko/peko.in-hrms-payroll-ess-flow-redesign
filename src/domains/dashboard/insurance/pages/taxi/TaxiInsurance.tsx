import React, { useState } from 'react';

import { Button, Col, Flex, Form } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import taxi from '@src/domains/dashboard/insurance/assets/svg/taxi.svg';

import SectionHeader from '../../components/SectionHeader';
import VehicleDetailsModal from '../../components/VehicleDetailsModal';

const TaxiInsurance = () => {
    const [openVehicleDetailModal, setOpenVehicleDetailModal] = useState(false);

    return (
        <Content className="sm:px-8">
            <Flex vertical gap={20}>
                <SectionHeader title="Taxi Insurance" subTitle="Taxi Insurance made simple" />
                <Col lg={6}>
                    <Formik
                        initialValues={{
                            vehicleNo: '',
                        }}
                        onSubmit={values => {
                            console.log(values);
                        }}
                    >
                        {({ handleSubmit }) => (
                            <Form onFinish={handleSubmit} layout="vertical" className="">
                                <Col xs={24}>
                                    <TextInput
                                        label="Enter Your Taxi Number"
                                        name="vehicleNo"
                                        placeholder="Enter Your Taxi Number"
                                        type="text"
                                        isRequired
                                    />
                                </Col>
                                <Button
                                    danger
                                    type="primary"
                                    size="middle"
                                    className="w-full rounded-sm"
                                    onClick={() => setOpenVehicleDetailModal(true)}
                                >
                                    Continue
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </Col>

                <VehicleDetailsModal
                    vehicleName="Taxi"
                    VehicleSvg={taxi}
                    open={openVehicleDetailModal}
                    handleCancel={() => setOpenVehicleDetailModal(!openVehicleDetailModal)}
                />
            </Flex>
        </Content>
    );
};
export default TaxiInsurance;
