import { useState } from 'react';

import { Grid, Typography, Row, Col, Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import DateFields from '../../hooks/useDateField';
import useTimeConvert from '../../hooks/useTimeConvertHook';
import CancelPolicy from '../CancelPolicy';
import CheckInRoomDetails from '../GuestDetails/CheckInRoomDetails';

const { useBreakpoint } = Grid;
const { Text } = Typography;

interface HotelProps {
    hotel?: string;
    details?: any;
    checkInTime?: any;
    checkoutTime?: any;
    roomName?: string;
}

const Bookings = ({ hotel, details, checkoutTime, checkInTime, roomName }: HotelProps) => {
    const screens = useBreakpoint();
    const { hotelsRequest, prebookResponse } = useAppSelector(
        state => state.reducer.hotels
    );
    const { convertToAMPM } = useTimeConvert();
    const [isModal, setIsModal] = useState<boolean>(false);
    const cancellationPolicyModal = () => {
        setIsModal(true);
    };
    const cancelModal = () => {
        setIsModal(false);
    };

    const {  isModalOpen, handleCancel } = DateFields();

    const checkIn = new Date(hotelsRequest.CheckIn);
    const checkout = new Date(hotelsRequest.CheckOut);
    const timeDiff = checkout.getTime() - checkIn.getTime();
    const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const inTime = checkInTime === undefined ? undefined : convertToAMPM(checkInTime);
    const outTime = checkoutTime === undefined ? undefined : convertToAMPM(checkoutTime);

   


    return (
        <Content className="mt-5">
            <Content
                className="border border-[#ececec]"
                style={{ borderRadius: '28px', boxShadow: '0 4px 20px 8px rgba(0,0,0,0.02)' }}
            >
                {screens.md ? (
                    <Flex justify="space-between" className="p-5">
                        <Text className="font-bold mt-4 text-lg ">Room Details</Text>
                        <Flex className="pt-5">
                            {/* <Typography.Text
                                className="pt-1 text-sm font-medium text-red-600 underline cursor-pointer"
                                onClick={showModal}
                            >
                                View Room Details
                            </Typography.Text> */}
                            <Typography.Text
                                className="text-sm font-medium underline cursor-pointer"
                                onClick={cancellationPolicyModal}
                            >
                                View Cancellation Policy Details
                            </Typography.Text>
                        </Flex>
                    </Flex>
                ) : (
                    <Row className="p-3 space-y-2" justify="center">
                        <Col span={24}>
                            <Text className="font-bold text-lg mb-2">Room Details</Text>
                        </Col>
                        {/* <Col span={24}>
                            <Typography.Text
                                className="text-sm font-medium text-red-600 underline cursor-pointer"
                                onClick={showModal}
                            >
                                View Room Details
                            </Typography.Text>
                        </Col> */}
                        <Col span={24}>
                            <Typography.Text
                                className="pt-1 text-sm font-medium underline cursor-pointer"
                                onClick={cancellationPolicyModal}
                            >
                                View Cancellation Policy Details
                            </Typography.Text>
                        </Col>
                    </Row>
                )}
                <Content className="p-5 -mt-5" style={screens.xxl ? { width: '46.56rem' } : {}}>
                    <Row gutter={[16, 16]} className="pt-5">
                        <Col span={12}>
                            <Text className="text-textGreyColor">Check-in</Text>
                            <Text className="mt-1 block text-base" data-testid="checkin">
                                {dayjs(checkIn).format('YYYY-MM-DD')}
                            </Text>
                            {outTime && inTime && <Text className="text-sm">{checkInTime}</Text>}
                        </Col>
                        <Col span={12}>
                            <Text className="text-textGreyColor">Check-out</Text>
                            <Text className="mt-1 block text-base" data-testid="checkout">
                                {dayjs(checkout).format('YYYY-MM-DD')}
                            </Text>
                            {outTime && inTime && <Text className="text-sm">{outTime}</Text>}
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} className="pt-5">
                        <Col md={12} xs={24}>
                            <Text className="text-textGreyColor">Total length of stay</Text>
                            <Text className="mt-1 block text-base " data-testid="staylength">
                                {nightDifference} {nightDifference === 1 ? 'Night' : 'Nights'}
                            </Text>
                        </Col>
                        <Col md={12} xs={24}>
                            <Text className="text-textGreyColor">Room name</Text>

                            <Text className="block text-base">
                                {roomName
                                    ?.replace(/,([^ ])/g, ', $1')
                                    .replace(/([a-z])([A-Z])/g, '$1 $2')}
                            </Text>
                        </Col>
                    </Row>
                </Content>
            </Content>
            <CheckInRoomDetails
                roomData={prebookResponse.HotelResult[0]?.Rooms[0].Amenities}
                isModalOpen={isModalOpen}
                handleCancel={handleCancel}
            />
            <CancelPolicy
                isModalOpen={isModal}
                handleCancel={cancelModal}
                cancellationPolicy={
                    prebookResponse.HotelResult[0]?.Rooms[0]?.CancelPolicies ||
                    'No cancellation policy available.'
                }
            />
        </Content>
    );
};

export default Bookings;
