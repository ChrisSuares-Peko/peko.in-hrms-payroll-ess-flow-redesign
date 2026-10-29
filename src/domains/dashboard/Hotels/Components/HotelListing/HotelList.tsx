import { RightOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Image, Rate, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import defaultHotel from '../../Assets/defaultImage.jpg';
import location from '../../Assets/icons/locationIcon.svg';
import { resetData, resetRoomResponse, setKeys, setSingleData } from '../../slices/getHotelSlice';
import '../../Assets/style.css';
import { DISPLAY_FACILITIES } from '../../utils/data';
import { getFreeCancellationDeadline } from '../RoomSelection/Rooms/roomFormatters';

interface hotelDetails {
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
    index?: number;
}

const HotelList = ({
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
    index,
}: hotelDetails) => {
    const dispatch = useAppDispatch();

    const navigate = useNavigate();
    const handleClick = () => {
        dispatch(resetData());
        dispatch(resetRoomResponse());
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
        <Content className={`px-7 ${index !== 0 ? 'mt-5' : ''}`}>
            <Row
                gutter={[15, 15]}
                className="search-result-card p-3 rounded-[20px] "
                style={{ ...style, background: 'white' }}
            >
                <Col className="" span={7}>
                    <Image
                        width="100%"
                        height={180}
                        className={`rounded-lg object-cover mt-1 ${
                            image === '' ? 'border-b border-t' : ''
                        }`}
                        src={image !== undefined ? image : defaultHotel}
                        preview={false}
                    />
                </Col>
                <Col className=" mt-3 " span={17}>
                    <Flex className="w-full" justify="space-between" gap={10}>
                        <Flex className="w-2/3" vertical>
                            {/* <Typography.Text className="text-xs text-gray-500">
                                Entire home in {name}
                            </Typography.Text> */}
                            <Typography.Text className="font-medium text-xl">
                                {name}
                            </Typography.Text>

                            <Flex className="mt-2" gap={3}>
                                <ReactSVG
                                    src={location}
                                    beforeInjection={svg => {
                                        svg.setAttribute(
                                            'style',

                                            'width: 17px; height: 17px;'
                                        );
                                    }}
                                />
                                <Typography.Text className="text-md text-gray-500 ">
                                    {facilities}
                                </Typography.Text>
                            </Flex>
                            {visibleFacilities.length > 0 && (
                                <Flex gap={12} wrap="wrap" className="mt-2 text-sm text-gray-500">
                                    {visibleFacilities.map(item => (
                                        <Flex key={item.key} gap={6} align="center" className="mb-2">
                                            <ReactSVG
                                                src={item.icon}
                                                beforeInjection={svg => {
                                                    svg.setAttribute(
                                                        'style',
                                                        `width: ${item.iconSize}px; height: ${item.iconSize}px;`
                                                    );
                                                }}
                                            />
                                            <Typography.Text className="text-gray-600">
                                                {item.label}
                                            </Typography.Text>
                                        </Flex>
                                    ))}
                                </Flex>
                            )}

                            {cancellationText && (
                                <Flex align="center" gap={6} className="mt-2">
                                    <Typography.Text className="text-green-600 text-xs ">
                                        {cancellationText}
                                    </Typography.Text>
                                </Flex>
                            )}

                            {/* <Flex className="w-16 mt-1">
                                <Divider />
                            </Flex> */}
                            <Flex vertical className="mt-2">
                                {/* <Flex>
                                    <Typography.Text className="text-sm text-green-700 text-end">
                                        {cancellationPolicy}
                                    </Typography.Text>
                                </Flex> */}
                                <Flex>
                                    <Rate disabled value={reviews} className="text-sm mt-1" />
                                </Flex>
                            </Flex>
                        </Flex>
                        <Flex vertical className="">
                            <Flex vertical className="mt-4 w-full" style={{ alignItems: 'center' }}>
                                {/* <Typography.Text className=" text-gray-500">Price</Typography.Text> */}
                                <Typography.Text className="font-medium text-xl">
                                    ₹ {formatNumberWithLocalString(price)}
                                </Typography.Text>
                                <Typography.Text className=" text-gray-500 text-sm mt-1 text-center">
                                    Includes taxes and charges
                                </Typography.Text>
                            </Flex>

                            <Button
                                danger
                                type="primary"
                                className="w-32 font-medium px-5 ml-5 mt-3 flex items-center justify-center"
                                onClick={handleClick}
                            >
                                <Flex gap={4}>
                                    <Typography.Text className="text-sm text-white  ">
                                        Select Rooms
                                    </Typography.Text>
                                    <RightOutlined className="text-xs font-bold" />
                                    {/* <ReactSVG src={arrow} className='mt-1'/> */}
                                </Flex>
                            </Button>
                        </Flex>
                    </Flex>
                </Col>
            </Row>
        </Content>
    );
};

export default HotelList;
