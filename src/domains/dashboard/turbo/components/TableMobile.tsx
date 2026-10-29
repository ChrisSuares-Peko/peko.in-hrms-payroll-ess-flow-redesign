/* eslint-disable no-unsafe-optional-chaining */
import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Badge, Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formattedDateTime } from '@utils/dateFormat';

import DriverAssignedCell from './DriverAssignedCell';
import VehicleRefreshAction from './VehicleRefreshAction';

interface DetailProps {
    label: string;
    value: React.ReactNode;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full">
        <Typography.Text className="text-xs">{label} :</Typography.Text>
        <div className="text-xs">{value}</div>
    </Flex>
);

interface TableProp {
    transaction: any;
    drivers: any[];
    handleDriverChange: (driverId: string, vehicleId: string) => void;
    handleDriverUnassign?: (assignmentId: string | number) => void;
    refreshingId?: number | string | null;
    onRefreshVehicle?: (target: { id: number | string; lastRefreshedAt?: string | null }) => void;
}

const TableMobile: React.FC<TableProp> = ({ transaction, drivers, handleDriverChange, handleDriverUnassign, refreshingId = null, onRefreshVehicle }) => {
    const { vehicleNumber, rcStatus, fuelType, createdAt, pucValidUpto } = transaction;

    const [showMore, setShowMore] = useState<boolean>(false);

    const statusStyles = {
        ACTIVE: {
            text: '#16a34a',
            background: '#d1fae5',
        },
        INACTIVE: {
            text: '#B71215',
            background: '#FDECEC',
        },
    };

    function findColorByStatus(state: string) {
        let value = statusStyles.ACTIVE;
        if (state === 'ACTIVE' || state === 'INACTIVE') {
            value = statusStyles[state];
        }
        return value;
    }

    const details = [
        { label: 'Date', value: formattedDateTime(new Date(createdAt)) },
        { label: 'Fuel Type', value: fuelType ? fuelType.charAt(0).toUpperCase() + fuelType.slice(1).toLowerCase() : 'N/A', },
        {
            label: 'PUC',
            value: (() => {
                const todays = new Date();
                const expiryDate = new Date(pucValidUpto);
                const diffTime = expiryDate.getTime() - todays.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let statusText = '';
                let style = {
                    color: '#16a34a',
                    backgroundColor: '#d1fae5',
                    padding: '2px 7px',
                    borderRadius: '15px',
                };

                if (diffDays < 0) {
                    statusText = 'Expired';
                    style = {
                        color: '#B71215',
                        backgroundColor: '#FDECEC',
                        padding: '2px 7px',
                        borderRadius: '15px',
                    };
                } else if (diffDays <= 15) {
                    statusText = 'Expiring Soon';
                    style = {
                        color: '#B78512',
                        backgroundColor: '#FDFDEC',
                        padding: '2px 7px',
                        borderRadius: '15px',
                    };
                } else {
                    statusText = expiryDate.toLocaleDateString('en-IN');
                }

                return (
                    <Badge
                        color={style.color}
                        text={statusText}
                        className="px-2 rounded-2xl"
                        style={style}
                    />
                );
            })(),
        },

        {
            label: 'Driver Assigned',
            value: (
                <DriverAssignedCell
                    record={transaction}
                    drivers={drivers}
                    onAssign={handleDriverChange}
                    onUnassign={handleDriverUnassign}
                    size="small"
                    className="w-32 text-xs"
                />
            ),
        },
    ];

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={9}>
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{vehicleNumber}</Typography.Text>
                        </Flex>
                    </Col>

                    <Col xs={9}>
                        <Flex justify="center">
                            <Badge
                                color={findColorByStatus(rcStatus).text}
                                text={
                                    rcStatus?.charAt(0).toUpperCase() +
                                    rcStatus?.slice(1).toLowerCase()
                                }
                                className="px-2 rounded-2xl"
                                style={{
                                    color: findColorByStatus(rcStatus).text,
                                    backgroundColor: findColorByStatus(rcStatus).background,
                                    padding: '2px 7px',
                                    borderRadius: '15px',
                                }}
                            />
                        </Flex>
                    </Col>

                    <Col xs={5}>
                        <Flex justify="center" gap={12} align="center">
                            {onRefreshVehicle && (
                                <VehicleRefreshAction
                                    record={transaction}
                                    refreshingId={refreshingId}
                                    onRefresh={onRefreshVehicle}
                                />
                            )}
                            <RightOutlined
                                onClick={() => setShowMore(!showMore)}
                                className={`collapse-icon ${showMore ? 'open' : ''}`}
                            />
                        </Flex>
                    </Col>
                </Row>

                {showMore && (
                    <Flex vertical gap={10} className="bg-bgLightGray p-6">
                        {details.map((detail, index) => (
                            <DetailSection key={index} {...detail} />
                        ))}
                    </Flex>
                )}

                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default TableMobile;
