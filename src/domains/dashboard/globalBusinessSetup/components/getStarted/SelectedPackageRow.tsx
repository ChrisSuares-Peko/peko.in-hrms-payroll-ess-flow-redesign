import React from 'react';

import { CheckCircleFilled, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

interface SelectedPackageRowProps {
    title: string;
    subtitle?: string;
    onChange: () => void;
}

const SelectedPackageRow: React.FC<SelectedPackageRowProps> = ({ title, subtitle, onChange }) => (
    <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={12}
        className="rounded-2xl"
        style={{
            background: 'linear-gradient(90deg, #FFF2F2 0%, #F0F7FF 100%)',
            padding: '16px 20px',
        }}
    >
        <Flex align="center" gap={12} style={{ minWidth: 0, flex: 1 }}>
            <CheckCircleFilled style={{ color: '#26A411', fontSize: 22, flexShrink: 0 }} />
            <Flex vertical gap={2} style={{ minWidth: 0 }}>
                <Typography.Text className="text-base font-semibold text-neutral-900">
                    {title}
                </Typography.Text>
                {subtitle && (
                    <Typography.Text
                        className="text-xs text-neutral-500"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {subtitle}
                    </Typography.Text>
                )}
            </Flex>
        </Flex>
        <Button icon={<EditOutlined />} onClick={onChange} danger>
            Change
        </Button>
    </Flex>
);

export default SelectedPackageRow;
