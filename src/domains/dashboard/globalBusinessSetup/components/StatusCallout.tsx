import React from 'react';

import {
    CheckCircleFilled,
    CloseCircleFilled,
    ExclamationCircleFilled,
    InfoCircleFilled,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';

const { Text } = Typography;

export type CalloutTone = 'info' | 'warning' | 'error' | 'success';

interface ToneStyle {
    icon: React.ReactNode;
    iconColor: string;
    chipBg: string;
    border: string;
    bg: string;
}

const TONES: Record<CalloutTone, ToneStyle> = {
    warning: {
        icon: <ExclamationCircleFilled />,
        iconColor: '#FAAD14',
        chipBg: '#FFF4E5',
        border: '#FFE7BA',
        bg: '#FFFBF2',
    },
    error: {
        icon: <CloseCircleFilled />,
        iconColor: '#FF4F4F',
        chipBg: '#FFF0F0',
        border: '#FFE0E0',
        bg: '#FFF7F7',
    },
    info: {
        icon: <InfoCircleFilled />,
        iconColor: '#2F6BFF',
        chipBg: '#EAF1FF',
        border: '#D6E4FF',
        bg: '#F5F9FF',
    },
    success: {
        icon: <CheckCircleFilled />,
        iconColor: '#26A411',
        chipBg: '#EAF7E7',
        border: '#C8E6C0',
        bg: '#F6FCF4',
    },
};

interface StatusCalloutProps {
    tone: CalloutTone;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

// Peko-styled callout card — the on-brand replacement for a raw Ant `Alert`.
// Purely presentational: callers keep their own state/handlers and pass the
// action button in.
const StatusCallout: React.FC<StatusCalloutProps> = ({
    tone,
    title,
    description,
    action,
    icon,
    className,
}) => {
    const t = TONES[tone];

    return (
        <div
            className={`rounded-2xl ${className ?? ''}`}
            style={{
                border: `1px solid ${t.border}`,
                background: t.bg,
                boxShadow: '0px 1.5px 16.5px 0px rgba(0, 0, 0, 0.06)',
                padding: '16px 20px',
            }}
        >
            <Flex
                align="flex-start"
                justify="space-between"
                gap={16}
                className="flex-col sm:flex-row"
            >
                <Flex align="flex-start" gap={12} style={{ minWidth: 0 }}>
                    <span
                        style={{
                            flexShrink: 0,
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: t.chipBg,
                            color: t.iconColor,
                            fontSize: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon ?? t.icon}
                    </span>
                    <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Text className="text-base font-semibold text-neutral-900">{title}</Text>
                        {description && (
                            <div className="text-sm text-neutral-600 leading-snug">
                                {description}
                            </div>
                        )}
                    </Flex>
                </Flex>

                {action && (
                    <div className="w-full sm:w-auto shrink-0 [&>button]:w-full sm:[&>button]:w-auto">
                        {action}
                    </div>
                )}
            </Flex>
        </div>
    );
};

export default StatusCallout;
