import React from 'react';

import { Button, Col, Flex, Row, Tooltip, Typography } from 'antd';
import { useFormikContext } from 'formik';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import SwitchInput from '../SwitchInput';

type props = {
    values: any;
    isLoading: boolean;
    accessPermission: any;
};
const FormComponent = ({ values, isLoading, accessPermission }: props) => {
    const { handleSubmit } = useFormikContext();
    const onClickSubmit = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        handleSubmit();
    };

    return (
        <>
            <Typography.Text className="text-lg font-medium">Custom Smart Lockout</Typography.Text>
            <Row gutter={[20, 0]} className="w-full md:w-3/5 pt-5">
                <Col xs={24} md={12}>
                    <TextInput
                        name="maxInvalidLoginAttempts"
                        label="Maximum Invalid Login Attempts"
                        type="text"
                        isRequired
                        classes=" rounded-sm"
                        allowNumbersOnly
                        showToolTip
                        tooltipText="Number of invalid login attempts after which account will be locked."
                        isDisabled={!accessPermission?.update}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="lockEffectivePeriod"
                        label="Lock Effective Period"
                        type="text"
                        isRequired
                        classes=" rounded-sm"
                        allowNumbersOnly
                        showToolTip
                        tooltipText="Number of minutes for which the account will be locked."
                        isDisabled={!accessPermission?.update}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="lockoutTimespan"
                        label="Lockout Timespan"
                        type="text"
                        isRequired
                        classes=" rounded-sm"
                        allowNumbersOnly
                        showToolTip
                        tooltipText="Number of minutes after lock duration gets reset."
                        isDisabled={!accessPermission?.update}
                    />
                </Col>
                <Col xs={24}>
                    <Flex vertical className="w-3/6">
                        <Tooltip
                            placement="rightTop"
                            title={
                                !accessPermission?.update
                                    ? 'Sorry, you do not have permission to perform this action'
                                    : ''
                            }
                        >
                            <span>
                                <SwitchInput
                                    name="enableBannedPasswords"
                                    showToolTip
                                    tooltipText="Disallow specific passwords"
                                    label="Custom Banned Password"
                                    isDisabled={!accessPermission?.update}
                                />
                            </span>
                        </Tooltip>
                        <TextAreaInput
                            name="customBannedPasswords"
                            isRequired
                            placeholder=""
                            isDisabled={!accessPermission?.update}
                        />
                    </Flex>
                </Col>
                <Col xs={24}>
                    {/* <Flex vertical className="w-3/6">
                        <SwitchInput
                            name=""
                            showToolTip
                            tooltipText="Prevent reuse of recent passwords."
                            label="Password History"
                        />
                        <TextAreaInput name="maxPasswordAge" isRequired placeholder="" />
                    </Flex> */}
                </Col>
                {/* <Col xs={24}>
                    <Flex vertical className="w-3/6">
                        <SwitchInput
                            showToolTip
                            tooltipText="Disallow use of personal data in passwords."
                            name="preventPersonalDataInPassword"
                            label="Personal Data in Passwords"
                        />
                    </Flex>
                </Col> */}
                <Col xs={24}>
                    <Flex className="w-full mt-5" justify="flex-start" gap={10} key="">
                        {accessPermission && accessPermission.update && (
                            <Button
                                key="submit"
                                loading={isLoading}
                                type="primary"
                                danger
                                className="px-5"
                                onClick={onClickSubmit}
                            >
                                Save
                            </Button>
                        )}
                    </Flex>
                </Col>
            </Row>
        </>
    );
};

export default FormComponent;
