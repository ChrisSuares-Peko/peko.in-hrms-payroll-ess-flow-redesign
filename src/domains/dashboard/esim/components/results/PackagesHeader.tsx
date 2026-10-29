import React from 'react';

import { Col, Flex, Input, Row, Select, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

type Props = {
    setFilterType: (value: string) => void;
    setSearchText: (value: string) => void;
    location: string;
};

const PackagesHeader = ({ setFilterType, setSearchText, location }: Props) => {
    const state = useAppSelector(item => item.reducer.esim.searchData);

    const capitalizeFirstLetter = (text: string) =>
        text.charAt(0).toUpperCase() + text.slice(1).split('-').join(' ');

    return (
        <Row className="mt-12" justify="space-between">
            <Col xs={24} sm={12}>
                <Typography.Text className="font-medium text-textBlack">
                    {state.esimType === 'local' ? 'Results for Local eSIM in' : ''}
                    {state.esimType === 'regional' ? 'Results for eSIM in' : ''}
                    {state.esimType === 'global' ? 'Results for Global eSIM' : ''}
                    <Typography.Text className="font-medium text-textBlack capitalize ms-1">
                        {state.esimType === 'local' ? location : ''}
                        {state.esimType === 'regional' ? capitalizeFirstLetter(state.region) : ''}
                    </Typography.Text>
                </Typography.Text>
            </Col>

            {/* //? Remove hidden class if it is required later */}
            <Col xs={24} sm={12} className="xs:mt-4 sm:mt-0 hidden">
                <Flex gap={20} justify="space-between">
                    <Input.Search
                        onSearch={setSearchText}
                        placeholder="Search for data or package price.."
                    />
                    <Select
                        className="w-48"
                        defaultValue={[
                            {
                                value: '',
                                label: 'Popular',
                            },
                        ]}
                        options={[
                            {
                                value: '',
                                label: 'Popular',
                            },
                            {
                                value: 'price',
                                label: 'Price',
                            },
                            {
                                value: 'validity',
                                label: 'Validity',
                            },
                        ]}
                        onSelect={e => setFilterType(e.toString())}
                    />
                </Flex>
            </Col>
        </Row>
    );
};

export default PackagesHeader;
