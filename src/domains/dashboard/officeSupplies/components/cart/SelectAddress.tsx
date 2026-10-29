import React, { useState } from 'react';

import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import { Flex, Input, List, Typography } from 'antd';

import { removeEmoji } from '@utils/regex';

interface SelectAddressProps {
    options: any[];
    onSelect: (value: string) => void;
    searchKey: string;
    setSearchKey: (value: string) => void;
    defaultvalue: string;
    textSize: string;
    disabled?: boolean;
    onClear?: () => void;
}

const SelectAddress: React.FC<SelectAddressProps> = ({
    options,
    onSelect,
    searchKey,
    setSearchKey,
    defaultvalue,
    textSize,
    disabled = false,
    onClear,
}) => {
    const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
    const [selectedValue, setSelectedValue] = useState(defaultvalue);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // Track the selected index

    const handleInputChange = (searchText: string) => {
        setSearchKey(searchText);

        const filtered = options.filter(
            option =>
                option.label.toLowerCase().includes(searchText.toLowerCase()) ||
                JSON.parse(option.value).address.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredOptions(filtered);
        setSelectedValue(searchText);

        if (searchKey === '') {
            onSelect('');
            setSelectedValue('');
        }
    };

    const handleClear = () => {
        setSearchKey(''); // Clear the search key directly
        setSelectedValue(''); // Clear the selected value directly
        setFilteredOptions([]); // Clear the options to avoid any display

        if (onClear) {
            onClear();
        }
    };

    const handleSelectOption = (optionValue: string, index: number) => {
        const parsedOption = JSON.parse(optionValue);
        setSearchKey(parsedOption.address);
        setFilteredOptions([]);
        onSelect(optionValue);
        setSelectedValue(`${parsedOption.firstName} ${parsedOption.lastName}`);
        setSelectedIndex(index);
    };

    return (
        <Flex
            className="relative p-0 m-0"
            onBlur={() => setTimeout(() => setFilteredOptions([]), 200)}
        >
            <Input
                type="text"
                placeholder="Select an address"
                value={selectedValue}
                maxLength={50}
                onChange={e => {
                    let filteredValue = e.target.value;
                    filteredValue = filteredValue.replace(removeEmoji, '');
                    handleInputChange(filteredValue);
                }}
                onClick={() => {
                    setFilteredOptions(options); // Show all options if no searchKey
                }}
                className={`w-full text-black h-9 ${textSize}`}
                disabled={disabled}
                suffix={
                    <>
                        {selectedIndex !== null ? (
                            <CloseOutlined
                                onClick={handleClear}
                                className="text-gray-400 cursor-pointer"
                                style={{ fontSize: '10px', marginRight: '8px' }}
                            />
                        ) : (
                            <DownOutlined
                                className="text-gray-400 ml-3"
                                style={{ fontSize: '10px' }}
                            />
                        )}
                    </>
                }
            />

            {filteredOptions.length > 0 && (
                <List
                    className="absolute z-10 w-full max-h-64 mt-12 bg-white border border-gray-300 rounded overflow-scroll"
                    bordered
                    dataSource={filteredOptions}
                    renderItem={(item, i) => {
                        const parsedValue = JSON.parse(item.value);
                        const isSelected = selectedIndex === i;
                        return (
                            <List.Item
                                key={i}
                                style={{ padding: 8, borderBottom: 'none' }}
                                className={` ml-[.2rem] cursor-pointer ${isSelected ? 'bg-[#fff2f0]' : 'hover:bg-[#fafafa]'} `}
                                onMouseDown={() => handleSelectOption(item.value, i)}
                            >
                                <Flex className="w-full">
                                    <Flex className="w-4/5" vertical>
                                        <Typography.Text className="text-sm font-medium">
                                            {item?.label}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal mt-1">
                                            {parsedValue?.address}
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

export default SelectAddress;
