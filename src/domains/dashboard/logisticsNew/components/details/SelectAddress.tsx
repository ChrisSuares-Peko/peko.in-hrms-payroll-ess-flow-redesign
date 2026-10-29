import React, { useEffect, useState } from 'react';

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
    selectedIndex: number | null;
    setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
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
    selectedIndex,
    setSelectedIndex,
}) => {
    const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
    const [selectedValue, setSelectedValue] = useState(defaultvalue);
    const handleInputChange = (searchText: string) => {
        setSearchKey(searchText);
        const filtered = options.filter(
            option =>
                option.label.toLowerCase().includes(searchText.toLowerCase()) ||
                JSON.parse(option.value).address.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredOptions(filtered);
        setSelectedValue(searchText);

        if (searchText === '') {
            onSelect('');
            setSelectedValue('');
        }
    };
    useEffect(() => {
        if (defaultvalue && options?.length) {
            const valueFound = options.find((item, index) => {
                const parsedValue = JSON.parse(item.value);
                return parsedValue.id === Number(defaultvalue);
            });

            if (valueFound) {
                handleSelectOption(valueFound.value, options.indexOf(valueFound));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultvalue, options]);

    const handleSelectOption = (optionValue: string, index: number) => {
        const parsedOption = JSON.parse(optionValue);
        setSearchKey(parsedOption.address);
        setFilteredOptions([]);
        onSelect(optionValue);
        setSelectedValue(`${parsedOption.name}`);
        setSelectedIndex(index);
    };

    const handleClear = () => {
        setSearchKey('');
        setFilteredOptions([]);
        setSelectedValue('');
        setSelectedIndex(null);
        if (onClear) {
            onClear();
        }
    };
    // useEffect(() => {
    //     setSelectedValue(defaultvalue);
    // }, [defaultvalue]);
    return (
        <Flex
            className="relative p-0 m-0"
            onBlur={() => setTimeout(() => setFilteredOptions([]), 200)}
        >
            <Input
                type="text"
                placeholder="Select Address"
                value={selectedValue}
                maxLength={50}
                onChange={e => {
                    let filteredValue = e.target.value;
                    filteredValue = filteredValue.replace(removeEmoji, '');
                    handleInputChange(filteredValue);
                }}
                onClick={() => setFilteredOptions(options)}
                className={`w-full text-black h-9 ${textSize}`}
                disabled={disabled}
                suffix={
                    selectedValue ? (
                        <CloseOutlined
                            onClick={handleClear}
                            className="text-gray-400 cursor-pointer"
                            style={{ fontSize: '10px', marginRight: '8px' }}
                        />
                    ) : (
                        <DownOutlined className="text-gray-400" style={{ fontSize: '10px' }} />
                    )
                }
            />

            {filteredOptions && filteredOptions.length > 0 && (
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
                                className={` ml-[.2rem] cursor-pointer ${isSelected ? 'bg-[#fff2f0]' : 'hover:bg-[#fafafa]'}`}
                                onMouseDown={() => handleSelectOption(item.value, i)}
                            >
                                <Flex className="w-full">
                                    <Flex className="w-4/5" vertical>
                                        <Typography.Text className="text-sm font-medium">
                                            {item?.label}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal mt-1">
                                            {parsedValue?.address1}
                                        </Typography.Text>
                                        {parsedValue?.address2 && (
                                            <Typography.Text className="text-xs font-normal mt-1">
                                                {parsedValue?.address2}
                                            </Typography.Text>
                                        )}
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
