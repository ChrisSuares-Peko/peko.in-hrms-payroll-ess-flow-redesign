import { useMemo, type FC } from 'react';

import { EnvironmentOutlined } from '@ant-design/icons';
import { Flex, Select, Typography } from 'antd';

import { CityOption, useCitySearch } from '../../hooks/useCitySearch';
import { SelectedCity } from '../../utils/indianCityStdCodes';

interface CitySelectorProps {
    selectedCity: SelectedCity | null;
    onChange: (city: SelectedCity | null) => void;
    /** True while we are resolving the default city from the user's profile. */
    isLoading?: boolean;
}

/**
 * City picker for ONDC office-supply products. Type-to-search backed by Google
 * Places (the logistics city endpoint), filtered to cities we can map to an
 * ONDC code. Emits { name, code: "std:0xx" }.
 */
const CitySelector: FC<CitySelectorProps> = ({ selectedCity, onChange, isLoading = false }) => {
    const { options, isSearching, search } = useCitySearch();

    const handleChange = (code?: string, option?: CityOption | CityOption[]) => {
        if (!code) {
            onChange(null);
            return;
        }
        const opt = Array.isArray(option) ? option[0] : option;
        onChange({ name: opt?.label || code, code });
    };

    // Keep the current selection visible even though it isn't in the latest
    // search results (Select matches the displayed label to the value).
    const mergedOptions = useMemo<CityOption[]>(() => {
        if (selectedCity && !options.some(o => o.value === selectedCity.code)) {
            return [{ label: selectedCity.name, value: selectedCity.code }, ...options];
        }
        return options;
    }, [options, selectedCity]);

    return (
        <Flex align="center" gap={8}>
            <EnvironmentOutlined className="text-bgOrange" />
            <Typography.Text className="text-gray-500">City</Typography.Text>
            <Select
                showSearch
                allowClear
                filterOption={false}
                loading={isSearching || isLoading}
                placeholder={isLoading ? 'Loading…' : 'Search your city'}
                value={selectedCity?.code}
                options={mergedOptions}
                onSearch={search}
                onChange={handleChange}
                notFoundContent={isSearching ? 'Searching…' : 'Type to search a city'}
                style={{ minWidth: 220 }}
            />
        </Flex>
    );
};

export default CitySelector;
