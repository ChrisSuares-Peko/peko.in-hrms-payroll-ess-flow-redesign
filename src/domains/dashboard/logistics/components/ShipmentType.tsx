import React from 'react';

import { Flex, Radio } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { setShipmentDetails } from '../slice/logisticsSlice';

type Props = {
    name: string;
};

const ShipmentType: React.FC<Props> = ({ name }) => {
    const dispatch = useAppDispatch();
    const { serviceType } = useAppSelector(state => state.reducer.logistics.shipmentDetails);
    const handleNormalOrder = () => {
        dispatch(setShipmentDetails({ serviceType: 'NORMAL' }));
    };

    const handleSpeedOrder = () => {
        dispatch(setShipmentDetails({ serviceType: 'SPEED' }));
    };

    return (
        <Flex vertical align="center">
            <Radio.Group value={serviceType}>
                <Radio className="my-2 sm:my-0" value="NORMAL" onClick={handleNormalOrder}>
                    Normal Order
                </Radio>
                <Radio className="my-2 sm:my-0" value="SPEED" onClick={handleSpeedOrder}>
                    Speed Order
                </Radio>
            </Radio.Group>
        </Flex>
    );
};

export default React.memo(ShipmentType);
