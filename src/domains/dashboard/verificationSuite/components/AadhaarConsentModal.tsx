import React, { useEffect, useRef, useState } from 'react';

import { Button, Flex, Modal, Spin, Typography } from 'antd';

import useAadhaarVerification from '../hooks/useAadhaarVerification';

type ConsentState = 'waiting' | 'failed' | 'timeout';

interface AadhaarConsentModalProps {
    isOpen: boolean;
    link: string | null;
    referenceNumber: string | null;
    transactionId: string | null;
    handleCancel: () => void;
    onVerified: (data: any) => void;
}

const AadhaarConsentModal = ({
    isOpen,
    link,
    referenceNumber,
    transactionId,
    handleCancel,
    onVerified,
}: AadhaarConsentModalProps) => {
    const { startPolling, stopPolling } = useAadhaarVerification();
    const [consentState, setConsentState] = useState<ConsentState>('waiting');
    const popupRef = useRef<Window | null>(null);

    const openLink = () => {
        if (link) popupRef.current = window.open(link, '_blank');
    };

    const beginVerification = () => {
        if (!referenceNumber || !transactionId) return;
        setConsentState('waiting');
        openLink();
        startPolling(referenceNumber, transactionId, {
            onSuccess: data => onVerified(data),
            onFailed: () => setConsentState('failed'),
            onTimeout: () => setConsentState('timeout'),
        });
    };

    useEffect(() => {
        if (isOpen && link && referenceNumber && transactionId) {
            beginVerification();
        }
        if (!isOpen) {
            stopPolling();
        }
        return () => stopPolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, link, referenceNumber, transactionId]);

    return (
        <Modal
            title="Aadhaar Verification"
            open={isOpen}
            onCancel={handleCancel}
            footer={null}
            centered
            maskClosable={false}
        >
            <Flex vertical align="center" gap={16} className="py-4">
                {consentState === 'waiting' && (
                    <>
                        <Spin size="large" />
                        <Typography.Text className="text-center">
                            Complete the Aadhaar verification in the new tab. This will update
                            automatically once you&apos;re done.
                        </Typography.Text>
                        <Button onClick={openLink}>Reopen Verification Link</Button>
                    </>
                )}
                {consentState === 'failed' && (
                    <>
                        <Typography.Text type="danger" className="text-center">
                            Aadhaar verification failed or was cancelled.
                        </Typography.Text>
                        <Flex gap={12}>
                            <Button type="primary" danger onClick={beginVerification}>
                                Try Again
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Flex>
                    </>
                )}
                {consentState === 'timeout' && (
                    <>
                        <Typography.Text className="text-center">
                            Still processing. This can take a few minutes — check back shortly.
                        </Typography.Text>
                        <Button onClick={beginVerification}>Check Status</Button>
                    </>
                )}
                {consentState !== 'failed' && (
                    <Button type="link" onClick={handleCancel}>
                        Cancel
                    </Button>
                )}
            </Flex>
        </Modal>
    );
};

export default AadhaarConsentModal;
