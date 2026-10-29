import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';

type Props = {
    label?: string;
    value?: string;
    valueColor?: string;
    // Optional hover tooltip on the value. When provided we also render a small info icon
    // next to the value so the hover affordance is discoverable.
    valueTooltip?: React.ReactNode;
};

const TextCard = ({ label, value, valueColor, valueTooltip }: Props) => {
    const valueNode = (
        <Typography.Text className={valueColor && `text-[${valueColor}]`}>{value}</Typography.Text>
    );

    return (
        <Flex vertical gap={10}>
            {label && <Typography.Text className="text-gray-400">{label}</Typography.Text>}
            {valueTooltip ? (
                <Tooltip title={valueTooltip} placement="top">
                    <Flex align="center" gap={6} className="cursor-help">
                        {valueNode}
                        <InfoCircleOutlined
                            className="text-xs"
                            style={valueColor ? { color: valueColor } : undefined}
                        />
                    </Flex>
                </Tooltip>
            ) : (
                valueNode
            )}
        </Flex>
    );
};

export default TextCard;
