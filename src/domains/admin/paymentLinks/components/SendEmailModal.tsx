import { useState } from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Modal, Button, Input, Typography } from 'antd';

import useSendMail from '../hooks/useSendMail';
import { mailSchema } from '../schema';

interface ModalProps {
    open: boolean;
    handleCancel: () => void;
    contactPerson?: any;
    amount?: string;
    link?: string;
}
export const SendEmailModal = ({ open, handleCancel, contactPerson, amount, link }: ModalProps) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const { sendMail, loading } = useSendMail();
    const emailLoader = loading;

    const handleOnClose = () => {
        handleCancel();
        setEmail('');
    };
    const handleFormSubmit = async () => {
        const paymentLinkPayload = {
            email,
            amount,
            link,
            contactPerson,
        };
        const valid = await validateEmail();
        if (valid) {
            await sendMail(paymentLinkPayload);
            handleCancel();
            setEmail('');
        }
    };
    const validateEmail = () => {
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // First, check the email against the regex pattern
        if (!emailPattern.test(email)) {
            setError('Invalid email format');
            setTimeout(() => {
                setError('');
            }, 3000);
            return false;
        }
        const valid = mailSchema
            .validate({ email })
            .then(() => {
                // Validation succeeded, do something
                setError('');
                return true;
            })
            .catch(validationError => {
                // Validation failed, display error message
                setError(validationError.errors[0]);
                setTimeout(() => {
                    setError('');
                }, 3000);
                return false;
            });

        return valid;
    };

    return (
        <Modal
            title="Send Email"
            open={open}
            onCancel={handleOnClose}
            footer={[
                <Button key="submit" danger onClick={handleFormSubmit} loading={emailLoader}>
                    OK
                </Button>,
                <Button key="cancel" onClick={handleOnClose}>
                    Cancel
                </Button>,
            ]}
        >
            <Input
                value={email}
                onBlur={validateEmail}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter Email Address"
            />
            {error && (
                <Typography.Text className="text-xs" type="danger">
                    <CloseCircleOutlined /> {error}
                </Typography.Text>
            )}
        </Modal>
    );
};
