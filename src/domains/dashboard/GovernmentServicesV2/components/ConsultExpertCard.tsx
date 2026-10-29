import { useState } from 'react';

import { Button, Flex, Typography } from 'antd';

import RequestCallbackModal from './RequestCallbackModal';

const { Text } = Typography;

const ConsultExpertCard = () => {
    const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);

    return (
        <Flex vertical gap={12} className="p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F0F0F0' }}>
            <Text strong className="text-sm">
                Consult expert
            </Text>
            <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                Consult an expert to walk you through the process:
            </Text>
            <Flex gap={12}>
                <Button style={{ color: '#FF3A3A', borderColor: '#FF3A3A' }} onClick={() => setIsCallbackModalOpen(true)}>
                    Expert assistance
                </Button>
            </Flex>

            <RequestCallbackModal open={isCallbackModalOpen} onClose={() => setIsCallbackModalOpen(false)} />
        </Flex>
    );
};

export default ConsultExpertCard;
