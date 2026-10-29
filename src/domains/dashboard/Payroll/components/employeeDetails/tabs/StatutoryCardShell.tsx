import React, { useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Switch, Tooltip, Typography } from 'antd';

import StatutoryInfoModal, { StatutoryInfoContent } from './StatutoryInfoModal';

const { Text } = Typography;

const TEXT_DARK = '#181D27';
const TEXT_MUTED = '#535862';
const BORDER = '#E2E8F0';
const ACCENT = '#FF4F4F';
const GREEN = '#27AE60';
const RED = '#FF4D4F';

export interface StatutoryFieldItem {
    label: string;
    value: React.ReactNode;
}

export interface StatutoryCardShellProps {
    title: string;
    statusText?: string;
    statusPositive?: boolean;
    actionLabel?: string;
    onAction?: () => void;
    showToggle?: boolean;
    toggleChecked?: boolean;
    toggleLoading?: boolean;
    onToggle?: (checked: boolean) => void;
    fields: StatutoryFieldItem[];
    // Hover shows infoContent.title as a plain tooltip; click opens the full "What is X?"
    // explainer modal. Icon renders as plain decoration (no pointer, no tooltip, no modal)
    // for a card that hasn't gotten its copy yet.
    infoContent?: StatutoryInfoContent;
}

const StatutoryCardShell = ({
    title,
    statusText,
    statusPositive,
    actionLabel,
    onAction,
    showToggle,
    toggleChecked,
    toggleLoading,
    onToggle,
    fields,
    infoContent,
}: StatutoryCardShellProps) => {
    const statusColor = statusPositive ? GREEN : RED;
    const [infoOpen, setInfoOpen] = useState(false);

    const infoIcon = (
        <InfoCircleOutlined
            style={{ fontSize: 13, color: infoContent ? undefined : TEXT_MUTED }}
            className={infoContent ? 'cursor-pointer text-[#535862] hover:!text-[#FF4F4F]' : 'cursor-default'}
            onClick={infoContent ? () => setInfoOpen(true) : undefined}
        />
    );

    return (
        <Flex vertical className="bg-white h-full" style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px' }}>
            <Flex justify="space-between" align="center" wrap gap={8}>
                <Flex align="center" gap={8}>
                    <Text style={{ fontWeight: 600, fontSize: 16, color: TEXT_DARK }}>{title}</Text>
                    {infoContent ? <Tooltip title={infoContent.title}>{infoIcon}</Tooltip> : infoIcon}
                    {statusText && (
                        <Flex align="center" gap={6} className="ml-1">
                            <span
                                aria-hidden
                                style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }}
                            />
                            <Text style={{ fontSize: 13, color: statusColor }}>{statusText}</Text>
                        </Flex>
                    )}
                </Flex>
                <Flex align="center" gap={14}>
                    {actionLabel && onAction && (
                        <Button
                            type="link"
                            onClick={onAction}
                            className="px-0 h-auto"
                            style={{ color: ACCENT, fontSize: 13 }}
                        >
                            {actionLabel}
                        </Button>
                    )}
                    {showToggle && <Switch checked={toggleChecked} loading={toggleLoading} onChange={onToggle} />}
                </Flex>
            </Flex>

            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                {fields.map(field => (
                    <Col span={12} key={field.label}>
                        <Text style={{ display: 'block', fontWeight: 600, fontSize: 13, color: TEXT_DARK }}>
                            {field.label}
                        </Text>
                        <Text style={{ fontSize: 13, color: TEXT_MUTED }}>{field.value}</Text>
                    </Col>
                ))}
            </Row>

            {infoContent && (
                <StatutoryInfoModal
                    open={infoOpen}
                    onClose={() => setInfoOpen(false)}
                    title={infoContent.title}
                    sections={infoContent.sections}
                />
            )}
        </Flex>
    );
};

export default StatutoryCardShell;
