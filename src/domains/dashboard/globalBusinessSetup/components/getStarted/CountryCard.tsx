import React from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import SelectableCard from './SelectableCard';
import { Country } from '../../types/globalBusinessSetup';

interface CountryCardProps {
    country: Country;
    selected: boolean;
    onSelect: () => void;
}

const CountryCard: React.FC<CountryCardProps> = ({ country, selected, onSelect }) => {
    const typeCount = (country.company_types ?? []).filter(c => c.is_active === true).length;

    return (
        <SelectableCard
            selected={selected}
            onClick={onSelect}
            trailing={<RightOutlined style={{ fontSize: 14, color: '#9CA3AF' }} />}
        >
            <Flex align="center" gap={16}>
                <div
                    style={{
                        width: 44,
                        height: 30,
                        borderRadius: 4,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#F3F4F6',
                    }}
                >
                    {country.logo ? (
                        <img
                            src={country.logo}
                            alt={country.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : null}
                </div>
                <Flex vertical>
                    <Typography.Text className="text-base font-semibold text-neutral-900">
                        {country.name}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-neutral-500">
                        {country.country_code} · {typeCount} type{typeCount === 1 ? '' : 's'}{' '}
                        available
                    </Typography.Text>
                </Flex>
            </Flex>
        </SelectableCard>
    );
};

export default CountryCard;
