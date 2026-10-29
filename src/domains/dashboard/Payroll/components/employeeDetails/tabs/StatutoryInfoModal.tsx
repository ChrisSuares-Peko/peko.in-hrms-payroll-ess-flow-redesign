import React from 'react';

import { Button, Flex, Modal, Typography } from 'antd';

const { Text } = Typography;

export interface StatutoryInfoSection {
    heading: string;
    bullets: string[];
}

export interface StatutoryInfoContent {
    // e.g. "What is EPF?" — also reused as the hover tooltip on the info icon.
    title: string;
    sections: StatutoryInfoSection[];
}

interface StatutoryInfoModalProps extends StatutoryInfoContent {
    open: boolean;
    onClose: () => void;
}

const StatutoryInfoModal = ({ open, onClose, title, sections }: StatutoryInfoModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        title={title}
        width={640}
        footer={[
            <Button key="ok" type="primary" danger onClick={onClose}>
                Got it
            </Button>,
        ]}
    >
        <Flex vertical gap={16} className="mt-4">
            {sections.map(section => (
                <Flex vertical gap={4} key={section.heading}>
                    <Text className="font-medium text-base">{section.heading}</Text>
                    <ul className="list-disc pl-5 mb-0">
                        {section.bullets.map(bullet => (
                            <li key={bullet}>
                                <Text className="text-textGrey">{bullet}</Text>
                            </li>
                        ))}
                    </ul>
                </Flex>
            ))}
        </Flex>
    </Modal>
);

export default StatutoryInfoModal;
