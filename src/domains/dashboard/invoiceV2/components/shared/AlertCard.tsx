import React from 'react';

import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Flex, Tag } from 'antd';
import { twMerge } from 'tailwind-merge';

import TypographyText from '@components/atomic/typography/typographyText';

import { formatDateAndTime } from '../../utils/helperFunctions';

type AlertVariant = 'warning' | 'error' | 'info' | 'success';

interface AlertCardProps {
    variant?: AlertVariant;
    title?: string;
    description?: React.ReactNode;
    cancelledOn?: string;
    reason?: string;
    className?: string;
}

const VARIANT_CONFIG: Record<
    AlertVariant,
    { bg: string; border: string; textColor: string; icon: React.ReactNode }
> = {
    warning: {
        bg: 'bg-[#FFFBEB]',
        border: 'border border-[#FCD34D]',
        textColor: 'text-[#D97706]',
        icon: <ExclamationCircleOutlined />,
    },
    error: {
        bg: 'bg-[#FEF2F2]',
        border: 'border border-[#FECACA]',
        textColor: 'text-[#EF4444]',
        icon: <CloseCircleOutlined />,
    },
    info: {
        bg: 'bg-[#FFFBEB]',
        border: 'border border-[#FCD34D]',
        textColor: 'text-[#F59E0B]',
        icon: <ExclamationCircleOutlined />,
    },
    success: {
        bg: 'bg-[#FFFBEB]',
        border: 'border border-[#FCD34D]',
        textColor: 'text-[#D97706]',
        icon: <CheckCircleOutlined />,
    },
};

const AlertCard: React.FC<AlertCardProps> = ({
    variant = 'warning',
    title,
    description,
    cancelledOn,
    reason,
    className,
}) => {
    const { bg, border, textColor, icon } = VARIANT_CONFIG[variant];

    return (
        <Flex gap={10} className={twMerge(`rounded-xl p-4 ${bg} ${border}`, className)}>
            <TypographyText className={`text-base leading-5 flex-shrink-0 ${textColor}`}>
                {icon}
            </TypographyText>

            <Flex vertical gap={4} className="flex-1 min-w-0">
                {(title || cancelledOn) && (
                    <Flex align="center" gap={8} wrap="wrap">
                        {title && (
                            <TypographyText className={`text-sm font-semibold ${textColor}`}>
                                {title}
                            </TypographyText>
                        )}
                        {cancelledOn && (
                            <Tag
                                color="red"
                                className="text-xs rounded-full px-2 py-0.5 m-0 font-normal"
                            >
                                Cancelled on: {formatDateAndTime(cancelledOn)}
                            </Tag>
                        )}
                    </Flex>
                )}

                {reason && (
                    <TypographyText className={`text-sm font-medium ${textColor}`}>
                        Reason: {reason}
                    </TypographyText>
                )}

                {description && (
                    <TypographyText className={`text-sm leading-5 ${textColor}`}>
                        {description}
                    </TypographyText>
                )}
            </Flex>
        </Flex>
    );
};

export default AlertCard;
