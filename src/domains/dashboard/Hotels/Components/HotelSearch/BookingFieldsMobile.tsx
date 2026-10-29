/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { Button, Col, DatePicker, Flex, Row, Typography } from 'antd';
import Paragraph from 'antd/es/typography/Paragraph';
import dayjs from 'dayjs';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import location from '@domains/dashboard/Hotels/Assets/icons/locationIcon.svg';
import MagnifyingGlass from '@domains/dashboard/Hotels/Assets/icons/MagnifyingGlass.svg';
import BookModal from '@src/domains/dashboard/Hotels/Components/GuestInfoModal/Modal';
import '@domains/dashboard/Hotels/styles/home.css';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import useDateFields from '../../hooks/useDateField';
import useSearchApi from '../../hooks/useSearchApi';
import useSearchCityApi from '../../hooks/useSearchCityApi';
import useSearchCountryApi from '../../hooks/useSearchCountryApi';
import useTimeConvert from '../../hooks/useTimeConvertHook';
import {
    getHotels,
    resetData,
    resetRoomResponse,
    resetHotelArr,
    resetNationality,
    resetResidence,
    setSearchKey,
    resetSearchKey,
    resetUserData,
    resetTotalForms,
} from '../../slices/getHotelSlice';
import SelectCity from '../AutoComplete/SelectCity';
import '../../Assets/style.css';
import SelectCountry from '../AutoComplete/SelectCountry';

const BookingfieldsMobile = () => {
    const dispatch = useAppDispatch();
    const {
        showModal,

        handleCancel,

        isModalOpen,
    } = useDateFields();

    const { hotelsRequest } = useAppSelector(state => state.reducer.hotels);
    const { rooms } = hotelsRequest;
    const { convertToDateString } = useTimeConvert();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [roomData, setRoomData] = useState([]);

    const [searchText, setSearchText] = useState<string>('');
    const debounceSearchText = useDebounce(searchText, 300);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [nationalityText, setNationalityText] = useState<string>('IN');
    const debounceNationalityText = useDebounce(nationalityText, 300);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [residenceText, setResidenceText] = useState<string>('');
    const debounceResidenceText = useDebounce(residenceText, 300);

    const [selectedCityName, setSelectedCityName] = useState<string | undefined>('144306');
    const [defaultCityName, setDefaultCityName] = useState<string | undefined>(
        'Mumbai, Maharashtra'
    );

    const [selectedCountryName, setSelectedCountryName] = useState<string>('IN');
    const tomorrow = dayjs().add(1, 'day');
    const dayAfterTomorrow = tomorrow.add(1, 'day');
    const [checkInDate, setCheckInDate] = useState<any>(tomorrow);
    const [checkOutDate, setCheckOutDate] = useState<any>(dayAfterTomorrow);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [nationality, selectedNationality] = useState<string>('IN');
    
    const { hotelsList } = useSearchApi();

    const disabledDate = (current: any) => current && current < moment().startOf('day');
    // Check-out must be at least 1 night after check-in, so check-in's own day is disabled too
    // (not just dates strictly before it) — otherwise a 0-night same-day stay is selectable.
    const disabledEndDate = (current: any) =>
        current && current <= moment(checkInDate).startOf('day');

    const checkInData = convertToDateString(checkInDate);
    const checkoutData = convertToDateString(checkOutDate);

    const { cityList, cityOptions, isLoading: isCityLoading } = useSearchCityApi();
    const { countryList, countryOptions } = useSearchCountryApi();

    const handleCountrySelect = (value: string) => {
        setSelectedCountryName(value);
        setSelectedCityName('');
        setDefaultCityName('');
        cityList(value);
    };

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
    }, []);

   

    let totalCount = 0;

    rooms.forEach((count: { adult: number; child: number }) => {
        totalCount += count.adult + count.child;
    });

    const getWeekday = (date: any) => dayjs(date).format('dddd');

    useEffect(() => {
        // cityList(debounceSearchText);
        dispatch(resetSearchKey());
    }, [debounceSearchText, dispatch]);

    useEffect(() => {
        countryList(debounceNationalityText);
    }, [debounceNationalityText, countryList]);

    useEffect(() => {
        countryList(debounceResidenceText);
    }, [debounceResidenceText, countryList]);

    const navigate = useNavigate();

    const handleClick = () => {
        dispatch(resetTotalForms());
        dispatch(resetUserData());
        dispatch(resetNationality());
        dispatch(resetResidence());
        dispatch(resetData());
        dispatch(resetRoomResponse());
        dispatch(resetHotelArr());

        if (selectedCountryName === '' || selectedCountryName === undefined) {
            dispatch(
                showToast({
                    description: 'Location field cannot be empty. Enter a valid location.',
                    variant: 'error',
                })
            );
        } else if (selectedCityName === '' || selectedCityName === undefined) {
            dispatch(
                showToast({
                    description: 'City field cannot be empty. Enter a valid city.',
                    variant: 'error',
                })
            );
        } else if (checkInDate === '') {
            dispatch(
                showToast({
                    description: 'CheckIn date should not be empty',
                    variant: 'error',
                })
            );
        } else if (checkOutDate === '') {
            dispatch(
                showToast({
                    description: 'Checkout date should not be empty',
                    variant: 'error',
                })
            );
        } else if (!dayjs(checkoutData).isAfter(dayjs(checkInData), 'day')) {
            dispatch(
                showToast({
                    description:
                        'Minimum stay is 1 night. Please select a check-out date after your check-in date.',
                    variant: 'error',
                })
            );
        }
        // else if (nationality === '') {
        //     dispatch(
        //         showToast({
        //             description: 'Traveller Nationality should not be empty',
        //             variant: 'error',
        //         })
        //     );
        // } else if (residence === '') {
        //     dispatch(
        //         showToast({
        //             description: 'Traveller Country of Residence should not be empty',
        //             variant: 'error',
        //         })
        //     );
        // }
        else {
            const payload = {
                City: selectedCityName,
                CheckIn: checkInData,
                CheckOut: checkoutData,
                GuestNationality: nationality,
            };
            dispatch(
                getHotels({
                    City: selectedCityName,
                    CheckIn: checkInData,
                    CheckOut: checkoutData,
                    GuestNationality: nationality,
                    country: selectedCountryName,
                    cityName: defaultCityName,
                })
            );
            hotelsList(payload);
            dispatch(setSearchKey('searchHotel'));
            navigate(`${paths.hotels.index}/${paths.hotels.details}`, {
                state: { key: 'searchHotels' },
            });
            if (typeof Moengage?.track_event === 'function') {
                const totalAdults = hotelsRequest.rooms.reduce(
                    (sum: any, item: any) => sum + item.adult,
                    0
                );
                const totalChildren = hotelsRequest.rooms.reduce(
                    (sum: any, item: any) => sum + item.child,
                    0
                );
                Moengage.track_event('hotel_search_started', {
                    city: defaultCityName,
                    check_in: new Date(checkInData),
                    check_out: new Date(checkoutData),
                    rooms: hotelsRequest.rooms.length,
                    adults: totalAdults,
                    children: totalChildren,
                });
            }
        }
    };

    return (
        <>
            {/* <style>
                {`
               
               
                :where(.css-dev-only-do-not-override-9hcf67).ant-select-single .ant-select-selector{
                    font-size: 18px !important;
                }
                :where(.css-dev-only-do-not-override-9hcf67).ant-select .ant-select-selection-item {
                    font-weight: 500 !important;
                }
               
                `}
            </style> */}
            <Row
                className="w-full ps-4 gap-2 pt-2 "
                justify="space-between"
                align="middle"
                gutter={20}
            >
                <Col
                    xs={24}
                    sm={24}
                    md={6}
                    lg={7}
                    className="w-full border border-solid rounded-xl p-1"
                >
                    <Flex className="flex-none text-xs text-gray-500 mt-1 ml-3">
                        <ReactSVG src={location} className="" />
                        <Paragraph className="text-xs ml-1 text-gray-500">Country </Paragraph>
                    </Flex>
                    <SelectCountry
                        options={countryOptions}
                        onSelect={handleCountrySelect}
                        searchKey={searchText}
                        setSearchKey={setSearchText}
                        defaultvalue={selectedCountryName}
                        textSize="text-xl"
                        placeholder="Enter Country"
                    />
                </Col>

                <Col
                    xs={12}
                    sm={11}
                    md={4}
                    lg={4}
                    className="w-full  border border-solid rounded-xl p-1"
                >
                    <Typography.Text className="text-xs text-gray-500 md:ml-4 ml-3 mt-1">
                        Check-in
                    </Typography.Text>
                    <Typography.Title level={4} className="text-sm text-gray-500 py-0 px-0 ml-1">
                        <DatePicker
                            disabledDate={disabledDate}
                            onChange={(date: any) => {
                                const checkIn = date.format('YYYY-MM-DD');
                            
                                if (!dayjs(checkOutDate).isAfter(dayjs(checkIn), 'day')) {
                                    const checkOut = dayjs(checkIn).add(1, 'day').format('YYYY-MM-DD');
                                    setCheckOutDate(checkOut);
                                }
                                setCheckInDate(checkIn);
                            }}
                            value={dayjs(checkInDate)}
                            style={{ border: 0 }}
                            className="custom_date text-lg md:ml-2 font-bold"
                            format="DD MMM YYYY"
                            suffixIcon={null}
                            size="small"
                            defaultValue={tomorrow}
                            allowClear={false}
                            inputReadOnly
                        />
                    </Typography.Title>
                    <Flex className="h-4 ml-2">
                        <Typography.Text className="text-xs text-gray-500 md:ms-3 ms-1 line-clamp-1">
                            {/* {tomorrow?getWeekday(tomorrow):getWeekday(checkInDate)} */}
                            {checkInDate && getWeekday(checkInDate)}
                        </Typography.Text>
                    </Flex>
                </Col>

                <Col
                    xs={11}
                    sm={11}
                    md={4}
                    lg={4}
                    className="w-full  border border-solid rounded-xl p-1 "
                >
                    <Typography.Text className="text-xs text-gray-500 ml-3 mt-1">
                        Check-out
                    </Typography.Text>
                    <Typography.Title level={4} className="text-sm text-gray-500 py-0 px-0 ml-1 ">
                        <DatePicker
                            disabledDate={disabledEndDate}
                            value={dayjs(checkOutDate)}
                            onChange={(date: any) => setCheckOutDate(date.format('YYYY-MM-DD'))}
                            style={{ border: 0 }}
                            className="custom_date text-lg  font-bold"
                            format="DD MMM YYYY "
                            suffixIcon={null}
                            size="small"
                            defaultValue={dayAfterTomorrow}
                            allowClear={false}
                            inputReadOnly
                        />
                    </Typography.Title>
                    <Flex className="h-4 ">
                        <Typography.Text className="text-xs text-gray-500 ms-3 line-clamp-1">
                            {checkOutDate && getWeekday(checkOutDate)}
                        </Typography.Text>
                    </Flex>
                </Col>

                <Col
                    xs={12}
                    sm={24}
                    md={6}
                    lg={7}
                    className="w-full  border border-solid rounded-xl p-1"
                    onClick={showModal}
                >
                    <Typography.Text className="text-xs text-gray-500 mx-1 mt-1 md:ml-3 ml-3">
                        Rooms
                    </Typography.Text>
                    <Flex className="ml-3">
                        <Typography.Text className=" font-medium md:mx-1 md:ml-1  w-full mt-1 text-base">
                            {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                        </Typography.Text>
                    </Flex>
                    <Flex className="h-2">
                        <Typography.Text className="text-xs text-start text-gray-500  ms-3" />
                    </Flex>
                </Col>
                <Col
                    xs={11}
                    sm={24}
                    md={6}
                    lg={7}
                    className="w-full  border border-solid rounded-xl p-1"
                    onClick={showModal}
                >
                    <Typography.Text className="text-xs text-gray-500 mx-1 mt-1 md:ml-3 ml-3">
                        Guests
                    </Typography.Text>
                    <Flex className="ml-3">
                        <Typography.Text className=" font-medium md:mx-1 md:ml-1  w-full mt-1 text-base">
                            {totalCount} {totalCount === 1 ? 'Guest' : 'Guests'}
                        </Typography.Text>
                    </Flex>
                    <Flex className="h-2">
                        <Typography.Text className="text-xs text-start text-gray-500  ms-3" />
                    </Flex>
                </Col>

                {/* <Col xs={24} sm={24} md={4} lg={4} className="w-full m-2 lg:ml-4 ml-0">
                    <Button
                        danger
                        type="primary"
                        className="w-full h-12 font-medium mt-6 text-center px-4 lg:px-6 whitespace-nowrap"
                        onClick={handleClick}
                    >
                        Search Hotels
                    </Button>
                </Col> */}
                <Col xs={24} sm={24} md={7} className="w-full  border border-solid rounded-xl p-1 ">
                    <Flex className="flex-none text-xs text-gray-500 mt-1 ml-2">
                        <ReactSVG src={location} className="" />
                        <Paragraph className="text-xs ml-1 text-gray-500">City</Paragraph>
                    </Flex>
                    <SelectCity
                        options={cityOptions}
                        onSelect={handlecitySelect}
                        searchKey={searchText}
                        setSearchKey={setSearchText}
                        defaultvalue={defaultCityName}
                        textSize="xs:text-lg md:text-xl"
                        isCityLoading={isCityLoading}
                    />
                </Col>

                {/* <Col xs={24} sm={24} md={8} className="w-full m-2 py-0 ">
                    <Flex className="flex-none text-xs text-gray-500 mt-1 ml-3">
                        <ReactSVG src={location} className="" />
                        <Paragraph className="text-xs ml-1 text-gray-500">
                            Traveller Nationality{' '}
                        </Paragraph>
                    </Flex>
                  
                    <Input
                        type="text"
                        placeholder="Enter Nationality"
                        value="India"
                        maxLength={20}
                        variant="borderless"
                        className="w-full font-medium text-black h-10 md:ml-1 text-xl"
                        readOnly
                        disabled
                    />

                    <Flex className="h-2">
                        <Typography.Text className="text-xs text-start text-gray-500 mt-1 ms-3" />
                    </Flex>
                    <Col className="border-b-2 md:ms-3 mt-1 mr-3 md:mr-0" />
                </Col> */}

              <Button
                block
                onClick={handleClick}
                danger
                className="w-full h-16 mt-4  rounded-xl text-lg font-medium flex justify-center items-center"
                type="primary"
                size="large"
                icon={
                    <ReactSVG
                        src={MagnifyingGlass}
                        beforeInjection={svg =>
                            svg.setAttribute('style', 'width: 20px; height: 20px; fill: white; ')
                        }
                    />
                }
            >
                Search Hotels
            </Button>

            <Button
                className="h-11 px-6 mb-3 mt-2 rounded-lg font-small w-full border border-brandPrimary text-brandPrimary hover:bg-transparent hover:text-brandPrimary hover:border-brandPrimary bg-white"
                onClick={() =>
                    navigate(`${paths.hotels.index}/${paths.hotels.manageBookings}`, {
                        state: { initialActiveTab: '1' },
                    })
                }
            >
                Manage Booking
            </Button>
            </Row>
            {/* {
                screens.md?(
                    <></>
                ):(
                    <HotelsSmall/>
                )
            } */}
            {isModalOpen && (
                <BookModal
                    isModalOpen={isModalOpen}
                    handleCancel={handleCancel}
                    setRoomData={setRoomData}
                />
            )}
        </>
    );
};
export default BookingfieldsMobile;
