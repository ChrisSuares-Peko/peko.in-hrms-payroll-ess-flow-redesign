/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';

import { Button, Col, Flex, Row, Typography, Skeleton, Divider, Spin, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';

// import Facilities from '@domains/dashboard/Hotels/Components/Facilities';
import ViewHotel from '@src/domains/dashboard/Hotels/Components/RoomSelection/Header/ViewHotel';
import Overview from '@src/domains/dashboard/Hotels/Components/RoomSelection/Overview';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

import HotelviewSm from './Header/HotelviewSm';
import PriceChange from './PriceChange';
import Rooms from './Rooms';
import CheckoutTextRow from '../../../GiftCards/components/CheckoutTextRow';
import DateFields from '../../hooks/useDateField';
import usePrebookApi from '../../hooks/usePrebookApi';
import {
    getBookingKey,
    resetRoomResponse,
    resetTotalForms,
    resetUserData,
    resetUserDetails,
    setNetAmount,
    setPrebookResponse,
    setSupplements,
} from '../../slices/getHotelSlice';
import { Room } from '../../types/hotelTypes';
import ShowTimer from '../ShowTimer';

interface basicDetails {
    name: string;
    description: string;
    startRate: string;
    reviews: number;
    location: string;
    facilities: any;
    images: any;
    map: string;
    suppliments: any[];
}

const RoomSelection = ({ isLoading }: { isLoading: boolean }) => {
    const { md } = useScreenSize();
    const navigate = useNavigate();
    const [doLoading, setDoLoading] = useState(false);
    const dispatch = useAppDispatch();
    const { PrebookDetails } = usePrebookApi();
    const { hotelResponse, roomResponse, keyData, hotelsRequest, singleData } = useAppSelector(
        state => state.reducer.hotels
    );
   
 
    const checkIn = new Date(hotelsRequest.CheckIn);
    const checkout = new Date(hotelsRequest.CheckOut);
    const timeDiff = checkout.getTime() - checkIn.getTime();
    const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const [details, setDetails] = useState<basicDetails>();
    const [changedPrice, setChangedPrice] = useState<number | undefined>();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [roomInfo, setRoomInfo] = useState<Room[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [reset, setReset] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [initialRoom, setInitialRoom] = useState<Room[]>([]);
    const { showModal, isModalOpen, handleCancel } = DateFields();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const response = hotelResponse as any;

     const { rooms } = hotelsRequest;
     
      let totalCount = 0;

    rooms.forEach((entry:any) => {
        totalCount += entry.adult + entry.child;
    });
   
   
    const [selectedBookingCode, setSelectedBookingCode] = useState<string | null>(null);
    const [selectedBasePrice, setSelectedBasePrice] = useState<any>(null);
    const [selectedTax, setSelectedTax] = useState<any>(null);
    const [selectedPrice, setSelectedPrice] = useState<any>(null);
    const [selectedSuppliments, setSelectedSuppliments] = useState<any>(null);

    const handleRoomSelect = (
        bookingCode: string,
        amount: any,
        price: any,
        tax: any,
        suppliment: any
    ) => {
        setSelectedBookingCode(bookingCode);
        setSelectedBasePrice(price);
        setSelectedPrice(amount);
        setSelectedTax(tax);
        setSelectedSuppliments(suppliment);
    };

    useEffect(() => {
        if (response) {
            if (response.HotelDetails) {
                // const firstItemData = response.hotelDetails.data as HotelDetail[];
                // const firstItem = firstItemData[0];
                setDetails({
                    name: response.HotelDetails[0].HotelName,
                    description: response.HotelDetails[0].Description,
                    images: response.HotelDetails[0].Images,
                    location: response.HotelDetails[0].Address,
                    startRate: response.HotelDetails[0].HotelRating,
                    facilities: response.HotelDetails[0].HotelFacilities,
                    suppliments: response.HotelDetails[0]?.Supplements,
                    reviews: response.HotelDetails[0]?.HotelRating,
                    map: response.HotelDetails[0]?.Map
                });
            }
        }
    }, [response, keyData]);

    const minNetAmounts: { [key: number]: any } = {};
    roomInfo.forEach(room => {
        const { roomIndex } = room;
        const currentMinRoom = minNetAmounts[roomIndex];
        if (!currentMinRoom || room.roomRate.netAmount < currentMinRoom.roomRate.netAmount) {
            // If there's no current minimum or the current room has a smaller netAmount
            minNetAmounts[roomIndex] = room;
        }
    });
    const locationString = details?.location;
  

    const totalPrice = parseFloat(
        formatNumberWithoutCommas(
            roomResponse?.reduce((Price, roomData) => Price + Number(roomData.price), 0)
        )
    );
   

    const handleSubmit = () => {
        if (selectedBookingCode == null) {
            dispatch(
                showToast({
                    description: 'Please select a room',
                    variant: 'error',
                })
            );
        } else {
            setDoLoading(true);
            PrebookDetails(selectedBookingCode, selectedPrice).then(data => {
                setDoLoading(false);

                dispatch(getBookingKey(data?.response.HotelResult[0]?.Rooms[0].BookingCode));
                dispatch(
                    setNetAmount({
                        netAmount: data?.response.HotelResult[0]?.Rooms[0].NetAmount,
                        totalFare: selectedPrice,
                        tax: selectedTax,
                        basePrice: selectedBasePrice,
                    })
                );
                setChangedPrice(data?.response.HotelResult[0]?.Rooms[0].NetAmount);

                dispatch(setPrebookResponse(data?.response));
                if (typeof Moengage?.track_event === 'function') {
                    const totalAdults = hotelsRequest.rooms.reduce(
                        (sum: any, item: any) => sum + item.adult,
                        0
                    );
                    const totalChildren = hotelsRequest.rooms.reduce(
                        (sum: any, item: any) => sum + item.child,
                        0
                    );
                    const roomNames: string[] =
                        data?.response.HotelResult[0]?.Rooms[0]?.Name || [];
                    const roomNamePayload = roomNames.reduce(
                        (acc: Record<string, string>, name: string, index: number) => {
                            acc[`room_name_${index + 1}`] = name;
                            return acc;
                        },
                        {}
                    );
                    const checkInDate = new Date(hotelsRequest.CheckIn);
                    const checkOutDate = new Date(hotelsRequest.CheckOut);
                    const stayLength = Math.ceil(
                        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)
                    );
                    Moengage.track_event('hotel_room_chosen', {
                        guest_count: totalCount,
                        hotel_name: response.HotelDetails[0].HotelName,
                        adults: totalAdults,
                        children: totalChildren,
                        city: hotelsRequest.cityName || hotelsRequest.City,
                        ...roomNamePayload,
                        check_in: checkInDate,
                        check_out: checkOutDate,
                        total_price: selectedPrice,
                        rooms: rooms.length,
                        stay_length: stayLength,
                    });
                }
                if (data?.response.HotelResult[0]?.Rooms[0].isPriceChanged === true) {
                    showModal();
                } else {
                    dispatch(resetUserData());
                    dispatch(resetUserDetails());
                    dispatch(resetTotalForms());
                    dispatch(setSupplements(selectedSuppliments));
                    // handleSubmission()
                    navigate(paths.hotels.userDetails, {
                        state: { key: 'formData' },
                    });
                }
            });
        }
    };



    useEffect(() => {
        dispatch(resetRoomResponse());
    }, []);

    function renderRooms() {
        return (
            <Rooms
                rooms={singleData.Rooms}
                handleRoomSelect={handleRoomSelect}
                reset={reset}
                selectedBookingCode={selectedBookingCode}
            />
        );
    }

    return (
        <>
            {isLoading ? (
                <Row gutter={10}>
                    <Col span={md ? 18 : 24}>
                        <Skeleton.Input
                            style={{ height: '300px' }}
                            className="w-full mt-4"
                            active={isLoading}
                            size="large"
                            block
                        />
                        <Skeleton className="mt-5" active paragraph={{ rows: 3 }} />
                    </Col>
                    <Col span={6} className="hidden md:block">
                        <Skeleton active paragraph={{ rows: 15 }} />
                    </Col>
                </Row>
            ) : (
                <>
                    {md && ( // only for web design
                        <Row>
                            <Col xl={17} sm={24} className="">
                                <Typography.Text
                                    className="font-medium"
                                    data-testid="hotelname"
                                    style={{ fontSize: '1.3rem' }}
                                >
                                    {details?.name}
                                </Typography.Text>
                                <Flex justify="space-between" className="mt-3">
                                    <Flex align="center">
                                        <Typography.Text
                                            data-testid="cityname"
                                            className=" text-sm  text-slate-500"
                                        >
                                            {/* {locationParts?.map(
                                            (part, index) =>
                                                index > 0 && (
                                                    <span key={index}>
                                                        {part.trim()}
                                                        {index !== locationParts.length - 1 && ','}
                                                        &nbsp;&nbsp;
                                                    </span>
                                                )
                                        )} */}
                                            {locationString
                                                ?.replace(/,([^ ])/g, ', $1')
                                                .replace(/([a-z])([A-Z])/g, '$1 $2')}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                                <Flex>
                                    <Rate disabled value={details?.reviews} className="text-sm mt-1" />
                                </Flex>

                            </Col>
                        </Row>
                    )}
                    <Row gutter={40} className="mt-5">
                        <Col xl={16} sm={24} className="">
                            {md ? (
                                details && <ViewHotel image={details?.images} />
                            ) : (
                                //   <></>

                                <HotelviewSm
                                    details={details}
                                    reviews={Number(details?.startRate)}
                                // price={totalPrice.toFixed(2)}
                                />
                                // <></>
                            )}

                            <Overview
                                description={details?.description}
                                facilities={details?.facilities}
                                suppliments={selectedSuppliments}
                            />

                            <Flex vertical gap={8} className="pt-5 w-full">
                                <Typography.Text
                                    data-testid="selectroom"
                                    className="font-semibold text-lg text-slate-800"
                                >
                                    Select Your Room
                                </Typography.Text>
                                <Typography.Text className="text-sm text-slate-500">
                                    Choose from corporate class deluxe spaces, versatile twins, or
                                    premier business suites tailored for absolute comfort.
                                </Typography.Text>
                                {/* <Typography.Text
                                    className="font-medium text-red-500 cursor-pointer"
                                    onClick={!reset ? handleReset : undefined}
                                >
                                    Reset Rooms
                                </Typography.Text> */}
                            </Flex>

                            <Spin spinning={isLoadingRooms} size="small">
                                <div className="mt-4">{renderRooms()}</div>
                            </Spin>
                        </Col>

                        <Col xl={8} sm={24} className=" w-full">


                            {/* <Flex
                                vertical
                                className=" md:mt-0 mt-5 h-56 "
                            >

                                {details?.map && (
                                    <>
                                        <Typography.Text
                                            className="font-medium text-base"
                                        >
                                            View on Map
                                        </Typography.Text>
                                        <MapModal

                                            map={details?.map}

                                        />
                                    </>

                                )}

                            </Flex> */}



                            <Flex
                                vertical
                                className=" border border-[#ececec] py-6 px-7 rounded-[28px] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
                            >
                                    <ShowTimer />

                                <Typography.Title level={5}>Total Amount</Typography.Title>
                                <Flex vertical className=" mt-4" gap={15}>
                                    <CheckoutTextRow
                                        text={`Base Price (${nightDifference} ${nightDifference === 1 ? 'night' : 'nights'})`}
                                        value={formatNumberWithLocalString(selectedBasePrice) || '0.00'}
                                    />
                                    {!!selectedTax && (
                                        <CheckoutTextRow
                                            text="Taxes and fees"
                                            value={formatNumberWithLocalString(selectedTax) || '0.00'}
                                        />
                                    )}

                                    <Divider className="m-0" />

                                    <CheckoutTextRow
                                        text="Total (Tax Inclusive)"
                                        value={formatNumberWithLocalString(selectedPrice) || '0.00'}
                                        bold
                                    />
                                     <div data-testid="continue">

                                      <Button
                                danger
                                type="primary"
                                className="w-full font-medium px-5 h-11 mt-1"
                                data-testid="bookahotel"
                                onClick={handleSubmit}
                                loading={doLoading}
                            >
                                Continue
                            </Button>
                                     </div>
                                </Flex>
                            </Flex>
                            {/* <Link to={paths.hotels.userDetails}> */}
                          
                            {/* </Link> */}
                        </Col>
                    </Row>
                    <PriceChange
                        actualPrice={totalPrice}
                        changedPrice={changedPrice}
                        isModalOpen={isModalOpen}
                        handleCancel={handleCancel}
                    />

                    {/* <MapView details={details} selectedPrice={selectedPrice} /> */}

                </>
            )}
        </>
    );
};

export default RoomSelection;
