import React from 'react';

import { Card, Button, Typography, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import EditOutlined from '../../Assets/icons/edit.svg';
import { formatNewDate } from '../../utils/formatDate';

const { Text } = Typography;

interface PreFilledBookingDetailsProps {
    hotelsRequest: {
        City: string | undefined;
        Country: string | undefined;
        CheckIn: string | undefined;
        CheckOut: string | undefined;
        rooms: Array<any>;
        cityName?: string;
    };
    totalCount: number;
    handleEditButtonClick: () => void;
}

const FilledBookingDetailsCardSm: React.FC<PreFilledBookingDetailsProps> = ({
    hotelsRequest,
    totalCount,
    handleEditButtonClick,
}) => (
    <Flex gap={10} justify="space-between">
        <Card
            className="rounded-2xl border-0 w-full  bg-[#F4F6FA]  p-0"
            bodyStyle={{ padding: '15px' }}
        >
            <Flex justify="space-between" align="center" gap={10}>
                {/* Location and Date Section */}

                <Flex vertical>
                    <Text strong className="text-md mb-0">
                        {hotelsRequest.cityName}
                    </Text>
                    {/* <Text strong className="text-md mb-0">
                        {hotelsRequest.CheckIn}, {hotelsRequest.CheckOut}
                    </Text> */}

                    <Flex className="space-x-2">
                        <Text className="text-xs mt-1">
                            {formatNewDate(hotelsRequest?.CheckIn ?? '')} -{' '}
                            {formatNewDate(hotelsRequest?.CheckOut ?? '')}
                        </Text>
                        <Text className="text-xs mt-1">
                            {totalCount} {totalCount === 1 ? 'Guest' : 'Guests'},{' '}
                            {hotelsRequest.rooms.length}{' '}
                            {hotelsRequest.rooms.length === 1 ? 'Room' : 'Rooms'}
                        </Text>
                    </Flex>
                </Flex>

                {/* Edit Icon */}
                <Button
                    type="default"
                    size="middle"
                    className="w-full flex justify-center items-center rounded-lg"
                    danger
                    icon={<ReactSVG src={EditOutlined} />}
                    onClick={handleEditButtonClick}
                />
            </Flex>
        </Card>
    </Flex>
);

export default FilledBookingDetailsCardSm;
