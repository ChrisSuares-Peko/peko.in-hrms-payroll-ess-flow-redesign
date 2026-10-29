import { Col, Flex, Image, Rate, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import location from '@domains/dashboard/Hotels/Assets/icons/locationIcon.svg';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import defaultHotel from '../../Assets/defaultImage.jpg';
import { setKeys, setSingleData } from '../../slices/getHotelSlice';
import { DISPLAY_FACILITIES } from '../../utils/data';
import { getFreeCancellationDeadline } from '../RoomSelection/Rooms/roomFormatters';

interface booked {
    hotelKey: string;
    image: string;
    name: string;
    facilities: string;
    reviews: number;
    searchKey?: string;
    conversationId: string;
    price?: number;
    style?: React.CSSProperties;
    cancellationPolicy?: string;
    items?: any;
}
const BookedSm = ({
    hotelKey,
    image,
    name,
    facilities,
    reviews,
    style,
    searchKey,
    conversationId,
    price,
    cancellationPolicy,
    items,
}: booked) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleClick = () => {
        dispatch(setSingleData(items));
        dispatch(setKeys({ conversationId: hotelKey }));
        navigate(paths.hotels.hotelView, { state: { key: 'formData' } });
    };
    const visibleFacilities = DISPLAY_FACILITIES.filter(df =>
        items?.HotelFacilities?.some((facility: any) => df.match.test(facility))
    );

    const firstRoom = items?.Rooms?.[0];
    const freeCancellationDeadline = getFreeCancellationDeadline(firstRoom?.CancelPolicies);
    const cancellationText = freeCancellationDeadline
        ? `Free cancellation until ${freeCancellationDeadline}`
        : null;

    return (
        <Content
            onClick={handleClick}
            className="w-full mb-6 overflow-hidden rounded-xl"
            style={{
                // Light gray border
                border: '1px solid #f0f0f0',
                // Subtle box shadow
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                // Ensure background is white (if needed)
                backgroundColor: '#fff',
            }}
        >
            <Row gutter={12}>
                <Col span={24} style={{ padding: '0.7rem' }}>
                    <Image
                        width="100%"
                        height="auto"
                        src={image !== undefined ? image : defaultHotel}
                        className="mt-1 object-cover rounded-md max-h-[11.25rem] xs375:max-h-[15.625rem] sm:max-h-[18.75rem]" // Tailwind utility for max height in rem
                    />
                </Col>
                <Col span={24} className="px-3">
                    <Flex vertical className="px-2">
                        <Flex justify="space-between">
                            <Typography.Text className="font-bold text-medium w-44 mt-1">
                                {name}
                            </Typography.Text>
                            <Typography.Text className="font-bold mt-1">
                                ₹ {price?.toFixed(2)}
                            </Typography.Text>
                        </Flex>
                        <Flex>
                            <Rate disabled value={reviews} className="text-xs mt-2" />
                        </Flex>

                        <Flex gap="" className="mb-3 mt-2">
                            <ReactSVG className="mt-1 fill-amber-600" src={location} />
                            <Typography.Text className="text-xs mt-1 ml-1 ">
                                {facilities}
                            </Typography.Text>
                        </Flex>
                        {visibleFacilities.length > 0 && (
                            <Flex gap={12} wrap="wrap" className="mt-2 text-xs text-gray-500">
                                {visibleFacilities.map(item => (
                                    <Flex key={item.key} gap={6} align="center" className="mb-2">
                                        <ReactSVG
                                            src={item.icon}
                                            beforeInjection={svg => {
                                                const size = Math.max(item.iconSize - 2, 10);
                                                svg.setAttribute(
                                                    'style',
                                                    `width: ${size}px; height: ${size}px;`
                                                );
                                            }}
                                        />
                                        <Typography.Text className="text-gray-600 ">
                                            {item.label}
                                        </Typography.Text>
                                    </Flex>
                                ))}
                            </Flex>
                        )}

                        {cancellationText && (
                            <Flex align="center" gap={6} className="mt-2 mb-5">
                                <Typography.Text className="text-green-600 text-xs ">
                                    {cancellationText}
                                </Typography.Text>
                            </Flex>
                        )}
                    </Flex>
                </Col>
            </Row>
        </Content>
    );
};

export default BookedSm;
