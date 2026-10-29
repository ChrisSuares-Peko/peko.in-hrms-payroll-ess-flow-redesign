import React from 'react';

import { Modal, Typography, Button, List } from 'antd';

interface TermsAndConditionModalProps {
    isOpen: boolean;
    handleClose: () => void;
}

const TermsAndConditionModal: React.FC<TermsAndConditionModalProps> = ({ isOpen, handleClose }) => {
    const termsAndConditions = [
        'The coupon is valid exclusively for the specified service it is associated with.',
        'Each coupon can be redeemed only once and cannot be reused.',
        'The coupon cannot be combined with any other sales, promotions, or offers.',
        'All coupons must be redeemed within their validity period as specified.',
        'Coupons are non-transferable and can only be used by the intended recipient.',
        'Any misuse, fraudulent activity, or violation of these terms will lead to the immediate cancellation of the coupon.',
    ];

    return (
        <Modal
            open={isOpen}
            onOk={handleClose}
            onCancel={handleClose}
            footer={[
                <Button key="close" type="primary" onClick={handleClose}>
                    Close
                </Button>,
            ]}
        >
            <Typography.Title level={5} className="mb-3">
                Terms and conditions
            </Typography.Title>
            <List
                dataSource={termsAndConditions}
                renderItem={item => (
                    <List.Item>
                        <Typography.Text> {item}</Typography.Text>
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default TermsAndConditionModal;
