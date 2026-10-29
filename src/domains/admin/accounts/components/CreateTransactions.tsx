import React, { useEffect, useRef, useState } from 'react';

import { Form } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import OtpModal from '@components/molecular/modals/OtpModal';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import FormComponent from './FormComponent';
import { getOtpOthers } from '../api/otp';
import useCreateTransaction from '../hooks/useCreateTransaction';
import { createTransactionSchema } from '../schema/createTransactionSchema';
import { CorporateRechargeData, RolePermissionAccessData } from '../types/createTransactions';

const CreateTransactions = () => {
    const dispatch = useDispatch();
    const [searchCorporate, setSearchCorporate] = useState<string>('');
    const [searchOperator, setSearchOperator] = useState<string>('');
    const { corporateData, create, operatorData, isLoading, category } = useCreateTransaction({
        searchCorporate,
        searchOperator,
    });
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const service = useFindRolesService(services?.data, 'Create Transaction'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    // F-OTH-18: Create Transaction now requires an OTP — submit requests one and opens a
    // confirmation modal instead of creating the transaction immediately.
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [pendingValues, setPendingValues] = useState<CorporateRechargeData>();
    const resetFormRef = useRef<() => void>();
    // F-OTH-09/18: one idempotency key per submit click — reused across OTP retries of the
    // same attempt, so the backend can tell a genuine resubmit apart from a network retry.
    const idempotencyKeyRef = useRef<string>();
    return (
        <>
            <Formik
                enableReinitialize
                initialValues={{
                    corporateId: '',
                    corporateName: '',
                    rechargeAmount: '',
                    accountNo: '',
                    service: '',
                    merchantCommission: '',
                    adminCommission: '',
                    serviceType: '',
                    transactionId: '',
                    orderId: '',
                    providerId: '',
                    surcharge: '',
                    serviceOperatorId: '',
                    categoryName: '',
                    remarks: '',
                }}
                validationSchema={createTransactionSchema}
                onSubmit={async (values, { resetForm }) => {
                    resetFormRef.current = resetForm;
                    setPendingValues({
                        ...values,
                        corporateName: corporateData?.find(
                            item => item.value.toString() === values.corporateId
                        )?.label!,
                        service: category.find(
                            item => item.id.toString() === values.serviceOperatorId
                        )?.serviceProvider!,
                        categoryName: category.find(
                            item => item.id.toString() === values.serviceOperatorId
                        )?.serviceCategory!,
                    });
                    idempotencyKeyRef.current = crypto.randomUUID();
                    setIsOtpSending(true);
                    const resp = await getOtpOthers({ userId: id, userType: role });
                    setIsOtpSending(false);
                    if (resp) {
                        setIsOtpOpen(true);
                    }
                }}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
                        <FormComponent
                            setSearchCorporate={setSearchCorporate}
                            setSearchOperator={setSearchOperator}
                            corporateData={corporateData}
                            operatorData={operatorData}
                            isLoading={isLoading}
                            accessPermission={accessPermission}
                        />
                    </Form>
                )}
            </Formik>
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
                handleSubmit={async otp => {
                    const res: boolean = await create({
                        ...pendingValues!,
                        otp,
                        idempotencyKey: idempotencyKeyRef.current,
                    });
                    if (res === true) {
                        dispatch(
                            showToast({
                                description: `Transaction created Successfully`,
                                variant: 'success',
                            })
                        );
                        setIsOtpOpen(false);
                        resetFormRef.current?.();
                    }
                    if (res === false) {
                        dispatch(
                            showToast({
                                description: `Failed to create Transaction`,
                                variant: 'error',
                            })
                        );
                    }
                }}
                title="Confirm Transaction"
            />
        </>
    );
};

export default CreateTransactions;
