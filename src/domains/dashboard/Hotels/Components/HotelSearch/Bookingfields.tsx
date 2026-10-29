/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { Button, Col, DatePicker, Flex, Row, Typography } from 'antd';
import Paragraph from 'antd/es/typography/Paragraph';
import dayjs from 'dayjs';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import calendarHotelIcon from '@domains/dashboard/Hotels/Assets/icons/calender_hotel.svg';
import locationHotelIcon from '@domains/dashboard/Hotels/Assets/icons/location_hotel.svg';
import BookModal from '@src/domains/dashboard/Hotels/Components/GuestInfoModal/Modal';
import '@domains/dashboard/Hotels/styles/home.css';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import MagnifyingGlass from '../../Assets/icons/MagnifyingGlass.svg';
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

const Bookingfields = () => {
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

    const [selectedCityName, setSelectedCityName] = useState<string | undefined>(undefined);
    const [defaultCityName, setDefaultCityName] = useState<string | undefined>(undefined);

    const [selectedCountryName, setSelectedCountryName] = useState<string>('IN');
    const tomorrow = dayjs().add(1, 'day');
    const dayAfterTomorrow = tomorrow.add(1, 'day');
    const [checkInDate, setCheckInDate] = useState<any>(tomorrow);
    const [checkOutDate, setCheckOutDate] = useState<any>(dayAfterTomorrow);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [nationality, selectedNationality] = useState<string>('IN');
  
    const { hotelsList } = useSearchApi();

    const disabledDate = (current: any) => current && current < moment().startOf('day');
   
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
               const totalAdults = hotelsRequest.rooms.reduce(
                (sum: any, item: any) => sum + item.adult,
                0
            );
            const totalChildren = hotelsRequest.rooms.reduce(
                (sum: any, item: any) => sum + item.child,
                0
            );

            // Moengage event tracking
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event('hotel_search_started', {
                    city: defaultCityName,
                    check_in: new Date(checkInData),
                    check_out: new Date(checkoutData),
                    rooms: hotelsRequest.rooms.length,
                    adults: totalAdults,
                    children: totalChildren,
                });
            }
            navigate(`${paths.hotels.index}/${paths.hotels.details}`, {
                state: { key: 'searchHotels' },
            });
        }
    };

      const boxStyle =
        'border border-gray-200 rounded-[12px] mt-3 mb-2 px-4 py-2 h-[55px] flex flex-col justify-center relative hover:border-brandMuted transition-colors bg-white cursor-pointer';
    const labelStyle = 'flex-none text-sm mb-4 text-black font-medium ml-1 block';
    const subtextStyle = 'text-xs text-gray-500 line-clamp-1 mt-1 font-medium';
    // Icon color: Purple
    const iconColor = '#7C3AED';

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
            <Row className="w-full">

                 <Col xs={24} sm={24} md={24} lg={24} className="w-full m-2 py-0">
                     <Flex justify="end" className="">
                    <Button
                        className="h-11 px-6 rounded-lg font-small border border-brandPrimary text-brandPrimary hover:bg-transparent hover:text-brandPrimary hover:border-brandPrimary bg-white"
                        onClick={() =>
                            navigate(`${paths.hotels.index}/${paths.hotels.manageBookings}`, {
                                state: { initialActiveTab: '1' },
                            })
                        }
                    >
                        Manage Booking
                    </Button>
                </Flex>
                </Col>


                <Col xs={24} sm={24} md={8} lg={7} className="w-full m-2 -mt-1 py-0">

                     <Flex vertical className="flex-auto relative z-9 min-w-0">
                        <Paragraph className={labelStyle}>Location</Paragraph>
                        <Flex className={`${boxStyle} w-full`}>
                            <Flex align="center" gap={0}>
                                <ReactSVG
                                    src={locationHotelIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute(
                                            'style',
                                            `width: 24px; height: 24px; color: ${iconColor};`
                                        );
                                    }}
                                />
                                <div className="flex-1 w-full">
                                    <SelectCountry
                        options={countryOptions}
                        onSelect={handleCountrySelect}
                        searchKey={searchText}
                        setSearchKey={setSearchText}
                        defaultvalue={selectedCountryName}
                        textSize="text-xl"
                        placeholder="Enter Country"
                    />
                                </div>
                            </Flex>
                        </Flex>
                    </Flex>
                </Col>
                <Col xs={12} sm={12} md={7} lg={4} className="w-full -mt-1 m-2">


                        <div className="flex-1 min-w-0">
                        <Paragraph className={labelStyle}>Check In</Paragraph>
                        <div className={`${boxStyle} w-full`}>
                            <Flex align="center" gap={12}>
                                <ReactSVG
                                    src={calendarHotelIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute(
                                            'style',
                                            `width: 20px; height: 20px; color: ${iconColor};`
                                        );
                                    }}
                                />
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex flex-col">
                                      
                           <DatePicker
                                            disabledDate={disabledDate}
                                            onChange={(date: any) => {
                                                const checkIn = date.format('YYYY-MM-DD');
                                               
                                                if (!dayjs(checkOutDate).isAfter(dayjs(checkIn), 'day')) {
                                                    const checkOut = dayjs(checkIn)
                                                        .add(1, 'day')
                                                        .format('YYYY-MM-DD');
                                                    setCheckOutDate(checkOut);
                                                }
                                                setCheckInDate(checkIn);
                                            }}
                                            value={dayjs(checkInDate)}
                                            style={{
                                                padding: 0,
                                                border: 'none',
                                                background: 'transparent',
                                            }}
                                            className="custom_date text-xl font-bold w-full leading-none p-0"
                                            format="DD MMM' YY"
                                            suffixIcon={null}
                                            allowClear={false}
                                            inputReadOnly
                                            bordered={false}
                                            superPrevIcon={null}
                                            superNextIcon={null}
                                            popupClassName="custom-datepicker-styled custom-datepicker-left"
                                            getPopupContainer={trigger =>
                                                (trigger.closest('.relative') as HTMLElement) ||
                                                document.body
                                            }
                                        />
                                        <Typography.Text className={subtextStyle}>
                                            {checkInDate && getWeekday(checkInDate)}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </Flex>
                        </div>
                    </div>
                </Col>

                <Col xs={12} sm={12} md={7} lg={4} className="w-full -mt-1 m-2 ">


                       <div className="flex-1 min-w-0">
                        <Paragraph className={labelStyle}>Check Out</Paragraph>
                        <div className={`${boxStyle} w-full`}>
                            <Flex align="center" gap={12}>
                                <ReactSVG
                                    src={calendarHotelIcon}
                                    beforeInjection={svg => {
                                        svg.setAttribute(
                                            'style',
                                            `width: 20px; height: 20px; color: ${iconColor};`
                                        );
                                    }}
                                />
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex flex-col">
                                        <DatePicker
                                            disabledDate={disabledEndDate}
                                            value={dayjs(checkOutDate)}
                                            onChange={(date: any) =>
                                                setCheckOutDate(date.format('YYYY-MM-DD'))
                                            }
                                            style={{
                                                padding: 0,
                                                border: 'none',
                                                background: 'transparent',
                                            }}
                                            className="custom_date text-xl font-bold w-full leading-none p-0"
                                            format="DD MMM' YY"
                                            suffixIcon={null}
                                            allowClear={false}
                                            inputReadOnly
                                            bordered={false}
                                            superPrevIcon={null}
                                            superNextIcon={null}
                                            popupClassName="custom-datepicker-styled custom-datepicker-left"
                                            getPopupContainer={trigger =>
                                                (trigger.closest('.relative') as HTMLElement) ||
                                                document.body
                                            }
                                        />
                                        <Typography.Text className={subtextStyle}>
                                            {checkOutDate && getWeekday(checkOutDate)}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </Flex>
                        </div>
                    </div>
                </Col>

                <Col xs={24} sm={24} md={24} lg={7} className="w-full m-2 -mt-1 py-0" onClick={showModal}>
                 
                      <Flex vertical className="flex-1 min-w-0">
                        <Paragraph className={labelStyle}>Guests</Paragraph>
                        <Flex className={`${boxStyle} w-full`} onClick={showModal}>
                            <Flex align="center" gap={12}>
                                <div className="flex-1 w-full flex flex-col justify-center">
                                   <Typography.Text
                            className=" font-medium md:mx-1 md:ml-1  w-full mt-2"
                            style={{ fontSize: '19px' }}
                        >
                            {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'},&nbsp;
                            {totalCount} {totalCount === 1 ? 'Guest' : 'Guests'}
                            <br />
                        </Typography.Text>
                                    {/* <Text className={subtextStyle}>
                                            Tap to add guests
                                      </Text> */}
                                </div>
                            </Flex>
                        </Flex>
                    </Flex>
                </Col>

              
                <Col xs={24} sm={24} md={7} className="w-full m-2 mt-2 py-0 ">
                
                       <Flex vertical className="flex-1 min-w-0">
                        <Paragraph className={labelStyle}>City</Paragraph>
                        <Flex className={`${boxStyle} w-full mt-1 mb-0`}>
                          <SelectCity
                        options={cityOptions}
                        onSelect={handlecitySelect}
                        searchKey={searchText}
                        setSearchKey={setSearchText}
                        defaultvalue={defaultCityName}
                        textSize="xs:text-lg md:text-xl"
                        isCityLoading={isCityLoading}
                    />
                        </Flex>
                    </Flex>
                </Col>
               

                <Col xs={24} sm={24} md={5} lg={5} xxl={4} className="w-full mt-2 md:mt-11">
                    <Button
                        onClick={handleClick}
                        danger
                        className="w-full md:max-w-[192px] xxl:max-w-[208px] h-12 flex justify-center md:ml-4 items-center rounded-md"
                        type="primary"
                        size="middle"
                    >
                          <ReactSVG
                                src={MagnifyingGlass}
                                beforeInjection={svg =>
                                    svg.setAttribute(
                                        'style',
                                        'width: 20px; height: 20px; fill: white'
                                    )
                                }
                            />
                            Search Hotels
                    </Button>
                </Col>
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
export default Bookingfields;
