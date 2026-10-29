import React from 'react';

import { Row, Col, Input, Select, Typography, Flex } from 'antd';

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
    isSubmmited: boolean;
}

const DeliveryList = ({ data, isInital, isSubmmited }: props) => {
    const { shipmentDetails, shipmentType, searchDetails } = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3
    );
    const originPlaceId = shipmentDetails.originCity?.city || searchDetails.originCity.searchtext || shipmentDetails.originPostCode;
    const destinationPlaceId = shipmentType === 'international'
        ? shipmentDetails.destinationCity?.countryName || shipmentDetails.destinationCity?.countryCode
        : shipmentDetails.destinationCity?.city || searchDetails.destinationCity.searchtext || shipmentDetails.destinationPostCode;
    const { sortBy, handleSearchChange, setSortBy, filteredData } = useFilteredDeliveryCompanies({
        data,
    });
    const { xs } = useScreenSize();
    return !isInital ? (
        <div className="xl:px-20 xxl:px-32  py-6">
            {filteredData && (originPlaceId || destinationPlaceId) && (
                <Row justify="space-between" align="middle" gutter={[16, 16]} className="mb-6">
                    <Col xs={24} md={12}>
                        <Text strong className="text-base">
                            <>
                                {originPlaceId || 'Origin'} to {destinationPlaceId || 'Destination'}{' '}
                                – {filteredData?.length || 0}{' '}
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

            {!filteredData ||
                (filteredData?.length === 0 && (
                    <NoCourier
                        message="This company does not service the selected route. Please choose another delivery
            provider."
                    />
                ))}
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
    ) : (
        <>{isSubmmited && data?.length === 0 && <NoCourier />}</>
    );
};

export default DeliveryList;
