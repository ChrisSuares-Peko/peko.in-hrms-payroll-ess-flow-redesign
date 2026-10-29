import React from 'react';

import { Col, Flex, Form, Row, Typography } from 'antd';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useCrud from '../../hooks/user_management/useCrud';
import { SubCorporate } from '../../types/userManagement';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRow: SubCorporate;
    reloadTable: () => void;
}

const SelectServiceModal = ({ handleCancel, open, selectedRow, reloadTable }: modalProps) => {
    const { isLoading, updateServiceAccess, initialValues, corporateServices } = useCrud({
        reloadTable,
        handleCancel,
        selectedRow,
    });

    return (
        <CustomModalWithForm
            modalTitle="Select Services"
            open={open}
            handleCancel={handleCancel}
            reinitialise
            initialValues={initialValues}
            handleFormSubmit={values => {
                updateServiceAccess(values, selectedRow.id);
            }}
            isLoading={isLoading}
        >
            {({ values, setFieldValue }) => {
                const areAllServicesSelected = corporateServices.every(
                    service => values[service.label] === true
                );
                return (
                    <Form>
                        <Flex vertical>
                            <Typography.Text className="text-base font-medium mb-8">
                                Select Services
                            </Typography.Text>
                            <Row className="mt-3">
                                <Col span={24}>
                                    <CheckboxInput
                                        name="allServices"
                                        checked={areAllServicesSelected}
                                        onChange={e => {
                                            const allChecked = e.target.checked;
                                            corporateServices.forEach(service => {
                                                setFieldValue(service.label, allChecked); // Set all checkboxes
                                            });
                                        }}
                                    >
                                        Enable All Services
                                    </CheckboxInput>
                                </Col>

                                {/* Individual Services */}
                                {corporateServices.map(item => (
                                    <Col span={12} key={item.label}>
                                        <CheckboxInput
                                            name={item.label}
                                            checked={values[item.label]}
                                            onChange={e =>
                                                setFieldValue(item.label, e.target.checked)
                                            }
                                        >
                                            {item.display}
                                        </CheckboxInput>
                                    </Col>
                                ))}
                            </Row>
                        </Flex>
                    </Form>
                );
            }}
        </CustomModalWithForm>
    );
};

export default SelectServiceModal;
