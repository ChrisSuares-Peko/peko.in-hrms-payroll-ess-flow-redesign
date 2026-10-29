import type { KeyboardEvent } from 'react';

import { GlobalOutlined } from '@ant-design/icons';
import { Radio, Typography, Row, Col, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';

import { TravelType } from '../../types/eSIM';

const { Text } = Typography;

type TravelOption = {
    value: TravelType;
    title: string;
    description: string;
    badge?: string;
};

const TRAVEL_OPTIONS: TravelOption[] = [
    {
        value: 'single',
        title: 'International Travel',
        description: 'Traveling to a single country',
    },
    {
        value: 'regional',
        title: 'Regional eSIM',
        description: 'Traveling across a whole region',
        badge: 'NEW',
    },
    {
        value: 'multi',
        title: 'Multi-Country Trip',
        description: 'Traveling to multiple countries',
    },
];

const TRAVEL_TYPES: TravelType[] = TRAVEL_OPTIONS.map(option => option.value);

type TravelTypeSelectorProps = {
    value: TravelType;
    onChange: (value: TravelType) => void;
};

export const TravelTypeSelector = ({ value, onChange }: TravelTypeSelectorProps) => {
    const handleRadioChange = (e: RadioChangeEvent) => {
        const nextValue = e.target.value;
        if (TRAVEL_TYPES.includes(nextValue)) {
            onChange(nextValue);
        }
    };

    const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, selectedValue: TravelType) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onChange(selectedValue);
        }
    };

    return (
        <div className="esim-travel-type-section">
            <Space align="center" className="mb-4">
                <GlobalOutlined className="text-red-500" style={{ fontSize: 16 }} />
                <Text strong className="text-[17px]">Travel Type</Text>
            </Space>

            <Radio.Group value={value} onChange={handleRadioChange} className="w-full">
                <Row gutter={[16, 16]}>
                    {TRAVEL_OPTIONS.map(option => (
                        <Col span={24} sm={12} md={8} key={option.value}>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => onChange(option.value)}
                                onKeyDown={event => handleCardKeyDown(event, option.value)}
                                className={`esim-travel-card ${
                                    value === option.value ? 'esim-travel-card-active' : ''
                                }`}
                            >
                                {option.badge && (
                                    <span className="esim-travel-card-badge">{option.badge}</span>
                                )}
                                <Radio
                                    value={option.value}
                                    checked={value === option.value}
                                    className="mt-1"
                                />

                                <div>
                                    <Text className="block font-medium text-[16px]">
                                        {option.title}
                                    </Text>
                                    <Text className="block text-sm text-gray-500">
                                        {option.description}
                                    </Text>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Radio.Group>
        </div>
    );
};
