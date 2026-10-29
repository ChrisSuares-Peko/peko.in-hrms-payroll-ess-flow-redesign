/* eslint-disable no-nested-ternary */
import React, { useEffect, useRef, useState } from 'react';

import { Button, Col, Descriptions, Form, Row, Skeleton } from 'antd';
import { Formik } from 'formik';

import PasswordInput from '@components/atomic/inputs/PasswordInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import OtpModal from '@components/molecular/modals/OtpModal';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getOtpOthers } from '../api/otp';
import useSelfTransfer from '../hooks/useSelfTransfer';
import { selfTransferSchema } from '../schema/selfTransfer';
import { RolePermissionAccessData, SelfTransferPayload } from '../types/SelfTransferTypes';
import { transferTypes } from '../utils/data';

const SelfTransfer = () => {
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const service = useFindRolesService(services?.data, 'Self Transfer'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { handleSelfTransfer, isLoading, walletDetails } = useSelfTransfer(true);
    // F-OTH-18: Self Transfer now requires an OTP — submit requests one and opens a
    // confirmation modal instead of transferring immediately.
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [pendingValues, setPendingValues] = useState<SelfTransferPayload>();
    const resetFormRef = useRef<() => void>();
    // F-OTH-09/18: one idempotency key per submit click — reused across OTP retries of the
    // same attempt, so the backend can tell a genuine resubmit apart from a network retry.
    const idempotencyKeyRef = useRef<string>();
    return (
        <Row className="mt-5" gutter={[60, 30]}>
            <Col xs={24} sm={12} lg={10} xxl={8}>
                <Formik
                    initialValues={{ amount: '', password: '', type: '' }}
                    onSubmit={async (values, { resetForm }) => {
                        // F-OTH-18: request an OTP before transferring, then confirm via the modal.
                        setPendingValues(values);
                        resetFormRef.current = resetForm;
                        idempotencyKeyRef.current = crypto.randomUUID();
                        setIsOtpSending(true);
                        const resp = await getOtpOthers({ userId: id, userType: role });
                        setIsOtpSending(false);
                        if (resp) {
                            setIsOtpOpen(true);
                        }
                    }}
                    validationSchema={selfTransferSchema(walletDetails?.balance || '0')}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} className="w-full " layout="vertical">
                            <SelectInput
                                label="Transfer Type"
                                name="type"
                                placeholder="Select Transfer Type"
                                options={transferTypes}
                            />
                            <TextInput
                                name="amount"
                                label="Amount"
                                placeholder="Enter Amount"
                                type="text"
                                size="large"
                                allowDecimalsOnly
                                maxLength={12}
                            />
                            <PasswordInput
                                label="Password"
                                name="password"
                                placeholder="Enter Password"
                                type="password"
                                size="large"
                            />
                            {accessPermission && accessPermission.update && (
                                <Button
                                    htmlType="submit"
                                    type="primary"
                                    danger
                                    className="mt-5 "
                                    loading={isLoading}
                                >
                                    Submit
                                </Button>
                            )}
                        </Form>
                    )}
                </Formik>
            </Col>
            <Col xs={24} sm={12} lg={14}>
                {isLoading ? (
                    <Skeleton active />
                ) : walletDetails ? (
                    <Descriptions layout="horizontal" bordered title="Your Account">
                        <Descriptions.Item
                            span={24}
                            labelStyle={{ fontWeight: 'bold' }}
                            label="Username"
                        >
                            {walletDetails.username}
                        </Descriptions.Item>
                        <Descriptions.Item
                            span={24}
                            label="Name"
                            labelStyle={{ fontWeight: 'bold' }}
                        >
                            {walletDetails.companyName}
                        </Descriptions.Item>
                        <Descriptions.Item
                            span={24}
                            label="Wallet Balance"
                            labelStyle={{ fontWeight: 'bold' }}
                        >
                            ₹ {formatNumberWithLocalString(Number(walletDetails.balance))}
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    ''
                )}
            </Col>
            <OtpModal
                isOpen={isOtpOpen}
                isLoading={isLoading}
                handleCancel={() => setIsOtpOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    await getOtpOthers({ userId: id, userType: role });
                    setIsOtpSending(false);
                }}
                handleSubmit={otp => {
                    handleSelfTransfer({
                        ...pendingValues!,
                        otp,
                        idempotencyKey: idempotencyKeyRef.current,
                    }).then(response => {
                        if (response) {
                            setIsOtpOpen(false);
                            resetFormRef.current?.();
                        }
                    });
                }}
                title="Confirm Transfer"
            />
        </Row>
    );
};

export default SelfTransfer;
