import { useState } from 'react';

import { Flex, message, Modal, Typography } from 'antd';

import CreatePaymentLinkForm from './createPaymentLink/CreatePaymentLinkForm';
import type { FormState } from './createPaymentLink/CreatePaymentLinkModal.types';
import CreatePaymentLinkSuccess from './createPaymentLink/CreatePaymentLinkSuccess';
import { useCreatePaymentLink } from '../hooks/useCreatePaymentLink';
import { CreatePaymentLinkModalProps } from '../types/paymentLinkTypes';
import { defaultForm, MAX_EXPIRY_MINUTES } from '../utils/data';

const CreatePaymentLinkModal = ({ open, onClose, onSubmit }: CreatePaymentLinkModalProps) => {
    const { loading, createLink } = useCreatePaymentLink('payment_link');
    const [paymentLink, setPaymentLink] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [created, setCreated] = useState(false);
    const [formResetKey, setFormResetKey] = useState(0);
    const [submittedForm, setSubmittedForm] = useState<FormState>(defaultForm);

    const handleCreate = async (values: FormState) => {
        // NuPay initiate_transaction has no merchant-set expiry; expiry_time is kept only to
        // satisfy the current create contract and is ignored once wired to NuPay.
        const result = await createLink({
            amount: Number(values.amount),
            purpose_message: values.purposeMessage,
            expiry_time: MAX_EXPIRY_MINUTES,
            customerName: values.customerName,
            customerEmail: values.customerEmail,
            customerPhone: values.customerPhone,
        });

        if (!result) {
            return;
        }

        setPaymentLink(result.paymentLink || '');
        setExpiresAt(result.expiresAt || '');
        setSubmittedForm(values);
        setCreated(true);
        onSubmit();
    };

    const handleReset = () => {
        setCreated(false);
        setPaymentLink('');
        setExpiresAt('');
        setSubmittedForm(defaultForm);
        setFormResetKey(prev => prev + 1);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(paymentLink);
        message.success('Link copied to clipboard');
    };

    const shareOnWhatsapp = () => {
        if (!paymentLink) {
            message.error('Payment link is not available to share');
            return;
        }

        const text = `Hi, please complete your payment using this link: ${paymentLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            classNames={{
                body: '!rounded-3xl !p-0',
                content: '!rounded-3xl !p-0',
                wrapper: '!rounded-3xl',
            }}
            width={600}
            style={{ maxWidth: '95vw' }}
            centered
        >
            <Flex vertical gap={18} className="rounded-3xl px-6 py-5 sm:px-7 sm:py-6">
                <Flex vertical gap={4}>
                    <Typography.Title
                        level={4}
                        className="!mb-0 !text-[20px] !font-semibold !leading-[1.25] !text-[#1F2A44]"
                    >
                        Create Payment Link
                    </Typography.Title>
                    <Typography.Text className="text-[13px] leading-[1.45] text-[#667085]">
                        Enter payment details to generate a shareable link
                    </Typography.Text>
                </Flex>

                <Flex vertical className="pt-1">
                    {created ? (
                        <CreatePaymentLinkSuccess
                            paymentLink={paymentLink}
                            submittedForm={submittedForm}
                            expiresAt={expiresAt}
                            onCopy={copyLink}
                            onShareWhatsapp={shareOnWhatsapp}
                            onCreateAnother={handleReset}
                        />
                    ) : (
                        <CreatePaymentLinkForm
                            key={formResetKey}
                            loading={loading}
                            initialValues={defaultForm}
                            onCancel={handleClose}
                            onSubmit={handleCreate}
                        />
                    )}
                </Flex>
            </Flex>
        </Modal>
    );
};

export default CreatePaymentLinkModal;
