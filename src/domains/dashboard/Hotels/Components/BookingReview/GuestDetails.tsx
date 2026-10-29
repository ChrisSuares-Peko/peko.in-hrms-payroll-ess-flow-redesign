/* eslint-disable no-plusplus */
import React from 'react';

import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Collapse, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import GuestCard from './GuestCard';
import '../../Assets/style.css';

const { Panel } = Collapse;
const GuestDetails = () => {
    const { userdetails, customerInfo } = useAppSelector(state => state.reducer.hotels);
    const customExpandIcon = (panelProps: { isActive?: boolean }) =>
        panelProps.isActive ? <DownOutlined /> : <RightOutlined />;
    let guestCounter = 0;
    return (
        <Collapse
            defaultActiveKey={['1']}
            expandIconPosition="end"
            style={{
                backgroundColor: '#F5F5F5',
                borderRadius: '28px',
                border: '1px solid #ececec',
                boxShadow: '0 4px 20px 8px rgba(0,0,0,0.02)',
            }}
            expandIcon={customExpandIcon}
            className="mt-5 guest-details-collapse"
        >
            <Panel
                header={
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        Guest Details
                    </Typography.Title>
                }
                key="1"
            >
                <Row gutter={[16, 16]}>
                    {userdetails.map((room: any) =>
                        room.passengers.map((passenger: any, index: number) => (
                            <GuestCard
                                key={guestCounter}
                                index={guestCounter++}
                                passenger={passenger}
                                customerInfo={customerInfo}
                            />
                        ))
                    )}
                </Row>
            </Panel>
        </Collapse>
    );
};

export default GuestDetails;
