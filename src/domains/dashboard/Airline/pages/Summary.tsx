import { useCallback, useEffect, useMemo, useState } from 'react';

import { Grid } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { setPaymentData } from '@src/slices/payment';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { checkAgencyBalanceApi } from '../../payments/api';
import SessionExpiredModal from '../components/SessionExpiredModal';
import SummarySm from '../components/summary/summarySm/SummarySm';
import SummaryWeb from '../components/summary/summaryWeb/SummaryWeb';
import useDomesticRoundTrip from '../hooks/useDomesticRoundTrip';
import useSurchargeDetails from '../hooks/useSurchargeApi';
import useTraceIdTimer from '../hooks/useTraceIdTimer';
import { retrieveAirportName } from '../utils/airlineData';
import { retrieveFlightClass } from '../utils/getFlightClass';
import { tripMethods } from '../utils/options';

const { useBreakpoint } = Grid;

const Summary = () => {
    const dispatch = useDispatch();
    const screens = useBreakpoint();
    const navigate = useNavigate();

    const { paymentData, bookingData, searchData } = useAppSelector(state => state.reducer.airline);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    const isLcc = paymentData?.payload?.outbount?.isLcc ?? false;
    const isAirline = true;
    const timer = useTraceIdTimer(isLcc, isAirline);
    const { isDomesticRoundTrip } = useDomesticRoundTrip();
    const { getSurchargeData } = useSurchargeDetails();
    const [isLoading, setIsLoading] = useState(false);


    const handleBookNow = async () => {
        if (!paymentData) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
            );
            return;
        }

        // Block action if timer expired
        if (isLcc && timer.isPaymentExpired) {
            dispatch(
                showToast({
                    description: 'Payment time has expired. Please search again.',
                    variant: 'error',
                })
            );
            return;
        }
        if (!isLcc && timer.isExpired && !timer.bookingCompletedAt) {
            dispatch(
                showToast({
                    description: 'Booking time has expired. Please search again.',
                    variant: 'error',
                })
            );
            return;
        }
        if (!isLcc && timer.isPaymentExpired && timer.bookingCompletedAt) {
            dispatch(
                showToast({
                    description: 'Payment time has expired. Please search again.',
                    variant: 'error',
                })
            );
            return;
        }

        if (!paymentData?.payload) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
            );
            return;
        }

        const parseFlightDate = (d: string) => new Date(d.split('-').reverse().join('-'));
        const flightEventPayload: Record<string, any> = {
            from_city: searchData.fromLocation1,
            destination_city: searchData.toLocation1,
            depart_date: parseFlightDate(searchData.depart1),
            cabin_class: retrieveFlightClass(searchData.class),
            trip_type: tripMethods.find(t => t.value === searchData.tripType)?.label,
            number_passengers: searchData.adults + searchData.children + searchData.infants,
            airline: selectedAirline.journey[0]?.[0]?.Airline.AirlineName,
            fare: selectedAirline.price,
            airport_takeoff: retrieveAirportName(selectedAirline.journey[0]?.[0]?.Origin.Airport.AirportCode),
            airport_landing: retrieveAirportName(selectedAirline.journey[0]?.[selectedAirline.journey[0].length - 1]?.Destination.Airport.AirportCode),
            flight_number: selectedAirline.flightNumber,
            time_takeoff: selectedAirline.depart.datetime,
            time_landing: selectedAirline.arrive.datetime,
            total_amount: paymentData.totalAmount,
        };
        if (searchData.tripType === 2) flightEventPayload.return_date = parseFlightDate(searchData.arrive);
        if (searchData.tripType === 3) {
            flightEventPayload.from_city_multi = searchData.fromLocation;
            flightEventPayload.destination_city_multi = searchData.toLocation;
        }
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('flight_summary_confirmed', flightEventPayload);
        }

        const updatedPaymentData = {
            ...paymentData,
            payload: {
                ...paymentData.payload,
                accessKey: accessKeys.airline,
            },
        };

        setIsLoading(true);
        const success = await updatePaymentDataAndNavigate(updatedPaymentData);
        setIsLoading(false);
        if (!success) return; // block navigation if balance insufficient

        // Non-LCC legs are held by the payment endpoint immediately before ticketing, so both
        // fare types go straight to payment from here.
        navigate(paths.dashboard.payments);
    };

    // filter outbout and inbount ssr
    const findSSR = useCallback(
        (ssr: any, isOutbount: boolean) => {
            const journey = isOutbount ? selectedAirline.journey : selectedInbountAirline.journey;
            const filteredSSR = ssr.filter((currSSR: any) => {
                const { Destination, Origin } = currSSR;

                // check for fullJourney
                for (let i = 0; i < journey.length; i += 1) {
                    const currSegment = journey[i];
                    const firstSegment = currSegment[0];
                    const lastSegment = currSegment[currSegment.length - 1];

                    if (
                        firstSegment.Origin.Airport.AirportCode === Origin &&
                        lastSegment.Destination.Airport.AirportCode === Destination
                    ) {
                        return true;
                    }
                }

                // check individual segments
                const segments = journey.flat();
                for (let i = 0; i < segments.length; i += 1) {
                    const segment = segments[i];
                    if (
                        segment.Destination.Airport.AirportCode === Destination &&
                        segment.Origin.Airport.AirportCode === Origin
                    ) {
                        return true;
                    }
                }

                return false;
            });

            return filteredSSR;
        },
        [selectedAirline.journey, selectedInbountAirline.journey]
    );

    // for Domestic Round trip we need to make two api calls (one for inbount and one for outbount)
    // this function splits ssr and creates seperate passenger details
    const createSeperatePassengerDetails = useCallback(
        (passengerData: any, isOutbount: boolean) => {
            const newPassengerList = passengerData.map((newPassenger: any) => {
                const clonedPassenger = JSON.parse(JSON.stringify(newPassenger));
                clonedPassenger.Baggage = findSSR(clonedPassenger.Baggage, isOutbount);
                clonedPassenger.MealDynamic = findSSR(clonedPassenger.MealDynamic, isOutbount);
                clonedPassenger.SeatDynamic = findSSR(clonedPassenger.SeatDynamic, isOutbount);
                if (isOutbount) {
                    clonedPassenger.Fare = newPassenger.OutbountFare;
                } else {
                    clonedPassenger.Fare = newPassenger.InbountFare;
                }
                delete clonedPassenger.OutbountFare;
                delete clonedPassenger.InbountFare;
                return clonedPassenger;
            });
            return newPassengerList;
        },
        [findSSR]
    );
    const transformedPassengers = useMemo(() => {
        if (!paymentData?.payload?.outbount?.passengers) {
            return [];
        }
        return paymentData.payload.outbount.passengers.map(
            (p: { SeatDynamic: any; Baggage: any; MealDynamic: any }) => ({
                seatAmount: (p.SeatDynamic || []).reduce(
                    (sum: any, s: { Price: any }) => sum + (s.Price || 0),
                    0
                ),
                baggageAmount: (p.Baggage || []).reduce(
                    (sum: any, b: { Price: any }) => sum + (b.Price || 0),
                    0
                ),
                mealAmount: (p.MealDynamic || []).reduce(
                    (sum: any, m: { Price: any }) => sum + (m.Price || 0),
                    0
                ),
            })
        );
    }, [paymentData?.payload?.outbount?.passengers]);
    const updatePaymentDataAndNavigate = useCallback(
        async (data: any) => {
            if (!data?.payload?.outbount?.passengers) {
                return false;
            }
            const dataClone = JSON.parse(JSON.stringify(data));
            const passengerData = dataClone.payload.outbount.passengers;
            if (isDomesticRoundTrip) {
                // split passenger details
                const outBountPassengers = createSeperatePassengerDetails(passengerData, true);
                const inBountPassengers = createSeperatePassengerDetails(passengerData, false);
                dataClone.payload.outbount.passengers = outBountPassengers;
                dataClone.payload.inbount.passengers = inBountPassengers;
                dataClone.payload.outbount.userContactDetails = bookingData.customerInfo;
                dataClone.payload.inbount.userContactDetails = bookingData.customerInfo;
            } else {
                dataClone.payload.outbount.passengers = passengerData.map((passenger: any) => {
                    const newPassenger = structuredClone(passenger);
                    delete newPassenger.OutbountFare;
                    delete newPassenger.InbountFare;
                    return newPassenger;
                });
                dataClone.payload.outbount.userContactDetails = bookingData.customerInfo;
            }

            const hasPlatformFee = Array.isArray(dataClone.paymentSummary)
                ? dataClone.paymentSummary.some(
                      (item: { key?: string }) => item?.key === 'Platform fee (inclusive of GST)'
                  )
                : false;
            if (!hasPlatformFee) {
                const baseAmount =
                    Number(dataClone?.payload?.outbount?.amount) ||
                    Number(dataClone?.payload?.amount) ||
                    Number(dataClone?.totalAmount) ||
                    0;
                const surchargeData = await getSurchargeData(baseAmount);
                const platformFee = surchargeData?.surcharge
                    ? parseFloat(surchargeData.surcharge)
                    : 0;
                dataClone.paymentSummary = [
                    ...(dataClone.paymentSummary || []),
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString(platformFee)}`,
                    },
                ];
                dataClone.totalAmount = baseAmount + platformFee;
            }

            const isSufficient = await checkAgencyBalanceApi({
                userType: role,
                userId: id,
                amount: dataClone.payload.outbount.amount,
                passengers: transformedPassengers,
                traceId: dataClone.payload.outbount.TraceId,
            });

            if (!isSufficient) {
                return false;
            }
            dispatch(setPaymentData(dataClone));
            return true;
            // navigate(paths.dashboard.payments);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            isDomesticRoundTrip,
            bookingData.customerInfo,
            createSeperatePassengerDetails,
            dispatch,
            getSurchargeData,
        ]
    );

    useEffect(() => {
        if (!paymentData) {
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}`
            );
        }
    }, [paymentData, navigate]);

    return (
        <Content>
            {screens.md ? (
                <SummaryWeb
                    selectedAirline={selectedAirline}
                    selectedInbountAirline={selectedInbountAirline}
                    paymentData={paymentData}
                    handleBookNow={handleBookNow}
                    isLoading={isLoading}
                    timer={timer}
                    isLcc={isLcc}
                />
            ) : (
                <SummarySm
                    selectedAirline={selectedAirline}
                    selectedInbountAirline={selectedInbountAirline}
                    paymentData={paymentData}
                    handleBookNow={handleBookNow}
                    isLoading={isLoading}
                    timer={timer}
                    isLcc={isLcc}
                />
            )}

            <SessionExpiredModal
                open={timer.showExpiredModal}
                onGoBack={timer.handleGoBack}
            />
        </Content>
    );
};

export default Summary;
