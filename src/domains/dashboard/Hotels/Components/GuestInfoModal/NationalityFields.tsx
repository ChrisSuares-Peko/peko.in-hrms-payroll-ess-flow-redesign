import React from 'react';

import { Flex, Form, Select, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';

import useSearchCountryApi from '../../hooks/useSearchCountryApi';
import { setTravelerNationality } from '../../slices/getHotelSlice';

const NationalityFields = () => {
    const { hotelsRequest } = useAppSelector(state => state.reducer.hotels);
    const dispatch = useDispatch();
    const {  countryOptions } = useSearchCountryApi();

    // Helper function to format the string
    const formatOption = (label: string) => {
        if (!label) return '';
        return label
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Map countryOptions to format labels
    const formattedOptions = countryOptions.map(option => ({
        ...option,
        label: formatOption(option.label),
    }));
    return (
        <Flex vertical className="w-full md:w-[18rem]">
            <Typography.Text className="text-medium">Traveller Nationality</Typography.Text>
            <Form.Item>
                <Select
                    showSearch
                    placeholder="Select Issued Country"
                    options={formattedOptions}
                    defaultValue={hotelsRequest.GuestNationality}
                    onChange={val => {
                        dispatch(setTravelerNationality(val));
                    }}
                    filterOption={(input: string, option) =>
                        ((option && option.label.toLowerCase()) ?? '').includes(input.toLowerCase())
                    }
                />
            </Form.Item>
            {/* <Typography.Text className="text-medium">
                Traveller Country of Residence
            </Typography.Text>
            <Form.Item>
                <Select
                    showSearch
                    placeholder="Select Issued Country"
                    options={formattedOptions}
                    defaultValue={hotelsRequest.travelerCountryOfResidence}
                    onChange={val => {
                        dispatch(setcountryOfResidence(val));
                    }}
                    filterOption={(input: string, option) =>
                        ((option && option.label.toLowerCase()) ?? '').includes(input.toLowerCase())
                    }
                />
            </Form.Item> */}
        </Flex>
    );
};

export default NationalityFields;
