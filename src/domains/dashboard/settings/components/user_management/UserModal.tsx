import React, { useState } from 'react';

import { Col, Flex, Form, Row, Typography } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

import indianFlag from '@assets/svg/indianFlag.svg';
import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useCrud from '../../hooks/user_management/useCrud';
import { subCorporateSchema } from '../../schema';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable: () => void;
}

const UserModal = ({ open, handleCancel, reloadTable }: modalProps) => {
    const {
        validateBeforeCreateSubUser,
        createSubUser,
        corporateServices,
        isInitialSubmit,
        isLoading,
        setIsInitialSubmit,
    } = useCrud({
        reloadTable,
        handleCancel,
    });

    const [allServicesChecked, setAllServicesChecked] = useState(false);

    const handleAllServicesChange = (e: CheckboxChangeEvent, setFieldValue: any) => {
        const isChecked = e.target.checked;
        setAllServicesChecked(isChecked);
        corporateServices.forEach(service => {
            setFieldValue(`services.${service.label}`, isChecked);
        });
    };

    return (
        <CustomModalWithForm
            modalTitle="Invite User"
            open={open}
            handleCancel={isInitialSubmit ? handleCancel : () => setIsInitialSubmit(true)}
            initialValues={{
                name: '',
                email: '',
                confirmemail: '',
                mobileNo: '',
                // Least privilege by default — granting admin authority must be a deliberate selection.
                role: '',
                services: {},
            }}
            handleFormSubmit={isInitialSubmit ? validateBeforeCreateSubUser : createSubUser}
            validationSchema={subCorporateSchema}
            isLoading={isLoading}
            firstBtnTxt={isInitialSubmit ? 'Next' : 'Submit'}
            secondBtnTxt={isInitialSubmit ? 'Cancel' : 'Go back'}
            resetFormWhenClose={false}
        >
            {({ setFieldValue, values }) => (
                <Flex vertical className=" w-full">
                    <Form layout="vertical">
                        {isInitialSubmit ? (
                            <>
                                <TextInput
                                    name="name"
                                    label="Name"
                                    type="text"
                                    placeholder="Enter employee name"
                                    classes="rounded-sm"
                                    isRequired
                                    maxLength={50}
                                    allowAlphabetsAndSpaceOnly
                                />
                                <TextInput
                                    name="role"
                                    label="Role"
                                    type="text"
                                    placeholder="Enter employee role"
                                    classes="rounded-sm"
                                    isRequired
                                    maxLength={50}
                                    allowAlphabetsAndSpaceOnly
                                    showToolTip
                                    tooltipText="Specify the user's role within the company. Example - Accountant, Finance Manager, Operations Executive, etc."
                                />
                                <TextInput
                                    name="mobileNo"
                                    label="Mobile Number"
                                    type="text"
                                    placeholder="Enter mobile number"
                                    classes="rounded-sm"
                                    maxLength={10}
                                    allowNumbersOnly
                                    isRequired
                                    prefix={
                                        <Flex
                                            align="center"
                                            gap={6}
                                            className="h-full border-e me-2 cursor-not-allowed"
                                        >
                                            <img src={indianFlag} alt="" />
                                            <p>+91</p>
                                        </Flex>
                                    }
                                />
                                <TextInput
                                    name="email"
                                    label="Email ID"
                                    type="text"
                                    placeholder="Enter email ID"
                                    classes="rounded-sm"
                                    isRequired
                                    maxLength={60}
                                />
                                <TextInput
                                    name="confirmemail"
                                    label="Confirm Email"
                                    type="text"
                                    placeholder="Confirm your email ID"
                                    classes="rounded-sm"
                                    isRequired
                                    maxLength={60}
                                    disablePaste
                                />
                            </>
                        ) : (
                            <Flex vertical>
                                <Typography.Text className="text-base font-medium mb-8">
                                    Select Services
                                </Typography.Text>
                                <Row className="mt-3">
                                    <Col span={24}>
                                        <CheckboxInput
                                            name="all"
                                            checked={allServicesChecked}
                                            onChange={e =>
                                                handleAllServicesChange(e, setFieldValue)
                                            }
                                        >
                                            Enable All Services
                                        </CheckboxInput>
                                    </Col>

                                    {corporateServices.map(item => (
                                        <Col span={12} key={item.label}>
                                            <CheckboxInput
                                                name={item.label}
                                                onChange={e =>
                                                    setFieldValue(
                                                        `services.${item.label}`,
                                                        e.target.checked
                                                    )
                                                }
                                                checked={values.services[item.label]}
                                            >
                                                {item.display}
                                            </CheckboxInput>
                                        </Col>
                                    ))}
                                </Row>
                            </Flex>
                        )}
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default UserModal;
