import React from 'react';

import { Divider, Flex, Modal, Typography } from 'antd';

interface modalProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    rateCondition?: any;
}

const RateCondition = ({ isModalOpen, handleCancel, rateCondition }: modalProps) => {
    const renderPolicy = (policy: any, index: any) => {
        const isHtml =
            policy.includes('&lt;') || policy.includes('<ul>') || policy.includes('<li>');

        // Convert HTML entities to real tags
        const decodedHTML = policy
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');

        return (
            <Flex key={index} vertical>
                <Typography.Text className="pt-1 text-sm" style={{ lineHeight: '1.5' }}>
                    {/* eslint-disable-next-line react/no-danger */}
                    {isHtml ? <span dangerouslySetInnerHTML={{ __html: decodedHTML }} /> : policy}
                </Typography.Text>
            </Flex>
        );
    };

    return (
        <Modal
            title="Hotel Policies"
            open={isModalOpen}
            onCancel={handleCancel}
            footer={null}
            width={800}
        >
            <Divider />
            <div className="px-4">
                {rateCondition && rateCondition.length > 0 ? (
                    <Flex vertical gap={15}>
                        {rateCondition.map((policy: any, index: any) =>
                            renderPolicy(policy, index)
                        )}
                    </Flex>
                ) : (
                    <Typography className="mt-3 text-justify" style={{ lineHeight: '1.5' }}>
                        Hotel policy details are not available at this time.
                    </Typography>
                )}
            </div>
        </Modal>
    );
};

export default RateCondition;
