import React, { useEffect, useState } from 'react';

import { Row } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PriceCardMobile from '../components/adaptive/PriceCardMobile';
import PriceFooter from '../components/adaptive/PriceFooter';
// import Ancillaries from '../components/ancillaries/Ancillaries';
// import useBooking from '../hooks/useBooking';
import Ancillaries from '../components/ancillaries/Ancillaries';
import useDomesticRoundTrip from '../hooks/useDomesticRoundTrip';
import useBasicInfoApi from '../hooks/useGetBasicInfo';
import useSurchargeDetails from '../hooks/useSurchargeApi';
import { setPaymentDetails } from '../slices/airlineSlice';
import { AllFareQuote } from '../types/fareRules';
import { retrieveAirlineName } from '../utils/airlineData';

type Props = {
    fareQuotes: AllFareQuote;
    handlePrevClick: () => void;
    handleClick: () => void;
};

type AccFare = {
    meal: number;
    baggage: number;
    seat: number;
};

const SeatSelectionPage = ({ handlePrevClick, handleClick, fareQuotes }: Props) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isSSRLoading, setSSRLoading] = useState(true);

    const { isDomesticRoundTrip } = useDomesticRoundTrip();
    const { getSurchargeData } = useSurchargeDetails();

    const {
        bookingData,
        selectedInbountAirline,
        selectedAirline: selectedAirlineData,
        TraceId,
    } = useAppSelector(state => state.reducer.airline);

    const [totals, setTotals] = useState(selectedAirlineData.price);

    const { data } = useBasicInfoApi();
    // const { bookingHandler } = useBooking();

    const handleBooking = async () => {
        const surchargeData = await getSurchargeData(totals);
        const { gstDetails } = bookingData;

        const passengerDataWithGst = bookingData.passengers.map(traveler => ({
            ...traveler,
            ...gstDetails,
        }));

        const requestBody = {
            ResultIndex: selectedAirlineData.ResultIndex,
            passengers: passengerDataWithGst,
            userContactDetails: bookingData.customerInfo,
            TraceId,
            // transactionId: new Date().valueOf(),
            isLcc: selectedAirlineData.lcc,
            amount: totals,
        };

        const inbountPayload = isDomesticRoundTrip
            ? {
                  ResultIndex: selectedInbountAirline.ResultIndex,
                  passengers: null, // will be set from summary page
                  userContactDetails: bookingData.customerInfo,
                  TraceId,
                  // transactionId: new Date().valueOf(),
                  isLcc: selectedInbountAirline.lcc,
                  amount: totals,
              }
            : null;

        const billSummary = [
            {
                key: 'Service name',
                value: 'Airline',
            },
            {
                key: 'Airline',
                value: retrieveAirlineName(selectedAirlineData.flightCode) ?? ' ',
            },
            {
                key: 'Company',
                value: data?.name ?? ' ',
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

        dispatch(
            setPaymentDetails({
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
            })
        );

        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}/${paths.airline.details}/${paths.airline.summary}`
        );
    };

    const { passengers } = bookingData;
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

    return (
        <Row className="w-full">
            <Ancillaries
                setShowSpinner={setSSRLoading}
                fareQuotes={fareQuotes}
                handleBooking={handleBooking}
            />
            <PriceCardMobile fareQuotes={fareQuotes} accFare={accFare} openFareRules={() => {}} />
            <PriceFooter price={totals ?? 0} handleClick={handleBooking} isLoading={isSSRLoading} />
        </Row>
    );
};

export default SeatSelectionPage;
