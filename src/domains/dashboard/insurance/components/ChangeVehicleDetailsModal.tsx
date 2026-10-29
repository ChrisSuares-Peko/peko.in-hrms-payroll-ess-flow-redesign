import React from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import SelectInput from '@components/atomic/inputs/SelectInput';

interface ChangeVehicleModalProps {
    vehicleName: string;
    open: boolean;
    handleCancel: () => void;
}

const ChangeVehicleDetailsModal = ({
    vehicleName,
    open,
    handleCancel,
}: ChangeVehicleModalProps) => {
    const navigate = useNavigate();
    return (
        <Formik
            initialValues={{
                brand: '',
                model: '',
                fuelType: '',
                varient: '',
                registrationDate: '',
            }}
            onSubmit={values => {
             
                navigate('list');
            }}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Drawer
                    open={open}
                    onClose={handleCancel}
                    closeIcon={<CloseCircleOutlined style={{ color: 'red' }} />}
                    styles={{ body: { paddingTop: 10 } }}
                >
                    <Typography.Title level={3} style={{ fontWeight: 500 }}>
                        Change {vehicleName} details
                    </Typography.Title>
                    <br />
                    <Typography.Text editable>KL-34-G-9472 </Typography.Text>
                    <Flex vertical className="w-full mt-5">
                        <Form layout="vertical">
                            <SelectInput
                                name="brand"
                                label="Brand"
                                placeholder="Select Brand"
                                classes=" rounded-sm "
                                options={[
                                    'Hyundai',
                                    'Tata Motors',
                                    'Honda',
                                    'Volkswagen',
                                    'Toyota',
                                ]}
                                isRequired
                            />
                            <SelectInput
                                name="model"
                                label="Model"
                                placeholder="Select Model"
                                classes=" rounded-sm "
                                options={['Urban Cruiser', 'Innova Crysta', 'Glanza', 'Fortuner']}
                                isRequired
                            />
                            <SelectInput
                                name="fuelType"
                                label="Fuel Type"
                                placeholder="Select Fuel Type"
                                classes=" rounded-sm "
                                options={['Petrol', 'Diesel', 'CNG', 'Electric']}
                                isRequired
                            />
                            <SelectInput
                                name="varient"
                                label="Varient"
                                placeholder="Select Varient"
                                classes=" rounded-sm "
                                options={['LXI', 'VXI', 'ZXI']}
                                isRequired
                            />
                            <SelectInput
                                name="registrationDate"
                                label="Registration Date"
                                placeholder="Select Year"
                                classes=" rounded-sm "
                                options={['2000', '2010', '2020']}
                                isRequired
                            />
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={isSubmitting}
                                onClick={() => handleSubmit()}
                                className=" rounded-sm w-full"
                            >
                                Submit
                            </Button>
                        </Form>
                    </Flex>
                </Drawer>
            )}
        </Formik>
    );
};

export default ChangeVehicleDetailsModal;
