import React, { useEffect, useState } from 'react';

import { Flex, Input, List, Modal, Typography } from 'antd';
// ^ or import { Modal } from 'antd'; if you're already aliasing things

import { removeEmoji } from '@utils/regex';

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
};

const Autocomplete = ({
    options,
    onSelect,
    searchKey,
    setSearchKey,
    location,
    tripData,
    disabled = false,
}: Props) => {
    const field = tripData[location];
    const [filteredOptions, setFilteredOptions] = useState<ISearchData[] | undefined>([]);
    const [selectedValue, setSelectedValue] = useState(searchKey);
    const [selectedCode, setSelectedCode] = useState(searchKey); // Track the selected
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setSelectedCode(field);
    }, [field]);

    const handleInputChange = (searchText: string) => {
        setSearchKey(searchText);
        setFilteredOptions(options);
        setSelectedValue(searchText);
        if (searchText === '') {
            // @ts-ignore
            onSelect(location, '');
            setSelectedValue('');
            setSelectedCode('');
        }
    };

    useEffect(() => {
        if (isModalOpen) setFilteredOptions(options);
    }, [options, isModalOpen]);

    const handleSelectOption = (option: string) => {
        setSelectedCode(option);
        setSearchKey(option);
        setFilteredOptions([]);
        onSelect(location, option);
        // @ts-ignore
        setSelectedValue(tripData[location] !== '' ? tripData[location] : '');
        setIsModalOpen(false);
    };

    const updateFilteredOptions = () => {
        if (!options) return;
        const selectOption = options?.filter(option => option.value === selectedCode);
        if (selectOption) {
            const withoutSelected = options.filter(option => option.value !== selectedCode);
            setFilteredOptions([...selectOption, ...withoutSelected]);
        } else {
            setFilteredOptions(options);
        }
    };

    useEffect(() => {
        // @ts-ignore
        setSelectedValue(tripData[location] !== '' ? tripData[location] : '');
    }, [location, tripData]);

    // 4. Render
    return (
        <Flex className="relative p-0 m-0">
            <Input
                type="text"
                // @ts-ignore
                maxLength={20}
                value={selectedValue}
                onChange={e => {
                    let filteredValue = e.target.value;
                    filteredValue = filteredValue.replace(removeEmoji, '');
                    handleInputChange(filteredValue);
                }}
                placeholder="Enter location"
                variant="borderless"
                // Open modal on click if not disabled
                readOnly
                onClick={() => {
                    updateFilteredOptions();
                    setIsModalOpen(true);
                }}
                className={`w-full font-semibold h-8 ${selectedValue ? 'text-xl' : ''}`}
                disabled={disabled}
            />

            {/* The Modal */}
            <Modal
                title="Select a location"
                open={isModalOpen}
                footer={null}
                onCancel={() => setIsModalOpen(false)}
                // Optional: Tailwind classes for your modal
                className="custom-modal-class"
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                destroyOnClose
            >
                <Input
                    type="text"
                    // @ts-ignore
                    maxLength={20}
                    value={selectedValue}
                    onChange={e => {
                        let filteredValue = e.target.value;
                        filteredValue = filteredValue.replace(removeEmoji, '');
                        handleInputChange(filteredValue);
                    }}
                    placeholder="Enter location"
                    // variant="borderless"
                    onClick={() => setFilteredOptions(options)}
                    className={`rounded-xl w-full font-semibold h-8 ${selectedValue ? 'text-xl' : ''}`}
                    disabled={disabled}
                />
                {filteredOptions && filteredOptions.length > 0 && (
                    <List
                        className=" max-h-64 bg-white border border-gray-300 rounded  overflow-scroll custom-list"
                        style={{ boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.09)' }}
                        bordered
                        dataSource={filteredOptions}
                        renderItem={(item, i) => {
                            const isSelected = selectedCode === item.value;
                            return (
                                <List.Item
                                    key={i}
                                    style={{
                                        padding: 8,
                                        borderBottom: 'none',
                                    }}
                                    className={`p-0 m-1 cursor-pointer ${isSelected ? 'bg-[#FFF1F0]' : 'hover:bg-[#fafafa]'}`}
                                    onClick={() => handleSelectOption(item.value)}
                                >
                                    <Flex className="w-full" justify="space-between" align="center">
                                        <Flex className="w-4/5" vertical>
                                            <Typography.Text className="text-sm font-medium">
                                                {item.location}
                                            </Typography.Text>
                                            <Typography.Text className="text-xs font-normal">
                                                {item.label}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="text-xs font-medium w-1/5 text-center">
                                            {item.value}
                                        </Typography.Text>
                                    </Flex>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Modal>
        </Flex>
    );
};

export default Autocomplete;
