import { useEffect, useState } from 'react';

import { Modal, Button, Typography, Flex } from 'antd';

import useCreatePaymentLink from '../hooks/useCreatePaymentLink';

interface ModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedLinkDetails?: any;
}

export const ResendLinkModal = ({ open, handleCancel, selectedLinkDetails }: ModalProps) => {
    const [updatedExpiryDate, setUpdatedExpiryDate] = useState<any>(
        selectedLinkDetails?.expiryDate
    );
    const { resendPaymentLink, loading } = useCreatePaymentLink();

    const handleOnClose = () => {
        handleCancel();
        setUpdatedExpiryDate('');
    };

    const handleFormSubmit = async () => {
        const paymentLinkPayload = {
            paymentRefId: selectedLinkDetails.invoiceId,
            email: selectedLinkDetails.email,
            updatedExpiryDate: updatedExpiryDate || undefined,
        };

        await resendPaymentLink(paymentLinkPayload);
        handleCancel();
        setUpdatedExpiryDate('');
    };
    useEffect(() => {
        setUpdatedExpiryDate(selectedLinkDetails?.expiryDate);
    }, [selectedLinkDetails?.expiryDate]);

    return (
        <Modal
            title="Resend Payment Link"
            open={open}
            onCancel={handleOnClose}
            footer={[
                <Button key="submit" danger onClick={handleFormSubmit} loading={loading}>
                    Resend
                </Button>,
                <Button key="cancel" onClick={handleOnClose}>
                    Cancel
                </Button>,
            ]}
        >
            <Flex className="min-h-20" align="center">
                <Typography.Text className="text-base">
                    Are you sure you want to resend the payment link to the user?
                </Typography.Text>
            </Flex>

            {/* <Flex vertical gap={5}>
                <Typography.Text>Select a new expiry date (if needed)</Typography.Text>
                <DatePicker
                    disabledDate={current =>
                        current && current < dayjs(selectedLinkDetails?.expiryDate)
                    }
                    value={
                        updatedExpiryDate
                            ? dayjs(updatedExpiryDate)
                            : dayjs(selectedLinkDetails?.expiryDate)
                    }
                    onChange={(date, dateString) => setUpdatedExpiryDate(dateString)}
                    placeholder="Select new expiry date"
                    onKeyDown={e => e.preventDefault()}
                />
            </Flex> */}
        </Modal>
    );
};
