import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getOneWaySearch } from '../api';
import {
    setAirlineData,
    setfilghtResponse,
    setInbountFlightResponse,
    setPriceRange,
    setTraceId,
} from '../slices/airlineSlice';
import { Flight } from '../types/Flight';
import { findLastSegment } from '../utils/getFlightClass';

export const useGetOneWaySearch = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [searchData, setSearchData] = useState<Flight[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [inboutFlights, setInbountFlights] = useState<Flight[]>([]);
    const [noResult, setNoResult] = useState<boolean>(false);
    const [filterCount, setFilterCount] = useState<{ lowestPrice: number; highestPrice: number }>({
        lowestPrice: Infinity,
        highestPrice: -Infinity,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const getOneWaySearchHandler = async (tripDetails: {}) => {
        setIsLoading(true);
        setNoResult(false);
        const data: any | false = await getOneWaySearch({
            userId: id,
            userType: role,
            tripDetails,
        });

        if (data) {
            dispatch(setTraceId(data.TraceId));
            dispatch(setAirlineData(data));
            const resData: Flight[] = formatFlightData(data.Results[0]);
            const domesticInbount: Flight[] = formatFlightData(data.Results[1]);
            dispatch(setfilghtResponse(resData));
            dispatch(setInbountFlightResponse(domesticInbount));

            if (resData.length === 0) setNoResult(true);
            setSearchData(resData);
            setInbountFlights(domesticInbount);
            const prices = [...resData, ...domesticInbount].map(flight => flight.price);

            const lowestPrice = Math.min(...prices);
            const highestPrice = Math.max(...prices);
            dispatch(setPriceRange({ lowestPrice, highestPrice }));
            setFilterCount({
                lowestPrice: lowestPrice === Infinity ? 0 : lowestPrice,
                highestPrice: highestPrice === -Infinity ? 0 : highestPrice,
            });
            setIsLoading(false);

            return {
                outbount: resData,
                inbount: domesticInbount,
            };
        }
        setNoResult(true);
        setIsLoading(false);
        return null;
    };

    return {
        searchHandler: getOneWaySearchHandler,
        data: searchData,
        filterCount,
        isLoading,
        noResult,
    };
};

const formatFlightData = (data: any) => {
    if (!data || data.length === 0) return [];

    // const filteredData = data.filter((item: any) => item.IsLCC === false);

    const resData: Flight[] = data.map((item: any, index: number) => ({
        id: index.toString(),
        logo: `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${item.Segments[0][0].Airline.AirlineCode}.gif?alt=media`,
        flightName: '',
        flightClass: item.Segments[0][0].CabinClass,
        flightDuration:
            item.Segments[0].length === 1
                ? item.Segments[0][0].Duration || 0
                : item.Segments[0][item.Segments[0].length - 1]?.AccumulatedDuration || 0,
        stopCount: item.Segments[0].length - 1,
        depart: {
            datetime: item.Segments[0][0].Origin.DepTime,
        },
        arrive: {
            datetime: findLastSegment(item.Segments[0]).Destination.ArrTime,
        },
        onPoint: item.Segments[0][0].Origin.Airport.AirportCode,
        offPoint: findLastSegment(item.Segments[0]).Destination.Airport.AirportCode,
        journey: item.Segments,
        flightKey: item.Segments[0][0].Airline.FlightNumber,
        flightCode: item.Segments[0][0].Airline.AirlineCode,
        baggageAllowance: item.Segments[0][0].Baggage,
        seatsAvailable: Math.min(
            ...item.Segments[0].map((seg: any) => seg.NoOfSeatAvailable ?? 99)
        ),
        fareInclusions: item.FareInclusions || [],
        fareType: item.ResultFareType || '',
        isRefundable: item.IsRefundable,
        miniFareRules: item.MiniFareRules?.[0] || [],
        offeredFare: item.Fare.OfferedFare,
        publishedFare: item.Fare.PublishedFare,
        totalTax: item.Fare.Tax,
        lcc: item.IsLCC,
        isGSTMandatory: item.IsGSTMandatory,
        price: item.Fare.PublishedFare,
        flightNumber: item.Segments[0][0].Airline.FlightNumber,
        operatingAirline: item.Segments[0][0].Airline.AirlineCode,
        ResultIndex: item.ResultIndex,
        IsPanRequiredAtBook: item.IsPanRequiredAtBook || item.IsPanRequiredAtTicket,
        IsPassportRequiredAtBook: item.IsPassportRequiredAtBook || item.IsPassportRequiredAtTicket,
        IsPassportFullDetailRequiredAtBook: item.IsPassportFullDetailRequiredAtBook,
        IsGSTMandatory: item.IsGSTMandatory,
        GSTAllowed: item.GSTAllowed,
        FareClassification: item.FareClassification,
    }));
    return resData;
};
