import React, { useEffect, useState } from 'react';

import { Button, Card, Col, DatePicker, Flex, Row, Typography } from 'antd';
import '@domains/dashboard/Hotels/styles/home.css';
import Paragraph from 'antd/es/typography/Paragraph';
import dayjs from 'dayjs';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import location from '@domains/dashboard/Hotels/Assets/icons/locationIcon.svg';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useDateFields from '../../hooks/useDateField';
import useSearchCityApi from '../../hooks/useSearchCityApi';
import useTimeConvert from '../../hooks/useTimeConvertHook';
import { getHotels, resetHotelArr } from '../../slices/getHotelSlice';
import SelectCity from '../AutoComplete/SelectCity';
import BookModal from '../GuestInfoModal/Modal';
import '../../Assets/style.css';

const Detailshead = ({
    hotelsSearch,
    isLoading: hotelLoading,
}: {
    hotelsSearch: any;
    isLoading: boolean;
}) => {
    const { showModal, handleCancel, isModalOpen } = useDateFields();
    const { hotelsRequest } = useAppSelector(state => state.reducer.hotels);
    const { convertToDateString } = useTimeConvert();

    // const { convertToDateString } = useTimeConvert();

    const [searchText, setSearchText] = useState<string>('');
    const [selectedCityName, setSelectedCityName] = useState<string>(hotelsRequest.City || '');
    const [defaultCityName, setDefaultCityName] = useState<string | undefined>(
        hotelsRequest.cityName
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedCountryName, setSelectedCountryName] = useState<string>(
        hotelsRequest.country || ''
    );
    const [checkInDate, setCheckInDate] = useState<string>(hotelsRequest.CheckIn || '');
    const [checkOutDate, setCheckOutDate] = useState<string>(hotelsRequest.CheckOut || '');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [roomData, setRoomData] = useState([]);
    const { cityList, cityOptions } = useSearchCityApi();

   
    const handlecitySelect = (value: string, name: string) => {
        // const [cityName, countryName] = value.split(', ');
        // setSelectedCityName(cityName);
        setSelectedCityName(value);
        setDefaultCityName(name);
    };
    useEffect(() => {
        if (selectedCountryName) {
            cityList(selectedCountryName);
        }
    }, [selectedCountryName, cityList]);

    const dispatch = useDispatch();

    let totalCount = 0;

    hotelsRequest.rooms.forEach((count: { adult: any; child: any }) => {
        totalCount += count.adult + count.child;
    });
    const handleClick = () => {
        if (hotelLoading) return; // skip another search
        dispatch(resetHotelArr());
        if (!selectedCityName) {
            dispatch(showToast({ description: 'Please select a location', variant: 'error' }));
            return;
        }
        if (!dayjs(checkOutDate).isAfter(dayjs(checkInDate), 'day')) {
            dispatch(
                showToast({
                    description:
                        'Minimum stay is 1 night. Please select a check-out date after your check-in date.',
                    variant: 'error',
                })
            );
            return;
        }
        const payload = {
            City: selectedCityName,
            // country: selectedCountryName,
            CheckIn: checkInDate,
            CheckOut: checkOutDate,
            GuestNationality: 'IN',
        };

        dispatch(
            getHotels({
                City: selectedCityName,
                CheckIn: checkInDate,
                CheckOut: checkOutDate,
                GuestNationality: 'IN',
                country: selectedCountryName,
                cityName: defaultCityName,
            })
        );

        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        hotelsSearch(payload);
    };
  
    const gridStyle: React.CSSProperties = {
        width: '100%',
        height: '4.2rem',
        padding: '0.7rem',
        alignItems: 'center',
        borderRadius: '0.75rem',
    };
    const gridStyleEnd: React.CSSProperties = {
        width: '50%',
        height: '4.2rem',
        padding: '.5rem',
        alignItems: 'center',
        borderTopRightRadius: '.75rem',
        borderBottomRightRadius: '.75rem',
        borderTopLeftRadius: '.0.5rem',
        borderBottomLeftRadius: '.0.5rem',
    };

    const gridStyleStart: React.CSSProperties = {
        width: '50%',
        height: '4.2rem',
        padding: '.5rem',
        alignItems: 'center',
        borderTopLeftRadius: '.75rem',
        borderBottomLeftRadius: '.75rem',
        borderTopRightRadius: '.0.5rem',
        borderBottomRightRadius: '.0.5rem',
    };
    const disabledDate = (current: any) => current && current < moment().startOf('day');
   
    const disabledEndDate = (current: any) =>
        current && current <= moment(checkInDate).startOf('day');

   
    return (
        <>
            <style>
                {`
                
                :where(.css-dev-only-do-not-override-1rqnfsa).ant-typography+h4.ant-typography, :where(.css-dev-only-do-not-override-1rqnfsa).ant-typography+h5.ant-typography {
                    margin-top: 0rem;
                }
                `}
            </style>
            <Flex vertical gap={7} className="top-1/3 w-full">
                <Row gutter={10}>
                    <Col className="h-full" md={6} xl={8}>
                        <Card
                            className="flex flex-col border-none h-full"
                            bodyStyle={{ padding: 0 }}
                        >
                            <Card.Grid hoverable={false} style={gridStyle}>
                                <Flex vertical>
                                    <Flex className="flex-none text-xs text-gray-500 ml-3">
                                        <ReactSVG src={location} className="" />
                                        <Paragraph className="flex-none text-xs text-gray-500 ml-1">
                                            Location
                                        </Paragraph>
                                    </Flex>
                                    <SelectCity
                                        options={cityOptions}
                                        onSelect={handlecitySelect}
                                        searchKey={searchText}
                                        setSearchKey={setSearchText}
                                        defaultvalue={defaultCityName}
                                        textSize="xs:text-lg md:text-xl"
                                        disabled={hotelLoading}
                                    />
                                </Flex>
                            </Card.Grid>
                        </Card>
                    </Col>

                    <Col className="gutter-row mt-3 md:mt-0" xs={24} sm={12} md={8} lg={8} xl={8}>
                        <Flex className="w-full">
                            <Card
                                style={gridStyleStart}
                                bodyStyle={{ padding: 0 }}
                                className="flex-1"
                            >
                                <Flex vertical>
                                    <Paragraph className="flex-none text-xs text-gray-500 ml-3">
                                        Check-in
                                    </Paragraph>
                                    <Typography.Title
                                        level={4}
                                        className="text-sm text-gray-500 py-0 px-0"
                                    >
                                        <DatePicker
                                            defaultValue={dayjs(checkInDate)}
                                            onChange={(date: any) => {
                                                const checkIn = date.format('YYYY-MM-DD');
                                                if (
                                                    dayjs(checkIn).isAfter(dayjs(checkOutDate)) ||
                                                    dayjs(checkIn).isSame(dayjs(checkOutDate))
                                                ) {
                                                    const checkOut = dayjs(checkIn)
                                                        .add(1, 'day')
                                                        .format('YYYY-MM-DD');
                                                    setCheckOutDate(checkOut);
                                                }
                                                setCheckInDate(checkIn);
                                            }}
                                            style={{ border: 0 }}
                                            format="DD MMM YYYY"
                                            suffixIcon={null}
                                            disabledDate={disabledDate}
                                            className="custom_date font-medium"
                                            allowClear={false}
                                            onKeyDown={e => e.preventDefault()} // Prevent manual input
                                            disabled={hotelLoading}
                                            inputReadOnly
                                        />
                                    </Typography.Title>
                                </Flex>
                            </Card>
                            <Card
                                style={gridStyleEnd}
                                bodyStyle={{ padding: 0 }}
                                className="flex-1"
                            >
                                <Flex vertical>
                                    <Paragraph className="flex-none text-xs text-gray-500 ml-3">
                                        Check-out
                                    </Paragraph>
                                    <Typography.Title
                                        level={4}
                                        className="text-sm text-gray-500 py-0 px-0"
                                    >
                                        <DatePicker
                                            defaultValue={dayjs(checkOutDate)}
                                            value={dayjs(checkOutDate)}
                                            onChange={(date: any) =>
                                                setCheckOutDate(date.format('YYYY-MM-DD'))
                                            }
                                            style={{ border: 0 }}
                                            format="DD MMM YYYY"
                                            suffixIcon={null}
                                            disabledDate={disabledEndDate}
                                            className="custom_date font-medium"
                                            allowClear={false}
                                            onKeyDown={e => e.preventDefault()} // Prevent manual input
                                            disabled={hotelLoading}
                                            inputReadOnly
                                        />
                                    </Typography.Title>
                                </Flex>
                            </Card>
                        </Flex>
                    </Col>

                    <Col className="gutter-row mt-3 md:mt-0" xs={24} sm={12} md={5} lg={5}>
                        <Card
                            className="flex flex-col border-none h-full"
                            bodyStyle={{ padding: 0 }}
                        >
                            <Card.Grid hoverable={false} style={gridStyle}>
                                <Flex vertical>
                                    <Typography.Text className="text-xs text-gray-500 mx-2 line-clamp-1">
                                        No. of Rooms and Guests
                                    </Typography.Text>
                                    <Typography.Text
                                        className={`xxl:font-medium py-1 mx-2 md:text-xs ${hotelLoading ? 'text-gray-500' : 'cursor-pointer'} `}
                                        style={{ fontSize: '17px' }}
                                        onClick={() => !hotelLoading && showModal()}
                                    >
                                        {hotelsRequest.rooms.length}{' '}
                                        {hotelsRequest.rooms.length === 1 ? 'Room' : 'Rooms'}
                                        ,&nbsp;
                                        {totalCount} {totalCount === 1 ? 'Guest' : 'Guests'}
                                    </Typography.Text>
                                </Flex>
                            </Card.Grid>
                        </Card>
                    </Col>
                    <Col className="gutter-row mt-3 md:mt-0" xs={24} sm={12} md={5} lg={5} xl={3}>
                        <Button
                            size="middle"
                            onClick={() => !hotelLoading && handleClick()}
                            className=" w-full h-16 rounded-xl text-center"
                            disabled={hotelLoading}
                           type="primary"
                        >
                            <Typography.Text className="text-white text-base">
                                Search
                            </Typography.Text>
                        </Button>
                    </Col>
                </Row>
                <BookModal
                    isModalOpen={isModalOpen}
                    handleCancel={handleCancel}
                    setRoomData={setRoomData}
                />
            </Flex>
        </>
    );
};

export default Detailshead;
