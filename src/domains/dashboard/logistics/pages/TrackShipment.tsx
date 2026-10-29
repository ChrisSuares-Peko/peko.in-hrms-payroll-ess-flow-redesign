import React, { useEffect, useState } from 'react';

import { Col, Empty, Flex, Skeleton, Typography } from 'antd';
import { debounce } from 'lodash';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { Stepper, TrackingTable } from '../components';
import TrackingUpdate from '../components/TrackingUpdate';
import { useTrackShipmentApi } from '../hooks/useTrackShipmentApi';
import { ITrackingDetails } from '../types/tracking';
import { formalTextFormatter } from '../utils/helperFunctions';

const MemoizedStepper = React.memo(Stepper);
const { Text } = Typography;
const TrackShipment = () => {
    const location = useLocation();
    const [trackingDetails, setTrackingDetails] = useState<ITrackingDetails | false>(false);
    const [, setLatestStatus] = useState('');
    const { handleTrackShipment } = useTrackShipmentApi();
    const [isStatusChanged, setIsStatusChanged] = useState(false);
    const handleChangeStatus = (value: boolean) => setIsStatusChanged(value);
    const navigate = useNavigate();

    useEffect(() => {
        const debouncedTrackShipment = debounce(() => {
            const searchParams = new URLSearchParams(location.search);
            const trackingNo = searchParams.get('trackingNo');
            handleTrackShipment(trackingNo ?? '').then(result => {
                if (!result) {
                    navigate(`/${paths.logistics.index}`);
                } else {
                    setTrackingDetails(result);
                    if (result.shipmentStatus && result.shipmentStatus.length > 0) {
                        const lastStatus =
                            result.shipmentStatus[result.shipmentStatus.length - 1].orderStatus;
                        setLatestStatus(lastStatus);
                    } else {
                        setLatestStatus('');
                    }
                }
            });
        }, 500); // Adjust debounce delay as needed

        debouncedTrackShipment();

        return () => {
            debouncedTrackShipment.cancel();
        };
    }, [navigate, location.search, handleTrackShipment, isStatusChanged]);

    return (
        <>
            {trackingDetails ? (
                <Flex vertical gap={20} className="px-0 mb-8">
                    <Flex vertical>
                        <Flex justify="space-between" align="end">
                            <Flex
                                className="text-sm font-medium sm:text-lg "
                                gap="middle"
                                align="center"
                            >
                                <Text>Order Details</Text>
                                {trackingDetails.shipmentStatus.length && (
                                    <Text className="text-[#E2B429] text-sm  px-3 py-1 rounded-2xl whitespace-nowrap">
                                        {formalTextFormatter(
                                            trackingDetails.shipmentStatus[0]?.orderStatus
                                        )}
                                    </Text>
                                )}
                            </Flex>
                            <Flex>
                                <Flex className="font-normal text-neutral-900 text-4">
                                    Tracking Number:
                                </Flex>
                                <Flex className="font-semibold text-red-500 text-4 ps-1">
                                    {trackingDetails.trackingNo}
                                </Flex>
                            </Flex>
                        </Flex>
                        <TrackingTable
                            data={trackingDetails.orderResponse}
                            amount={trackingDetails.amount}
                            status={
                                Array.isArray(trackingDetails.shipmentStatus) &&
                                trackingDetails.shipmentStatus.length > 0
                                    ? trackingDetails.shipmentStatus[0]?.orderStatus || ''
                                    : ''
                            }
                            handleChangeStatus={handleChangeStatus}
                            orderId={trackingDetails.orderId.toString()}
                        />
                    </Flex>

                    <Flex vertical>
                        <Flex className="text-sm font-medium sm:text-lg ">Order Tracking</Flex>
                        <MemoizedStepper statuses={trackingDetails.trackingValues} />
                    </Flex>

                    <Flex vertical>
                        <Flex className="my-8 text-sm font-medium sm:text-lg">Latest Update</Flex>
                        {trackingDetails &&
                        trackingDetails.shipmentStatus &&
                        trackingDetails.shipmentStatus.length > 0 ? (
                            trackingDetails.shipmentStatus.map((value, i) => (
                                <TrackingUpdate
                                    key={i}
                                    date={new Date(value.createdAt).toLocaleString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: true,
                                    })}
                                    // location={value.UpdateLocation.UpdateLocation}
                                    description={value.remarks}
                                />
                            ))
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No updates" />
                        )}
                    </Flex>
                </Flex>
            ) : (
                Array.from({ length: 4 }).map((_, index) => (
                    <Col xs={24} sm={24} md={24} xl={24} key={index}>
                        <Skeleton active avatar className="min-h-48" />
                    </Col>
                ))
            )}
        </>
    );
};

export default TrackShipment;
