import { useEffect, useState } from 'react';

import { CloseCircleOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Typography } from 'antd';

interface ShareDocumentModalProps {
    open: boolean;
    onClose: () => void;
    customerEmail?: string;
    onSend: (email: string) => void;
    isSending: boolean;
    documentLabel?: string;
}

const ShareDocumentModal = ({
    open,
    onClose,
    customerEmail = '',
    onSend,
    isSending,
    documentLabel = 'Document',
}: ShareDocumentModalProps) => {
    const [email, setEmail] = useState(customerEmail);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) setEmail(customerEmail);
    }, [open, customerEmail]);

    const validateEmail = () => {
        const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!pattern.test(email)) {
            setError('Invalid email format');
            setTimeout(() => setError(''), 3000);
            return false;
        }
        setError('');
        return true;
    };

    const handleClose = () => {
        setEmail(customerEmail);
        setError('');
        onClose();
    };

    const handleSend = () => {
        if (!validateEmail()) return;
        onSend(email);
        handleClose();
    };

    return (
        <Modal
            title={
                <span>
                    <MailOutlined className="mr-2" />
                    Send {documentLabel}
                </span>
            }
            open={open}
            onCancel={handleClose}
            footer={null}
            width={480}
            centered
            destroyOnHidden
            styles={{ content: { borderRadius: 16, overflow: 'hidden' } }}
        >
            <div className="pt-2">
                <Input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={validateEmail}
                    placeholder="Enter Email Address"
                    className="mb-2"
                />
                {error && (
                    <Typography.Text className="text-xs" type="danger">
                        <CloseCircleOutlined /> {error}
                    </Typography.Text>
                )}
                <Flex className="mt-4" gap={8} justify="flex-end">
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button danger onClick={handleSend} loading={isSending}>
                        Send Email
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};

export default ShareDocumentModal;
