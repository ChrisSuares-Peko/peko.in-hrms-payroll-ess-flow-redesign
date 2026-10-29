import React, { lazy, useRef, useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { FormikProps } from 'formik';
import Lottie from 'react-lottie';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppSelector } from '@src/hooks/store';

import BeneficiaryForm from './forms/BeneficiaryForm';
import animationData from '../assets/animation/mobilerecharge.json';
import useGetBeneficiaries from '../hooks/useBeneficiaryApis';
import { generateBeneficaryDynamicSchema } from '../schema/index';
import { AddBeneficiaryModalProps, BeneficiaryActionType, CustomerParam } from '../types/index';

const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));
// const OtpModal = lazy(() => import('@components/molecular/modals/OtpModal'));

const { Text } = Typography;

const AddBeneficiaryModal: React.FC<AddBeneficiaryModalProps> = ({
    open,
    closeAddModal,
    editValues,
    accessKeyName,
    beneficiaryActionType,
    setBeneficiaryActionType,
}) => {
    // const [showOtpModal, setShowOtpModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [isNumberFetching, setIsNumberFetching] = useState(false);
    const [service, setService] = useState(accessKeyName || editValues?.accessKey);
    const [selectedBillerData, setSelectedBillerData] = React.useState<CustomerParam[]>([]);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const beneficiaryForm = useRef<FormikProps<any>>(null);
    const {
        buttonLoader,
        // sendOtpApi,
        // isOtpSending,
        generateIntialValues,
        // handleOtpSubmit,
        handleDirectSubmit,
        deleteBeneficicary,
    } = useGetBeneficiaries({
        accessKey: accessKeyName,
        // openOtpModal: () => setShowOtpModal(true),
        // closeOtpModal: () => setShowOtpModal(false),
        openOtpModal: () => {},
        closeOtpModal: () => {},
        closeConfirmationModal: () => setOpenConfirmationModal(false),
        closeAddModal,
        formRefName: beneficiaryForm,
        beneficiaryActionType,
        setBeneficiaryActionType,
        editValues,
        selectedBillerData,
    });
    const { ADD, EDIT } = BeneficiaryActionType;

    const lottieOptions = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
    };

    return (
        <>
            <CustomModalWithForm
                isLoading={buttonLoader}
                overlayLoading={isNumberFetching}
                loader={<Lottie options={lottieOptions} height={120} width={120} />}
                modalTitle={
                    <>
                        <Flex justify="space-between">
                            <Text className="font-medium text-base">
                                {beneficiaryActionType === ADD ? 'Add' : 'Edit'} Beneficiary Details
                            </Text>
                            {beneficiaryActionType !== ADD && (
                                <DeleteOutlined
                                    className="text-xl text-bgOrange2"
                                    onClick={() => setOpenConfirmationModal(true)}
                                />
                            )}
                        </Flex>
                        <Text className="text-textGrey font-normal text-xs sm:text-sm">
                            This will help you to process the payment quickly
                        </Text>
                    </>
                }
                open={open}
                handleCancel={() => {
                    closeAddModal();
                    if (!editValues) {
                        if (!accessKeyName) {
                            setService('');
                        }
                        setSelectedBillerData([]); // Clear dynamic fields on close
                    }
                }}
                reinitialise
                handleFormSubmit={handleDirectSubmit}
                formRefName={beneficiaryForm}
                initialValues={generateIntialValues(selectedBillerData)}
                validationSchema={generateBeneficaryDynamicSchema(selectedBillerData, service)}
                maskClosable={false}
                validateOnChange
            >
                <BeneficiaryForm
                    service={service}
                    setService={setService}
                    accessKeyName={accessKeyName}
                    selectedBillerData={selectedBillerData}
                    setSelectedBillerData={setSelectedBillerData}
                    editValues={editValues}
                    onNumberFetching={setIsNumberFetching}
                />
            </CustomModalWithForm>
            {/* <OtpModal
                isOpen={showOtpModal}
                isLoading={buttonLoader!}
                handleCancel={() => setShowOtpModal(false)}
                onResend={() => sendOtpApi(beneficiaryActionType)}
                isOtpSending={isOtpSending}
                handleSubmit={otp => handleFormSubmit(otp)}
                title="OTP Verification"
            /> */}
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this beneficiary ?"
                handleSubmit={async () => {
                    if (editValues?.id) {
                        const resp = await deleteBeneficicary({
                            userId: id,
                            userType: role,
                            id: editValues.id,
                        });
                        if (resp) {
                            setOpenConfirmationModal(false);
                            if (setBeneficiaryActionType) {
                                setBeneficiaryActionType(EDIT);
                            }
                        }
                    }
                    // setBeneficiaryActionType(DELETE);
                    // await handleFormSubmit('');
                }}
                isLoading={buttonLoader!}
            />
        </>
    );
};
export default React.memo(AddBeneficiaryModal);
