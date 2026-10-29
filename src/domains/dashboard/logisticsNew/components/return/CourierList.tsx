import React from 'react';

import { Row, Col, Input, Select, Typography, Flex, Spin } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { RootState } from '@store/store';

import DeliveryCard from './DeliveryCard';
import DeliveryCardSm from './DeliveryCardSm';
import NoCourier from './NoCourier';
import { useFilteredDeliveryCompanies } from '../../hooks/home/useFilteredDeliveryCompanies';
import { DeliveryCompanyOption } from '../../types';

const { Text } = Typography;
const { Option } = Select;

interface props {
    data: DeliveryCompanyOption[] | null;
    isInital: boolean;
    isLoading: boolean;
}

const DeliveryList = ({ data, isInital, isLoading }: props) => {
    const { xs } = useScreenSize();
    const shipmentDetails = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3.shipmentDetails
    );
    const originPlaceId = shipmentDetails.originPostCode;
    const destinationPlaceId = shipmentDetails.destinationPostCode;
    const { sortBy, handleSearchChange, setSortBy, filteredData } = useFilteredDeliveryCompanies({
        data,
    });

    if (isLoading) {
        return (
            <Flex align="center" justify="center" className="h-80 w-full">
                <Spin />
            </Flex>
        );
    }
    return (
        !isInital && (
            <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
                {filteredData && (
                    <Row justify="space-between" align="middle" gutter={[16, 16]} className="mb-6">
                        <Col xs={24} md={12}>
                            <Text strong className="text-base">
                                <>
                                    {originPlaceId || 'Origin'} to{' '}
                                    {destinationPlaceId || 'Destination'} –{' '}
                                    {filteredData?.length || 0}{' '}
                                    {filteredData?.length > 1 || filteredData?.length === 0
                                        ? 'Delivery Companies Found'
                                        : 'Delivery Company Found'}
                                </>
                            </Text>
                        </Col>

                        <Col xs={24} md={12}>
                            <Flex className="w-full flex-nowrap gap-2 md:justify-end">
                                <Input
                                    placeholder="Search"
                                    allowClear
                                    className="flex-1 sm:w-64 md:w-72"
                                    onChange={e => handleSearchChange(e.target.value)}
                                />
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    className="flex-1 sm:w-40 md:w-40"
                                >
                                    <Option value="cheapest">Price: Low to High</Option>
                                    <Option value="expensive">Price: High to Low</Option>
                                    <Option value="companyAZ">Company Name: A - Z</Option>
                                    <Option value="companyZA">Company Name: Z - A</Option>
                                </Select>
                            </Flex>
                        </Col>
                    </Row>
                )}

                {!filteredData || (filteredData?.length === 0 && <NoCourier />)}
                {filteredData &&
                    filteredData?.map(
                        (company: DeliveryCompanyOption, index: React.Key | null | undefined) =>
                            xs ? (
                                <DeliveryCardSm key={index} company={company} />
                            ) : (
                                <DeliveryCard key={index} company={company} />
                            )
                    )}
            </div>
        )
    );
};

export default DeliveryList;
