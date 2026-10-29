import React, { useState, useCallback, useEffect } from 'react';

import { Divider, Flex, Input, List, Typography } from 'antd';
import debounce from 'lodash/debounce';

import { ITripData } from '../../types/airlineTypes';
import { ISearchData } from '../../types/searchAirports';
import '../../assets/style.css';

type Props = {
    options: ISearchData[] | undefined;
    onSelect: (loc: string, val: string) => void;
    searchKey: string | undefined;
    setSearchKey: (key: string) => void;
    tripData: ITripData;
    location: 'fromLocation1' | 'fromLocation' | 'toLocation1' | 'toLocation';
    disabled?: boolean;
    updateTripDetails?: (value: string) => void;
    defaultOptions?: ISearchData[];
};

const Autocomplete = ({
    options,
    onSelect,
    searchKey,
    setSearchKey,
    location,
    tripData,
    disabled = false,
    updateTripDetails,
    defaultOptions,
}: Props) => {
    const field = tripData[location];
    const [inputValue, setInputValue] = useState(searchKey || '');
    const [filteredOptions, setFilteredOptions] = useState<ISearchData[] | undefined>([]);
    const [selectedCode, setSelectedCode] = useState(field);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setSelectedCode(field);
    }, [field]);

    // Debounced search handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleSearch = useCallback(
        debounce((searchText: string) => {
            setSearchKey(searchText);
            if (searchText === '') {
                onSelect(location, '');
                setSelectedCode('');
            }
        }, 300),
        [location, onSelect, setSearchKey]
    );

    // Immediate input change handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setInputValue(value);
        handleSearch(value);
    };

    // Handle option selection
    const handleSelectOption = useCallback(
        (option: ISearchData) => {
            setSelectedCode(option.value);
            setInputValue(option.value);
            setSearchKey(option.value);
            onSelect(location, option.value);
            updateTripDetails?.(option.countryCode);
            setIsFocused(false);
        },
        [location, onSelect, setSearchKey, updateTripDetails]
    );

    // Sync with external state
    useEffect(() => {
        const value = tripData[location as keyof ITripData];
        setInputValue(value !== undefined && value !== null ? String(value) : '');
    }, [location, tripData]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setTimeout(() => setIsFocused(false), 200);
    };

    const updateFilteredOptions = () => {
        if (!options) return;
        const withLabels = options.filter(option => option.label);
        const selectOption = withLabels.filter(option => option.value === selectedCode);
        const withoutSelected = withLabels.filter(option => option.value !== selectedCode);
        setFilteredOptions([...selectOption, ...withoutSelected]);
    };

    useEffect(() => {
        updateFilteredOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options]);

    return (
        <Flex className="p-0 m-0" onFocus={handleFocus} onBlur={handleBlur}>
            <Input
                value={inputValue}
                onChange={handleChange}
                onClick={updateFilteredOptions}
                placeholder="Enter location"
                variant="borderless"
                className={`w-full font-semibold h-8 ${inputValue ? 'text-xl' : ''}`}
                disabled={disabled}
            />
            {isFocused && (() => {
                    const isSearching = inputValue !== selectedCode && inputValue !== '';
                    const displayOptions = isSearching
                        ? filteredOptions
                        : (defaultOptions ?? filteredOptions);
                    const listHeader = isSearching ? 'Search Results' : 'Popular Airports';
                    if (!displayOptions || displayOptions.length === 0) return null;
                    return (
                <List
                    className="absolute z-50 left-0 ms-0 w-96 max-h-[400px] bg-white rounded-2xl top-full mt-2 overflow-y-auto shadow-2xl custom-list [&::-webkit-scrollbar]:hidden"
                    style={{ padding: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    bordered={false}
                    split={false}
                    header={
                        <div className="px-5">
                            <Typography.Title level={5} className="m-0 !text-lg !font-bold">
                                {listHeader}
                            </Typography.Title>
                        </div>
                    }
                    dataSource={displayOptions}
                    renderItem={(item, i) => {
                        const isLast = i === (displayOptions?.length ?? 0) - 1;
                        return (
                            <List.Item
                                key={i}
                                style={{ padding: '0px', display: 'block' }}
                                className={`cursor-pointer transition-colors ${selectedCode === item.value ? 'bg-[#FFF1F0]' : 'hover:bg-gray-50'}`}
                                onMouseDown={() => handleSelectOption(item)}
                            >
                                <Flex vertical style={{ padding: '12px 16px' }}>
                                    <Flex className="w-full" align="center" gap={16}>
                                        <Flex
                                            justify="center"
                                            align="center"
                                            className="flex-none w-12 h-12 bg-gray-100 rounded-lg"
                                        >
                                            <Typography.Text className="font-bold text-gray-700 text-base">
                                                {item.value}
                                            </Typography.Text>
                                        </Flex>
                                        <Flex vertical className="flex-1 overflow-hidden">
                                            <Typography.Text className="text-base font-bold text-gray-900 truncate">
                                                {item.location}
                                            </Typography.Text>
                                            <Typography.Text className="text-xs text-gray-500 truncate">
                                                {item.label}
                                            </Typography.Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                                {!isLast && (
                                    <Flex style={{ padding: '0 16px' }}>
                                        <Divider style={{ margin: 0 }} />
                                    </Flex>
                                )}
                            </List.Item>
                        );
                    }}
                />
                    );
                })()}
        </Flex>
    );
};

export default Autocomplete;
