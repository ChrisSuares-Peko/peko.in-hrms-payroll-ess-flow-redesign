import React from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

type Props = {
    title: string;
    description?: string;
    onClose?: () => void;
    titleClass?: string;
    descriptionClass?: string;
};

const LeftHeader: React.FC<Props> = ({
    title,
    description,
    onClose,
    titleClass,
    descriptionClass,
}) => (
        <Flex justify="space-between" align="flex-start">
            <Flex vertical gap={4}>
                <Typography.Text className={twMerge('text-lg font-semibold block', titleClass)}>
                    {title}
                </Typography.Text>
                {description && (
                    <Typography.Text
                        className={twMerge(
                            'text-gray-500 text-sm font-normal block',
                            descriptionClass
                        )}
                    >
                        {description}
                    </Typography.Text>
                )}
            </Flex>
            {onClose && (
                <CloseCircleOutlined
                    className="text-gray-400 text-lg cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={onClose}
                />
            )}
        </Flex>
    );

export default LeftHeader;
