import React from 'react';

import { Button, Flex, Modal, Typography } from 'antd';

const { Title, Text } = Typography;

interface Props {
    open: boolean;
    vendorName: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const AddBeneficiaryModal: React.FC<Props> = ({ open, vendorName, isLoading, onConfirm, onCancel }) => (
    <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width="min(578px, 95vw)"
        styles={{ content: { borderRadius: 41, padding: '36px 32px' } }}
        title={
            <Title level={3} style={{ margin: '0 0 8px', fontSize: 24 }}>
                Confirm payment
            </Title>
        }
    >
        <Flex vertical gap={24}>
            <Text style={{ fontSize: 16, color: '#858585', lineHeight: '1.6' }}>
                {vendorName} has not been added as a beneficiary. Do you want to save this vendor as beneficiary?
            </Text>
            <Flex gap={9}>
                <Button
                    type="primary"
                    danger
                    style={{ flex: 1, borderRadius: 8, height: 40 }}
                    loading={isLoading}
                    onClick={onConfirm}
                >
                    Add beneficiary
                </Button>
                <Button
                    danger
                    variant="outlined"
                    style={{ flex: 1, borderRadius: 8, height: 40 }}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </Flex>
        </Flex>
    </Modal>
);

export default AddBeneficiaryModal;
