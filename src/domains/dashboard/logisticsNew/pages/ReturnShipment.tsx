import React from 'react';

import { Content } from 'antd/es/layout/layout';

import CalculateCost from '../components/return/CalculateCost';
import DeliveryList from '../components/return/CourierList';
import { useCalculateRateApi } from '../hooks/home/useCalculateRateApi';

const ReturnShipment = () => {
    const { handleCalculateRate, isLoading, data, isInital } = useCalculateRateApi();

    return (
        <Content className="px-0 mb-8 ">
            <CalculateCost handleCalculateRate={handleCalculateRate} />
            <DeliveryList data={data} isInital={isInital} isLoading={isLoading} />
        </Content>
    );
};

export default ReturnShipment;
