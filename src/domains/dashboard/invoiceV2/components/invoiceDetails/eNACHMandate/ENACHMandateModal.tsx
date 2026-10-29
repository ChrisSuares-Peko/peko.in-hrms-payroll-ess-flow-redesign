import { useState } from 'react';

import { Flex, Modal } from 'antd';

import MandateAwaitingApproval from './MandateAwaitingApproval';
import MandateForm from './MandateForm';
import MandateInfo from './MandateInfo';
import useENACHMandate from '../../../hooks/invoiceDetails/useENACHMandate';
import { ENACHMandateFormValues } from '../../../types/invoiceDetails';

interface ENACHMandateModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    invoiceData?: {
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
    };
}

const ENACHMandateModal = ({ open, onCancel, onSuccess, invoiceData }: ENACHMandateModalProps) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [authLink, setAuthLink] = useState('');
    const [formValues, setFormValues] = useState<ENACHMandateFormValues | null>(null);

    const {
        isResending,
        isCancelling,
        proceedToAuthorisation,
        resendAuthLink,
        cancelMandateSetup,
    } = useENACHMandate();

    const reset = () => {
        setStep(1);
        setAuthLink('');
        setFormValues(null);
    };

    const handleCancel = async () => {
        await cancelMandateSetup();
        reset();
        onCancel();
    };

    const handleFormSubmit = async (values: ENACHMandateFormValues) => {
        const link = await proceedToAuthorisation(values);
        setFormValues(values);
        setAuthLink(link);
        setStep(3);
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={560}
            closable={false}
            destroyOnHidden
            afterOpenChange={isOpen => {
                if (isOpen) setStep(1);
            }}
            className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:overflow-hidden"
            styles={{ body: { maxHeight: '85vh', overflowY: 'auto' } }}
        >
            <Flex vertical className="p-7">
                {step === 1 && <MandateInfo onBack={onCancel} onNext={() => setStep(2)} />}
                {step === 2 && (
                    <MandateForm
                        initialValues={{
                            name: invoiceData?.customerName,
                            email: invoiceData?.customerEmail,
                            mobile: invoiceData?.customerPhone,
                        }}
                        onBack={() => setStep(1)}
                        onSubmit={handleFormSubmit}
                    />
                )}
                {step === 3 && (
                    <MandateAwaitingApproval
                        authLink={authLink}
                        formValues={formValues!}
                        onResend={resendAuthLink}
                        onCancel={handleCancel}
                        isResending={isResending}
                        isCancelling={isCancelling}
                    />
                )}
            </Flex>
        </Modal>
    );
};

export default ENACHMandateModal;
