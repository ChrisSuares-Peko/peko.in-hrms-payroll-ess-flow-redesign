import React, { useEffect, useState } from 'react';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { store } from '@src/store/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CheckoutTextRow from './CheckoutTextRow';
import FareRulesCard from './FareRulesCard';
// import Taxmodal from './Taxmodal';
import SessionExpiredModal from './SessionExpiredModal';
import useDomesticRoundTrip from '../hooks/useDomesticRoundTrip';
import useBasicInfoApi from '../hooks/useGetBasicInfo';
import useSurchargeDetails from '../hooks/useSurchargeApi';
import useTraceIdTimer from '../hooks/useTraceIdTimer';
import { setPaymentDetails } from '../slices/airlineSlice';
import { AllFareQuote } from '../types/fareRules';
import { retrieveAirlineName, retrieveAirportName } from '../utils/airlineData';
import { isMealBaggageRequired } from '../utils/ancillaries';
import { retrieveFlightClass } from '../utils/getFlightClass';
import { tripMethods } from '../utils/options';

type props = {
    formRef: React.MutableRefObject<any>;
    formDomRef: React.MutableRefObject<any>;
    formRef1: React.MutableRefObject<any>;
    formRef2: React.MutableRefObject<any>;
    contanctFormRef: React.MutableRefObject<any>;
    setIsLcc: (spin: boolean) => void;
    isLcc: boolean;
    fareQuotes: AllFareQuote;
    passengerIsValid: boolean[];
    setShowSpinner: (value: boolean) => void;
};

type AccFare = {
    meal: number;
    baggage: number;
    seat: number;
};

export default function PriceCard({
    formRef,
    formDomRef,
    formRef1,
    formRef2,
    contanctFormRef,
    isLcc,
    fareQuotes,
    setIsLcc,
    setShowSpinner,
    passengerIsValid,
}: props) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    // const [open, setOpen] = useState<boolean>(false);
    const { data } = useBasicInfoApi();
    const { isTwoLegBooking } = useDomesticRoundTrip();
    const isAirline=true
    const timer = useTraceIdTimer(isLcc,isAirline);

    const {
        selectedAirline: airlineData,
        selectedInbountAirline,
        TraceId,
        bookingData,
        formData: airlineFormData,
        isContactInfoValid,
        isGSTDetailsValid,
        searchData,
    } = useAppSelector(state => state.reducer.airline);

    const { passengers } = bookingData;

    const { RequiredFieldValidators } = fareQuotes.combined;

    const totalGuests =
        airlineFormData.passengerData.adultCount +
        airlineFormData.passengerData.childCount +
        airlineFormData.passengerData.infantCount;

    const { getSurchargeData, isLoading: isSurchargeLoading } = useSurchargeDetails();
    const handleBookNow = async () => {
        // isLCC will be false if it's the passenger form
        if (!isLcc) {
            // receiver details error auto scroll
            let error: any = null;
            for (let i = 0; i < formRef.current.length; i += 1) {
                const ref = formRef.current[i];
                // eslint-disable-next-line no-await-in-loop
                error = await ref.current.validateForm();
                if (Object.keys(error).length) {
                    formDomRef.current[i].current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    break;
                }
            }

            if (!Object.keys(error).length) {
                error = await formRef1.current.validateForm();
                if (Object.keys(error).length > 0) {
                    contanctFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            await Promise.all([
                ...formRef.current.map((ref: any) => ref.current.submitForm()),
                formRef1.current.submitForm(),
                formRef2.current?.submitForm(),
            ]);

            const invalidPassengers = passengerIsValid.filter(values => !values);
            const gstBlocks =
                (fareQuotes.combined.GSTAllowed ||
                    airlineData?.IsGSTMandatory ||
                    selectedInbountAirline?.IsGSTMandatory) &&
                !isGSTDetailsValid;

            if (invalidPassengers.length || !isContactInfoValid || gstBlocks) {
                return;
            }
        }

        const freshBookingData = store.getState().reducer.airline.bookingData;
        const passengersData = freshBookingData.passengers;
        const nameKey = (p: any) =>
            `${p.FirstName} ${p.LastName}`.trim().replace(/\s+/g, ' ').toLowerCase();

        for (let i = 0; i < passengersData.length; i += 1) {
            for (let j = i + 1; j < passengersData.length; j += 1) {
                const passenger1 = passengersData[i];
                const passenger2 = passengersData[j];
                if (nameKey(passenger1) === nameKey(passenger2)) {
                    dispatch(
                        showToast({
                            description:
                                "Two travellers can't have the same name on one booking. If they really do share a name, add a middle name or initial to tell them apart.",
                            variant: 'error',
                        })
                    );
                    return;
                }
                if (
                    passenger1.PassportNo &&
                    passenger2.PassportNo &&
                    passenger1.PassportNo === passenger2.PassportNo
                ) {
                    dispatch(
                        showToast({
                            description:
                                'Duplicate passport detected: Two passengers cannot have the same passport number.',
                            variant: 'error',
                        })
                    );
                    return;
                }
            }
        }

        const surchargeData = await getSurchargeData(totals);
        if (isLcc) {
            let isMealValid = true;
            let isSeatValid = true;
            let isBaggageValid = true;

            const isMealAndBaggageRequired = isMealBaggageRequired(
                airlineData,
                selectedInbountAirline
            );

            // for some flights (eg: Super 6E or SpiceMax) meal and seat is required
            if (RequiredFieldValidators?.IsMealRequired || isMealAndBaggageRequired) {
                for (let i = 0; i < passengersData.length; i += 1) {
                    const passenger = passengersData[i];
                    // segment length
                    if (passenger.MealDynamic.length === 0) {
                        isMealValid = false;
                    }
                }
            }

            if (isMealAndBaggageRequired) {
                for (let i = 0; i < passengersData.length; i += 1) {
                    const passenger = passengersData[i];
                    // PaxType 3 = infant; the UI shows them no baggage row.
                    if (passenger.PaxType !== 3 && passenger.Baggage.length === 0) {
                        isBaggageValid = false;
                    }
                }
            }

            if (RequiredFieldValidators?.IsSeatRequired) {
                for (let i = 0; i < passengersData.length; i += 1) {
                    const passenger = passengersData[i];
                    // segment length
                    // PaxType 3 = infant; the UI shows them no seat row.
                    if (passenger.PaxType !== 3 && passenger.SeatDynamic.length === 0) {
                        isSeatValid = false;
                    }
                }
            }

            const invalidSSRs = [];
            if (!isSeatValid) invalidSSRs.push('seat');
            if (!isMealValid) invalidSSRs.push('meal');
            if (!isBaggageValid) invalidSSRs.push('baggage');

            let errorMessage = 'Selection of ';
            if (invalidSSRs.length === 1) {
                errorMessage += invalidSSRs[0];
            } else if (invalidSSRs.length === 2) {
                errorMessage += `${invalidSSRs[0]} and ${invalidSSRs[1]}`;
            } else {
                errorMessage += `${invalidSSRs[0]}, ${invalidSSRs[1]} and ${invalidSSRs[2]}`;
            }

            errorMessage += ' is mandatory for this flight.';

            if (!isMealValid || !isSeatValid || !isBaggageValid) {
                dispatch(
                    showToast({
                        description: errorMessage,
                        variant: 'error',
                    })
                );
                return;
            }
        }

        // validating gstdetails
        const { gstDetails } = freshBookingData;
        const isAnyFieldFilled = Object.values(gstDetails).some(value => !!value);
        const isAllFieldFilled = Object.values(gstDetails).every(value => !!value);
        if (isAnyFieldFilled && !isAllFieldFilled) {
            dispatch(
                showToast({
                    description: 'Please provide complete GST details or leave the field blank.',
                    variant: 'error',
                })
            );
            return;
        }

        // add gst data in passenger details
        const passengerDataWithGst = freshBookingData.passengers.map(traveler => ({
            ...traveler,
            ...gstDetails,
        }));

        const requestBody = {
            ResultIndex: airlineData.ResultIndex,
            passengers: passengerDataWithGst,
            userContactDetails: freshBookingData.customerInfo,
            TraceId,
            // transactionId: new Date().valueOf(),
            isLcc: airlineData.lcc,
            amount: totals,
            // Only non-LCC legs are held at payment time. ResultIndex is scoped to one search,
            // so the journey is what lets the backend match an existing hold for this itinerary.
            ...(airlineData.lcc ? {} : { itinerary: airlineData.journey ?? [] }),
        };

        // Domestic round trip AND multi-city both carry a second, independently-booked leg.
        const inbountPayload = isTwoLegBooking
            ? {
                  ResultIndex: selectedInbountAirline.ResultIndex,
                  passengers: null, // will be set from summary page
                  userContactDetails: freshBookingData.customerInfo,
                  TraceId,
                  // transactionId: new Date().valueOf(),
                  isLcc: selectedInbountAirline.lcc,
                  amount: totals,
                  ...(selectedInbountAirline.lcc
                      ? {}
                      : { itinerary: selectedInbountAirline.journey ?? [] }),
              }
            : null;

        const billSummary = [
            {
                key: 'Service name',
                value: 'Airline',
            },
            {
                key: 'Airline',
                value: retrieveAirlineName(airlineData.flightCode) ?? ' ',
            },
            {
                key: 'Company',
                value: data?.name ?? 'NA',
            },
        ];

        const paymentSummary = [
            {
                key: 'Base amount',
                value: `₹ ${formatNumberWithLocalString(totals)}`,
            },
            {
                key: 'Platform fee (inclusive of GST)',
                value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
            },
        ];
        const platformFee = surchargeData?.surcharge
            ? parseFloat(surchargeData.surcharge)
            : 0;
        const totalAmount = (Number(totals) || 0) + platformFee;

        const paymentData = {
            billSummary,
            paymentSummary,
            passengerDetails: requestBody.passengers,
            totalAmount,
            title: 'Bill Summary',
            payload: {
                outbount: requestBody,
                inbount: inbountPayload,
            },
            inbountPayload,
            url: 'travel/flight/payment',
        };

        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        sessionStorage.setItem(
            'service_details',
            JSON.stringify({
                serviceDetails: {
                    from_city: searchData.fromLocation1,
                    destination_city: searchData.toLocation1,
                    depart_date: new Date(searchData.depart1.split('-').reverse().join('-')),
                    ...(searchData.tripType === 2 && { return_date: new Date(searchData.arrive.split('-').reverse().join('-')) }),
                    cabin_class: retrieveFlightClass(searchData.class),
                    trip_type: tripMethods.find(t => t.value === searchData.tripType)?.label,
                    number_passengers: searchData.adults + searchData.children + searchData.infants,
                    ...(searchData.tripType === 3 && {
                        from_city_multi: searchData.fromLocation,
                        destination_city_multi: searchData.toLocation,
                    }),
                    airline: airlineData.journey[0]?.[0]?.Airline.AirlineName,
                    fare: airlineData.price,
                    airport_takeoff: retrieveAirportName(airlineData.journey[0]?.[0]?.Origin.Airport.AirportCode),
                    airport_landing: retrieveAirportName(airlineData.journey[0]?.[airlineData.journey[0].length - 1]?.Destination.Airport.AirportCode),
                    flight_number: airlineData.flightNumber,
                    time_takeoff: airlineData.depart.datetime,
                    time_landing: airlineData.arrive.datetime,
                    total_amount: totalAmount,
                },
            })
        );

        dispatch(setPaymentDetails(paymentData));

        if (!isLcc) {
            setIsLcc(true);
            setShowSpinner(true);
            return;
        }

        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}/${paths.airline.summary}`
        );
    };

    const priceWithoutTax = Number(fareQuotes.combined.Fare.BaseFare);
    const [totals, setTotals] = useState(airlineData.price);
    const [accFare, setAccFare] = useState<AccFare>({
        meal: 0,
        baggage: 0,
        seat: 0,
    });
    useEffect(() => {
        // Calculate ancillary
        let total = fareQuotes.combined.Fare.PublishedFare;
        const ssrFares = passengers.reduce(
            (acc: AccFare, passenger) => {
                passenger.MealDynamic.forEach(meal => {
                    acc.meal += meal.Price;
                });
                passenger.Baggage.forEach(baggage => {
                    acc.baggage += baggage.Price;
                });
                passenger.SeatDynamic.forEach(seat => {
                    acc.seat += seat.Price;
                });

                return acc;
            },
            {
                meal: 0,
                baggage: 0,
                seat: 0,
            }
        );
        total += (ssrFares.meal || 0) + (ssrFares.baggage || 0) + (ssrFares.seat || 0);
        // Set ancillary to state
        setTotals(total);
        setAccFare(ssrFares);
    }, [passengers, fareQuotes.combined.Fare.PublishedFare]);

    function isDecimalPresent(num: number) {
        return !(num === Math.trunc(num));
    }
    const formattedTotal = isDecimalPresent(totals) ? formatNumberWithLocalString(totals) : totals;
    return (
        <Col xl={7} className="flex flex-col gap-5 justify-start w-full mx-0">
            <Flex
                vertical
                className="p-6 mt-5 border justify-between border-[#f0f0f0] rounded-[28px] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)] md:mt-0"
            >
                {/* Timer Display */}
                {timer.searchInitiatedAt && !timer.isExpired && !timer.isPaymentExpired && (
                    <Flex
                        vertical
                        align="center"
                        className="mb-4 p-4 bg-gray-100 rounded-lg"
                    >
                        <ClockCircleOutlined className="text-gray-600 text-xl mb-2" />
                        <Typography.Text className="text-xs text-gray-600 mb-1">
                            {(() => {
                                if (isLcc) {
                                    return 'Complete payment in';
                                }
                                if (!timer.bookingCompletedAt) {
                                    return 'Complete booking in';
                                }
                                return 'Complete payment in';
                            })()}
                        </Typography.Text>
                        <Typography.Text className="text-2xl font-bold text-black">
                          {timer.formatTime(timer.timeRemaining)}
                        </Typography.Text>
                    </Flex>
                )}
                <Typography.Title level={5}>Total Amount</Typography.Title>
                <Flex vertical className="mt-4 " gap={15}>
                    <CheckoutTextRow
                        text={`Base fare (${totalGuests} traveller${totalGuests > 1 ? 's' : ''})`}
                        value={formatNumberWithLocalString(priceWithoutTax)}
                    />

                    {accFare.seat ? (
                        <CheckoutTextRow
                            text="Seat"
                            value={formatNumberWithLocalString(accFare.seat)}
                        />
                    ) : (
                        ''
                    )}
                    {accFare.meal ? (
                        <CheckoutTextRow
                            text="Meal"
                            value={formatNumberWithLocalString(accFare.meal)}
                        />
                    ) : (
                        ''
                    )}
                    {accFare.baggage ? (
                        <CheckoutTextRow
                            text="Baggage"
                            value={formatNumberWithLocalString(accFare.baggage)}
                        />
                    ) : (
                        ''
                    )}

                    <CheckoutTextRow
                        text="Taxes and fees"
                        // info={<QuestionCircleOutlined className="mb-1" onClick={handleOpen} />}
                        value={formatNumberWithLocalString(fareQuotes.combined.Fare.Tax)}
                    />

                    <CheckoutTextRow
                        text="Other charges"
                        // info={<QuestionCircleOutlined className="mb-1" onClick={handleOpen} />}
                        value={formatNumberWithLocalString(fareQuotes.combined.Fare.OtherCharges)}
                    />

                    <Divider className="m-0" />

                    <CheckoutTextRow text="Total" value={formatNumberWithLocalString(formattedTotal)} bold />
                    <Button
                        danger
                        type="primary"
                        className="w-full h-10 px-5 font-medium "
                        onClick={async () => {
                            handleBookNow();
                        }}
                        // Disable button when loading
                        loading={isSurchargeLoading}
                    >
                        Continue
                    </Button>
                </Flex>
            </Flex>
            <FareRulesCard isRefundable={!!fareQuotes.combined.IsRefundable} />
            {/* {open && fareQuotes && (
                <Taxmodal
                    handleCancel={() => setOpen(false)}
                    open={open}
                    taxValues={fareQuotes.Fare.TaxBreakup}
                    totalTax={fareQuotes.Fare.Tax}
                />
            )} */}
            <SessionExpiredModal
                open={timer.showExpiredModal}
                onGoBack={timer.handleGoBack}
            />
        </Col>
    );
}
