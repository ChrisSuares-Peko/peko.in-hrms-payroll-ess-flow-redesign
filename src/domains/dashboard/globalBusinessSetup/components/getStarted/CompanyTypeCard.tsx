import React from 'react';

import { AimOutlined, GlobalOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import RequiredDocumentsButton from './RequiredDocumentsButton';
import SelectableCard from './SelectableCard';
import { CompanyTypeAttribute } from '../../types/globalBusinessSetup';

interface CompanyTypeCardProps {
    typeKey: string;
    label: string;
    description?: string;
    attributes?: CompanyTypeAttribute[];
    requiredDocsFile?: string;
    requiredDocsText?: string;
    compareMode?: boolean;
    selected: boolean;
    onSelect: () => void;
}

const HAIRLINE = '1px solid #F3F4F6';

const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#9CA3AF',
    letterSpacing: '0.05em',
    marginBottom: 4,
    lineHeight: 1.2,
};

const valueStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.45,
};

const clamp2: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const iconForType = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('freezone') || k.includes('free_zone')) {
        return <AimOutlined style={{ fontSize: 18, color: '#FF4F4F' }} />;
    }
    return <GlobalOutlined style={{ fontSize: 18, color: '#FF4F4F' }} />;
};

const IconBubble: React.FC<{ typeKey: string }> = ({ typeKey }) => (
    <Flex
        justify="center"
        align="center"
        style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#FFF0F0',
            flexShrink: 0,
        }}
    >
        {iconForType(typeKey)}
    </Flex>
);

const CompanyTypeCard: React.FC<CompanyTypeCardProps> = ({
    typeKey,
    label,
    description,
    attributes,
    requiredDocsFile,
    requiredDocsText,
    compareMode = false,
    selected,
    onSelect,
}) => {
    const compareRows =
        compareMode && Array.isArray(attributes) ? attributes.filter(a => a.label?.trim()) : [];

    if (compareRows.length === 0) {
        return (
            <SelectableCard selected={selected} onClick={onSelect} align="flex-start" padding={20}>
                <Flex vertical gap={12}>
                    <IconBubble typeKey={typeKey} />
                    <Flex vertical gap={4}>
                        <Typography.Text className="text-base font-semibold text-neutral-900">
                            {label}
                        </Typography.Text>
                        {description && (
                            <Typography.Text className="text-xs text-neutral-500 leading-snug">
                                {description}
                            </Typography.Text>
                        )}
                        <RequiredDocumentsButton
                            label={label}
                            text={requiredDocsText}
                            file={requiredDocsFile}
                        />
                    </Flex>
                </Flex>
            </SelectableCard>
        );
    }

    return (
        <SelectableCard selected={selected} onClick={onSelect} align="flex-start" padding={20}>
            <div style={{ width: '100%' }}>
                <div style={{ minHeight: 110, paddingBottom: 14, borderBottom: HAIRLINE }}>
                    <Flex vertical gap={12}>
                        <IconBubble typeKey={typeKey} />
                        <div>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: '#171717',
                                    marginBottom: 4,
                                    lineHeight: 1.3,
                                }}
                            >
                                {label}
                            </div>
                            {description && (
                                <div
                                    style={{
                                        ...clamp2,
                                        fontSize: 12,
                                        color: '#6B7280',
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {description}
                                </div>
                            )}
                            <div style={{ marginTop: 6 }}>
                                <RequiredDocumentsButton
                                    label={label}
                                    text={requiredDocsText}
                                    file={requiredDocsFile}
                                />
                            </div>
                        </div>
                    </Flex>
                </div>

                {compareRows.map((attr, idx) => (
                    <div
                        key={attr._id || `${attr.label}-${idx}`}
                        style={{
                            padding: '14px 0',
                            borderBottom: idx < compareRows.length - 1 ? HAIRLINE : 'none',
                        }}
                    >
                        <div style={labelStyle}>{attr.label}</div>
                        <div style={valueStyle}>{attr.value}</div>
                    </div>
                ))}
            </div>
        </SelectableCard>
    );
};

export default CompanyTypeCard;
