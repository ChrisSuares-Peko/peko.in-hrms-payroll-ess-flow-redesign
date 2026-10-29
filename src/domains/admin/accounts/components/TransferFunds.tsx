import React, { useEffect, useRef, useState } from 'react';

import { Button, Col, Form, Row } from 'antd';
import { Formik } from 'formik';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import PasswordInput from '@components/atomic/inputs/PasswordInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import OtpModal from '@components/molecular/modals/OtpModal';
import { UserInfoResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import DetailsTransferFunds from './DetailsTransferFunds';
import { getOtpOthers } from '../api/otp';
import useGetCorporate from '../hooks/useGetCorporate';
import useSelfTransfer from '../hooks/useSelfTransfer';
import { transferFundsSchema } from '../schema/transferFunds';
import { SelfTransferPayload, transferFundsDetailsResponse } from '../types/SelfTransferTypes';
import { RolePermissionAccessData } from '../types/TransferFundsTypes';
import { transferTypes } from '../utils/data';

const TransferFunds = () => {
    const { balance, services, id, role } = useAppSelector(state => ({
        balance: (state.reducer.user.user as UserInfoResponse)?.balance,
        services: state.reducer.services.services?.data ?? {},
        id: state.reducer.auth.id,
        role: state.reducer.auth.role,
    }));
    const { handleTransferForOther, isLoading } = useSelfTransfer(false);
    const [walletDetails, setWalletDetails] = useState<transferFundsDetailsResponse>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    // F-OTH-18: Transfer Funds now requires an OTP — the submit button requests one and
    // opens a confirmation modal instead of transferring immediately.
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [pendingValues, setPendingValues] = useState<SelfTransferPayload>();
    const resetFormRef = useRef<() => void>();
    // F-OTH-09/18: one idempotency key per submit click — reused across OTP retries of the
    // same attempt, so the backend can tell a genuine resubmit apart from a network retry.
    const idempotencyKeyRef = useRef<string>();
    const service = useFindRolesService(services, 'Transfer Funds'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);

    const {
        corporatesList,
        isLoading: corporateLoading,
        getCorporateDetailsById,
        initialVal,
        setCorporatesList,
        getCorporateList,
    } = useGetCorporate();
    const handleCorporateChange = (corporateId: string) => {
        const details = getCorporateDetailsById(corporateId);
        setWalletDetails(details);
    };
    const handleClear = (setFieldValue: any) => {
        setCorporatesList(initialVal);
        setFieldValue('credentialId', '');
        setWalletDetails(undefined);
    };
    const handleSearch = (searchText: string) => {
        if (searchText) {
            const results = initialVal.filter(item =>
                item.oName.toLowerCase().includes(searchText.toLowerCase())
            );
            setCorporatesList(results);
        } else {
            setCorporatesList(initialVal);
        }
    };
    return (
        <Row className="mt-5" gutter={[60, 30]}>
            <Col xs={24} sm={12} lg={10} xxl={8}>
                <Formik
                    initialValues={{
                        credentialId: '',
                        amount: '',
                        password: '',
                        type: '',
                        remarks: '',
                    }}
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
                    validationSchema={transferFundsSchema(
                        walletDetails?.balance || '0',
                        balance || '0'
                    )}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} className="w-full " layout="vertical">
                            <CustomSelectSearch
                                onClear={handleClear}
                                showSearch
                                filterOption={false}
                                label="Corporate Name"
                                name="credentialId"
                                onChange={handleCorporateChange}
                                placeholder="Select Corporate"
                                loading={corporateLoading}
                                options={corporatesList}
                                onSearch={handleSearch}
                            />
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
                                maxLength={8}
                            />
                            <TextInput
                                name="remarks"
                                label="Remarks"
                                placeholder="Enter Remarks"
                                type="text"
                                size="large"
                                maxLength={50}
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
            <DetailsTransferFunds isLoading={isLoading} walletDetails={walletDetails} />
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
                    handleTransferForOther({
                        ...pendingValues!,
                        otp,
                        idempotencyKey: idempotencyKeyRef.current,
                    }).then(response => {
                        if (response) {
                            setIsOtpOpen(false);
                            setWalletDetails((prev: transferFundsDetailsResponse | undefined) => ({
                                ...prev!,
                                balance: response.corporateFinalBalance,
                            }));
                            getCorporateList();
                            resetFormRef.current?.();
                        }
                    });
                }}
                title="Confirm Transfer"
            />
        </Row>
    );
};

export default TransferFunds;
