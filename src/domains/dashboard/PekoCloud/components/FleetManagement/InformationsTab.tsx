import React from 'react';

import { Col, Row } from 'antd';

import UserInformation from './UserInformation';
import VehicleInformation from './VehicleInformation';

type Props = {
    setRefState: (num: number) => void;
    isLoading: boolean;
    vehicleData: any;
    data: any;
};

const InformationsTab = ({ setRefState, isLoading, vehicleData, data }: Props) => (
    <Row className="h-full">
        <Col className="" xs={24} md={5}>
            <VehicleInformation
                vehicleData={vehicleData}
                isLoading={isLoading}
                setRefState={setRefState}
            />
        </Col>
        <Col xs={0} md={1} className="border-l -mt-4" />
        <Col xs={24} md={17}>
            <UserInformation isLoading={isLoading} setRefState={setRefState} data={data} />
        </Col>
    </Row>
);

export default InformationsTab;
