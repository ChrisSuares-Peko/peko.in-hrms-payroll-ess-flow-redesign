import React, { useState } from 'react';

import { Button, Flex, Modal } from 'antd';
import { Formik } from 'formik';

import OtpModal from '@components/molecular/modals/OtpModal';

import AddDomesticBankForm from '../../forms/collectPayment/AddDomesticBankForm';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { addDomesticBankSchema } from '../../schema/collectPayment/addDomesticBankSchema';
import { AddDomesticBankValues } from '../../types/CollectPayment';
import LeftHeader from '../shared/LeftHeader';

const ADD_DOMESTIC_BANK_INITIAL_VALUES: AddDomesticBankValues = {
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'Savings',
    bankBranch: '',
};

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    sendOtp: (accountNumber: string) => Promise<boolean>;
    addAccount: (values: AddDomesticBankValues, otp: string, onSuccess: () => void) => Promise<void>;
    isSendingOtp: boolean;
    isAdding: boolean;
}

const AddDomesticBankModal: React.FC<Props> = ({
    open,
    onCancel,
    onSuccess,
    sendOtp,
    addAccount,
    isSendingOtp,
    isAdding,
}) => {
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({ schema: addDomesticBankSchema });
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [pendingValues, setPendingValues] = useState<AddDomesticBankValues | null>(null);

    const handleOtpVerify = (otp: string) => {
        if (!pendingValues) return;
        addAccount(pendingValues, otp, () => {
            setIsOtpOpen(false);
            onSuccess();
        });
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={onCancel}
                footer={null}
                centered
                width={600}
                closable={false}
                destroyOnHidden
                className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:overflow-hidden"
            >
                <Flex vertical gap={20} className="p-7">
                    <LeftHeader
                        title="Add Domestic Account"
                        description="Enter your domestic bank account details for INR transactions"
                    />
                    <Formik
                        initialValues={ADD_DOMESTIC_BANK_INITIAL_VALUES}
                        validationSchema={addDomesticBankSchema}
                        onSubmit={async values => {
                            setPendingValues(values);
                            const sent = await sendOtp(values.accountNumber);
                            if (sent) setIsOtpOpen(true);
                        }}
                    >
                        {({ handleSubmit: formikSubmit, setFieldTouched, values }) => (
                            <Flex vertical gap={16}>
                                <AddDomesticBankForm />
                                <Flex gap={12}>
                                    <Button
                                        block
                                        className="h-10 rounded-lg border-[#CBD5E1] text-[#475569]"
                                        onClick={onCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        block
                                        type="primary"
                                        danger
                                        loading={isSendingOtp}
                                        className="h-10 rounded-lg"
                                        onClick={() =>
                                            handleFormSubmitWithAutoFocus(
                                                formikSubmit,
                                                setFieldTouched,
                                                values
                                            )
                                        }
                                    >
                                        Add Account
                                    </Button>
                                </Flex>
                            </Flex>
                        )}
                    </Formik>
                </Flex>
            </Modal>

            <OtpModal
                isOpen={isOtpOpen}
                isLoading={isAdding}
                handleCancel={() => setIsOtpOpen(false)}
                onResend={() => { if (pendingValues) sendOtp(pendingValues.accountNumber); }}
                isOtpSending={isSendingOtp}
                handleSubmit={handleOtpVerify}
                title="Verify Bank Account"
            />
        </>
    );
};

export default AddDomesticBankModal;
