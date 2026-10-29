import React, { useState } from 'react';

import { Flex, Input, List, Typography } from 'antd';

import { country } from '../../types/types';


interface SelectProps {
    options: country[] | undefined;
    onSelect: (value: string) => void;
    searchKey: string;
    setSearchKey: (value: string) => void;
    defaultvalue?: string;
    textSize: string;
    placeholder: string;
}

const SelectCountry = ({
    options,
    onSelect,
    searchKey,
    setSearchKey,
    defaultvalue,
    textSize,
    placeholder,
}: SelectProps) => {
    const [filteredOptions, setFilteredOptions] = useState<country[] | undefined>(options);
    const [selectedLabel, setSelectedLabel] = useState('India');
    const [selectedCode, setSelectedCode] = useState<any>(''); // Track the selected

    const handleInputChange = (searchText: string) => {
        setSearchKey(searchText);
        setSelectedLabel(searchText);

        if (searchText === '') {
            setFilteredOptions(options);
            onSelect(''); // Reset the selected value when input is cleared
            setSelectedCode('');
        } else {
            const filtered = options?.filter(option =>
                option.Name.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredOptions(filtered);
        }
    };

    const handleSelectOption = (option: country) => {
        setSelectedCode(option.Name);
        setSearchKey(option.Code);
        setFilteredOptions([]);
        onSelect(option.Code);
        setSelectedLabel(option.Name);
    };

    return (
        <Flex
            className="p-0 m-0"
            onBlur={() => setTimeout(() => setFilteredOptions([]), 200)}
        >
            <Input
                type="text"
                placeholder={placeholder}
                value={selectedLabel}
                maxLength={20}
                onChange={e => handleInputChange(e.target.value)}
                variant="borderless"
                onClick={() => {
                    if (selectedCode) {
                        // Show only the selected country when clicking on the field
                        const filtered = options?.filter(option => option.Name === selectedCode);
                        setFilteredOptions(filtered?.length ? filtered : options);
                    } else {
                        setFilteredOptions(options);
                    }
                }}
                className={`w-full font-medium text-black h-10 md:ml-1 ${textSize}`}
            />

            {/* Dropdown List */}
            {filteredOptions && filteredOptions.length > 0 && (
                <List
                     className="absolute z-50 left-0 w-72 max-h-[400px] bg-white rounded-2xl top-full mt-2 overflow-y-auto shadow-2xl [&::-webkit-scrollbar]:hidden [&_.ant-list-header]:border-b-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    bordered={false}
                    split
                    header={
                        <div className="px-5 ">
                            <Typography.Title level={5} className="m-0 !text-lg !font-bold">
                                Popular Destinations
                            </Typography.Title>
                        </div>
                    }
                    dataSource={filteredOptions}
                    renderItem={(item, i) => {
                        const updatedSelectedCity = selectedCode;
                        const selectedCityName = item.Name;
                        

                        const isSelected = updatedSelectedCity === selectedCityName;
                        return (
                            <List.Item
                                key={i}
                                style={{ padding: 8 }}
                                className={`p-0 m-1 cursor-pointer ${isSelected ? 'bg-brandSurface' : 'hover:bg-[#fafafa]'}`}
                                onMouseDown={() => handleSelectOption(item)}
                            >
                                <Flex className="w-full" justify="space-between" align="center">
                                    <Flex className="w-4/5" vertical>
                                        <Typography.Text className="text-sm font-medium">
                                            {item.Name}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                                
                            </List.Item>
                        );
                    }}
                />
            )}
        </Flex>
    );
};

export default SelectCountry;
