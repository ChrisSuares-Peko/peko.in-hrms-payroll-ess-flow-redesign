import React from 'react';

import { GlobalOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import RequiredDocumentsButton from './RequiredDocumentsButton';
import SelectableCard from './SelectableCard';
import { CompanyTypeAttribute } from '../../types/globalBusinessSetup';

interface FreezoneCardProps {
    label: string;
    selected: boolean;
    onSelect: () => void;
    icon?: string;
    description?: string;
    attributes?: CompanyTypeAttribute[];
    requiredDocsFile?: string;
    requiredDocsText?: string;
}

const FreezoneCard: React.FC<FreezoneCardProps> = ({
    label,
    selected,
    onSelect,
    icon,
    description,
    attributes,
    requiredDocsFile,
    requiredDocsText,
}) => {
    const attrRows = Array.isArray(attributes) ? attributes.filter(a => a.label?.trim()) : [];

    return (
        <SelectableCard selected={selected} onClick={onSelect}>
            <Flex vertical gap={12} style={{ width: '100%' }}>
                <Flex align="center" gap={12}>
                    <Flex
                        justify="center"
                        align="center"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: icon ? 'transparent' : '#FFF0F0',
                            flexShrink: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {icon ? (
                            <img
                                src={icon}
                                alt={label}
                                style={{ width: 48, height: 48, objectFit: 'contain' }}
                            />
                        ) : (
                            <GlobalOutlined style={{ fontSize: 20, color: '#FF4F4F' }} />
                        )}
                    </Flex>
                    <Flex vertical gap={2} style={{ minWidth: 0, flex: 1 }}>
                        <Typography.Text className="text-base text-neutral-900">
                            {label}
                        </Typography.Text>
                        {description && (
                            <Typography.Text
                                className="text-xs text-neutral-500"
                                style={{ lineHeight: 1.4 }}
                            >
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

                {attrRows.length > 0 && (
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 m-0 pl-[60px]">
                        {attrRows.map((attr, idx) => (
                            <div key={attr._id || `${attr.label}-${idx}`}>
                                <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                                    {attr.label}
                                </dt>
                                <dd className="m-0 text-xs text-neutral-700">
                                    {attr.value || '—'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </Flex>
        </SelectableCard>
    );
};

export default FreezoneCard;
