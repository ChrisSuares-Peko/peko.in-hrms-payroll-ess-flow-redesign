/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable react-hooks/exhaustive-deps */
import { createRef, useCallback, useEffect, useRef, useState } from 'react';

import { Button, Col, Divider, Flex, Grid, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikProps } from 'formik';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import DetailBookings from '@src/domains/dashboard/Hotels/Components/GuestDetails/DetailBookings';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ReceiverDetails from './ReceiverDetails';
import RoomDetails from './RoomDetails';
import Supplements from './Supplements';
import CheckoutTextRow from '../../../GiftCards/components/CheckoutTextRow';
import { employeeTypes } from '../../types/types';
import ShowTimer from '../ShowTimer';


const { Title } = Typography;

const { useBreakpoint } = Grid;

type ReceiverDetailsForm = {
    phone: string;
    phoneCode: string;
    email: string;
};

const UserDetailsWeb = ({
    employeesList,
    generateEmployeesDropdown,
    isLoading,
}: {
    employeesList: employeeTypes[];
     generateEmployeesDropdown: (data: employeeTypes[]) => {
        fullName: string;
        value: string;
        label: string;
        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        personalEmail: string;
        passportExpiryDate: string;
    }[];
    isLoading?: boolean;
}) => {
    const screens = useBreakpoint();
    const navigate = useNavigate();

    const {
        hotelsRequest,
    
        prebookResponse,
        netAmount,
        userdetails,
  
        supplements,
    } = useAppSelector(state => state.reducer.hotels);

    const { rooms } = hotelsRequest;
    const [totalForm, setTotalForm] = useState<string[]>([]);
    const location = useLocation();
    const [stateKey, setStateKey] = useState<string | undefined>(location.state?.key);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [enteredForm, setEnteredForm] = useState([]);


    // const [totalForm, setTotalForm] = useState<string[]>([]);
    const checkIn = new Date(hotelsRequest.CheckIn);
    const checkout = new Date(hotelsRequest.CheckOut);
    const timeDiff = checkout.getTime() - checkIn.getTime();
    const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const dispatch = useDispatch();
    useEffect(() => {
        // Update stateKey if the location.state changes
        if (location.state?.key) {
            setStateKey(location.state.key);
        }
    }, [location.state]);

    const transformedArray = rooms.map((item: any) => ({
        roomIndex: item.roomIndex,
        roomKey: `uniqueKey_${item.roomIndex}_${Date.now()}`, // Generating a unique key
    }));
    const totalPassengers = rooms.reduce(
        (count: any, room: any) => count + room.adult + room.child,
        0
    );
    const formRef = useRef(Array.from({ length: totalPassengers }, () => createRef()));
    const formRef1 = useRef<FormikProps<ReceiverDetailsForm>>(null);

    const renderPassengerCard = useCallback(
        (
            passengerType: any,
            roomIndex: any,
            bookingInfo: any,
            passengerKey: any,
            childAge: any,
            currentPassengerIndex: any,
            passengerCount: any
        ) => (
            <DetailBookings
                formRef={formRef.current[currentPassengerIndex]}
                passengerType={passengerType}
                passengerKey={passengerKey}
                key={`${roomIndex}-${passengerKey}`}
                roomKey={bookingInfo.roomKey}
                roomIndex={roomIndex}
                totalForm={totalForm}
                setTotalForm={setTotalForm}
                childAge={childAge}
                passengerCount={passengerKey}
                userdetails={userdetails}
                isLoading={isLoading}
                setEnteredForm={setEnteredForm}
                passengervalue={passengerCount}
                 data={employeesList}
                generateEmployeesDropdown={generateEmployeesDropdown}
            />
        ),
        [totalForm, employeesList, generateEmployeesDropdown, userdetails, isLoading]
    );

    let globalPassengerCounter = 0; 
    let globalAdultCounter = 1; 
    let globalChildCounter = 1; 

    const renderRoomCards = useCallback(
        () =>
            rooms.map((room: any, roomIndex: number) => {
                const bookingInfo = transformedArray[roomIndex];

                return (
                    <div key={roomIndex}>
                        {Array.from({ length: room.adult + room.child }, (_, idx) => {
                            const passengerType = idx < room.adult ? 'adult' : 'child';
                            const childAge =
                                passengerType === 'child'
                                    ? room.childAge[idx - room.adult]
                                    : undefined;

                            let passengerCount;
                            if (passengerType === 'adult') {
                                passengerCount = globalAdultCounter++; // Increment global adult counter
                            } else {
                                passengerCount = globalChildCounter++; // Increment global child counter
                            }

                            const passengerKey = idx + 1; // Local passenger key (used for form submission)
                            const currentPassengerIndex = globalPassengerCounter++; // Unique index for formRef

                            // Create a form reference for this passenger and ensure all passengers are tracked
                            formRef.current[currentPassengerIndex] =
                                formRef.current[currentPassengerIndex] || createRef();

                            // Render the passenger card, passing the correct passengerCount (for label) and other necessary data
                            return renderPassengerCard(
                                passengerType,
                                roomIndex,
                                bookingInfo,
                                passengerKey,
                                childAge,
                                currentPassengerIndex, // Unique index for formRef
                                passengerCount // Pass the passengerCount for correct label display
                            );
                        })}
                    </div>
                );
            }),
        [rooms, transformedArray, renderPassengerCard]
    );

  
    const handleFormSubmit = async () => {
        if (!stateKey) {
            setStateKey('formData');
        }

        const fullNamesSet = new Set();
        let hasDuplicates = false;

        // Check for duplicate guest names
        for (const ref of formRef.current as any) {
            if (ref?.current?.values) {
                const { firstName = '', lastName = '' } = ref.current.values;
                const fullName = `${firstName.trim().toLowerCase()}-${lastName.trim().toLowerCase()}`;
                if (fullName !== '-') {
                    if (fullNamesSet.has(fullName)) {
                        hasDuplicates = true;
                        break;
                    }
                    fullNamesSet.add(fullName);
                }
            }
        }

        if (hasDuplicates) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Duplicate name found: Guest names must be unique.',
                })
            );
            return;
        }

        let guestFormsHaveErrors = false;

   
        await Promise.all(
            formRef.current.map(async (ref: any, index: number) => {
                if (ref?.current?.validateForm) {
                    const errors = await ref.current.validateForm();

                
                    if (ref.current?.setTouched) {
                        const touchedFields = Object.keys(ref.current.values).reduce(
                            (acc: any, field) => {
                                acc[field] = true;
                                return acc;
                            },
                            {}
                        );
                        ref.current.setTouched(touchedFields);
                    }

                    if (Object.keys(errors).length > 0) {
                        guestFormsHaveErrors = true;
                       
                    }
                }
            })
        );

        let localReceiverErrors = false;

        if (formRef1.current?.validateForm) {
            const receiverErrors = await formRef1.current.validateForm();

            if (formRef1.current?.setTouched) {
                const touchedFields = Object.keys(formRef1.current.values).reduce(
                    (acc: any, field) => {
                        acc[field] = true;
                        return acc;
                    },
                    {}
                );
                formRef1.current.setTouched(touchedFields);
            }

            if (Object.keys(receiverErrors).length > 0) {
                localReceiverErrors = true;
            }
        }

        if (!guestFormsHaveErrors && !localReceiverErrors) {
      
            await Promise.all(
                formRef.current.map(async (ref: any) => {
                    if (ref?.current?.submitForm) {
                        await ref.current.submitForm();
                    }
                })
            );

            if (formRef1.current?.submitForm) {
                await formRef1.current.submitForm();
            }
                // Fire MoEngage event when guest info is confirmed
        if (typeof Moengage?.track_event === 'function') {
            let totalAdults = 0;
            let totalChildren = 0;
            rooms.forEach((room:any) => {
                totalAdults += room.adult || 0;
                totalChildren += room.child || 0;
            });
            const checkInDate = hotelsRequest.CheckIn ? new Date(hotelsRequest.CheckIn) : undefined;
            const checkOutDate = hotelsRequest.CheckOut ? new Date(hotelsRequest.CheckOut) : undefined;
            const stayLength =
                checkInDate && checkOutDate
                    ? Math.round(
                          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
                      )
                    : undefined;
            Moengage.track_event('hotel_guests_info', {
                room_numbers: rooms.length,
                city: hotelsRequest.cityName || hotelsRequest.City,
                adults: totalAdults,
                children: totalChildren,
                check_in: checkInDate,
                check_out: checkOutDate,
                stay_length: stayLength,
            });
        }

            navigate(paths.hotels.bookings, { state: { key: stateKey } });
        }
    };

   

    return (
        <>
            {screens.md ? (
                <Row className="mt-3" gutter={40}>
                    <Col xl={16} sm={24} xs={24}>
                        {renderRoomCards()}
                        <ReceiverDetails formRef={formRef1} />
                        {prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.Name?.map(
                            (item: any, index: number) => (
                                <RoomDetails
                                    key={index}
                                    meal={prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.MealType}
                                    name={item}
                                    // sqft={roomDetails.sqft}
                                    refund={
                                        prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.IsRefundable
                                    }
                                    cancellation={
                                        prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                            ?.CancelPolicies[0].FromDate
                                    }
                                    rateNotes={
                                        prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.Amenities
                                    }
                                    cancellationPolicy={
                                        prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.CancelPolicies
                                    }
                                    rateConditions={prebookResponse.HotelResult[0].RateConditions}
                                    Inclusion={
                                        prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.Inclusion
                                    }
                                    RoomPromotion={
                                        prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.RoomPromotion
                                    }
                                />
                            )
                        )}
                    </Col>
                    <Col xl={8} sm={24} className="w-full">
                        <Flex
                            vertical
                            className=" mt-7 py-6 px-7 rounded-[28px] border border-[#ececec] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
                        >
                              <ShowTimer/>

                            <Title level={5}>Total Amount</Title>
                            <Flex vertical className=" mt-4" gap={15}>
                                <CheckoutTextRow
                                    text={`Base Price (${nightDifference} ${nightDifference === 1 ? 'night' : 'nights'})`}
                                    value={formatNumberWithLocalString(netAmount.basePrice) || '0.00'}
                                />
                                {!!netAmount.tax && (
                                    <CheckoutTextRow
                                        text="Taxes and fees"
                                        value={formatNumberWithLocalString(netAmount.tax) || '0.00'}
                                    />
                                )}

                                <Divider className="m-0" />

                                <CheckoutTextRow
                                    text="Total (Tax Inclusive)"
                                    value={formatNumberWithLocalString(netAmount.totalFare)}
                                    bold
                                />
                                <div data-testid="continue">
                                    <Button
                                        danger
                                        type="primary"
                                        className="w-full font-medium px-5 h-11"
                                        onClick={handleFormSubmit}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </Flex>
                        </Flex>
                        <Supplements suppliments={supplements} />
                    </Col>
                </Row>
            ) : (
                <>
                    <Flex>
                        <Title level={4}> Guest Detail</Title>
                    </Flex>
                    <Row className="mt-5" gutter={16}>
                        <Col xl={17} sm={24}>
                            <Content>{renderRoomCards()}</Content>
                            <ReceiverDetails formRef={formRef1} />
                            <Col xl={17} sm={24} xs={24} style={{ padding: '0px' }}>
                                {prebookResponse.HotelResult?.[0]?.Rooms?.[0]?.Name?.map(
                                    (item: any, index: number) => (
                                        <RoomDetails
                                            key={index}
                                            meal={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.MealType
                                            }
                                            name={item}
                                            // sqft={roomDetails.sqft}
                                            refund={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.IsRefundable
                                            }
                                            cancellation={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.CancelPolicies[0].FromDate
                                            }
                                            rateNotes={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.Amenities
                                            }
                                            cancellationPolicy={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.CancelPolicies
                                            }
                                            rateConditions={
                                                prebookResponse.HotelResult[0].RateConditions
                                            }
                                            Inclusion={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.Inclusion
                                            }
                                            RoomPromotion={
                                                prebookResponse.HotelResult?.[0]?.Rooms?.[0]
                                                    ?.RoomPromotion
                                            }
                                        />
                                    )
                                )}
                            </Col>
                        </Col>
                        <Col sm={24} className="w-full">
                            <Flex
                                vertical
                                className=" md:mt-0 mt-5 py-6 px-7 rounded-[28px] border border-[#ececec] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
                            >
                                <Title level={5}>Total Amount</Title>
                                <Flex vertical className=" mt-4" gap={15}>
                                    <CheckoutTextRow
                                        text={`Base Price (${nightDifference} ${nightDifference === 1 ? 'night' : 'nights'})`}
                                        value={formatNumberWithLocalString(netAmount.basePrice) || '0.00'}
                                    />
                                    <CheckoutTextRow
                                        text="Tax"
                                        value={formatNumberWithLocalString(netAmount.tax) || '0.00'}
                                    />

                                    <Divider className="m-0" />

                                    <CheckoutTextRow
                                        text="Total (Tax Inclusive)"
                                        value={formatNumberWithLocalString(netAmount.totalFare)}
                                        bold
                                    />
                                </Flex>
                            </Flex>
                            <div data-testid="continue">
                                <Button
                                    danger
                                    type="primary"
                                    className="w-full font-medium px-5 h-11 mt-5"
                                    onClick={handleFormSubmit}
                                >
                                    Continue
                                </Button>
                            </div>
                        </Col>
                    </Row>

                </>
            )}
        </>
    );
};

export default UserDetailsWeb;
