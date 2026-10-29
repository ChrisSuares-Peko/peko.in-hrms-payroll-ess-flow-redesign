import React from 'react';

import { Flex, Typography } from 'antd';

interface DocumentInfoProps {
    label: string;
    value: string;
}

const DocumentInfo: React.FC<DocumentInfoProps> = ({ label, value }) => (
    <Flex justify="space-between" className="mt-5">
        <Typography.Text className="text-base">{label}</Typography.Text>
        <Typography.Link
            href={value}
            style={{ color: '#FF3A3A' }}
            target="_blank"
            rel="noopener noreferrer"
        >
            View
        </Typography.Link>
    </Flex>
);

export default DocumentInfo;
