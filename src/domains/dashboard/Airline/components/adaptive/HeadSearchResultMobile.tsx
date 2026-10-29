import { useEffect, useState } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Badge, Col, Row, Typography, Button, Flex } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import EditOutlined from '../../assets/icons/edit.svg';
import useHandleAirlineSearch from '../../hooks/useHandleAirlineSearch';
import { ITripData } from '../../types/airlineTypes';
import { retrieveAirportName } from '../../utils/airlineData';
import { retrieveFlightClass } from '../../utils/getFlightClass';

type props = {
    setFlightResData: any;
    setFlightData: any;
    setInboutFlights: any;
    setIsloading: any;
    setFilterCount: any;
    setProgress: any;
    isLoading: boolean;
    searchHandler: any;
    filterCount: any;
    setSearchParams?: (params: any) => void;
    onSearchComplete?: (tripData: any) => void;
};
function HeadSearchResultMobile({
    setFilterCount,
    setFlightResData,
    setIsloading,
    setFlightData,
    setInboutFlights,
    setProgress,
    isLoading,
    searchHandler,
    filterCount,
    setSearchParams,
    onSearchComplete,
}: props) {
    const navigate = useNavigate();
    const airlineFormData = useAppSelector(state => state.reducer.airline.formData);
    const airlineSearchData: ITripData = useAppSelector(state => state.reducer.airline.searchData);
    const { xs, sm } = useScreenSize();
    const { handleAirlineSearch } = useHandleAirlineSearch();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [tripData, setTripData] = useState<ITripData>({
        tripType: airlineSearchData.tripType,
        fromLocation: airlineSearchData?.fromLocation ?? '',
        toLocation: airlineSearchData?.toLocation ?? '',
        depart: airlineSearchData?.depart ?? '',
        departDay: airlineSearchData?.departDay ?? '',
        arrive: airlineSearchData?.arrive ?? '',
        arriveDay: airlineSearchData?.arriveDay ?? '',
        fromLocation1: airlineSearchData?.fromLocation1 ?? '',
        toLocation1: airlineSearchData?.toLocation1 ?? '',
        depart1: airlineSearchData?.depart1 ?? '',
        departDay1: airlineSearchData?.departDay1 ?? '',
        arrive1: airlineSearchData?.arrive1 ?? '',
        arriveDay1: airlineSearchData?.arriveDay1 ?? '',
        adults: airlineSearchData?.adults ?? '',
        children: airlineSearchData?.children ?? '',
        infants: airlineSearchData?.infants ?? '',
        class: airlineSearchData?.class ?? '',
        destinationCountryCode: airlineSearchData?.destinationCountryCode ?? '',
        originCountryCode: airlineSearchData?.originCountryCode ?? '',
    });

    const handleSearch = async () => {
        setProgress(0);
        setIsloading(true);
        const search = handleAirlineSearch(tripData);
        if (search.status) {
            // Fire fare calendar in parallel — does not block the main search
            if (onSearchComplete) {
                onSearchComplete(tripData);
            }
            const res = await searchHandler(search.data);
            setFlightData(res.outbount);
            setFlightResData(res.outbount);
            setInboutFlights(res.inbount);
            // Store search parameters used for current results
            if (setSearchParams) {
                // Only include arrive date if tripType is round trip (2)
                const params: any = {
                    tripType: tripData.tripType,
                    fromLocation1: tripData.fromLocation1,
                    toLocation1: tripData.toLocation1,
                    depart1: tripData.depart1,
                    originCountryCode: tripData.originCountryCode,
                    destinationCountryCode: tripData.destinationCountryCode,
                };
                // Only include arrive if it's a valid date and tripType is round trip
                if (tripData.tripType === 2 && tripData.arrive) {
                    params.arrive = tripData.arrive;
                }
                setSearchParams(params);
            }
        }
    };

    useEffect(() => {
        setIsloading(isLoading);
        setFilterCount({
            lowestPrice: filterCount.lowestPrice === Infinity ? 0 : filterCount.lowestPrice,
            highestPrice: filterCount.highestPrice === -Infinity ? 0 : filterCount.highestPrice,
        });
    }, [filterCount, isLoading, setFilterCount, setIsloading]);

    useEffect(() => {
        if (xs || sm) {
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xs, sm]);

    const totalNumberOfPassengers =
        airlineFormData.passengerData.adultCount +
        airlineFormData.passengerData.childCount +
        airlineFormData.passengerData.infantCount;

    return (
        <Flex vertical gap={10} justify="space-between">
            <Row
                className="rounded-2xl px-3 w-full bg-[#F4F6FA]"
                align="middle"
                justify="space-between"
            >
                <Col span={20} className="py-2 xs375:py-4">
                    <Typography.Text className="font-semibold text-xs xs375:text-[0.75rem]">
                        {airlineFormData.flightSegments[0].Origin}{' '}
                        <Typography.Text className="font-normal text-[0.45rem] xs375:text-[0.6rem]">
                            {retrieveAirportName(airlineFormData.flightSegments[0].Origin)}{' '}
                        </Typography.Text>
                        <ArrowRightOutlined className="mx-[0.1rem] xs375:mx-1 text-[0.6rem] xs375:text-[0.75rem]" />{' '}
                        {airlineFormData.flightSegments[0].Destination}{' '}
                        <Typography.Text className="font-normal text-[0.45rem] xs375:text-[0.6rem]">
                            {retrieveAirportName(airlineFormData.flightSegments[0].Destination)}{' '}
                        </Typography.Text>
                    </Typography.Text>
                    <Typography.Paragraph className="font-normal text-[.55rem] xs375:text-[0.68rem] text-gray-400 whitespace-nowrap capitalize flex items-center">
                        {dayjs(
                            airlineFormData.flightSegments[0].PreferredDepartureTime,
                            'YYYY-MM-DD'
                        ).format('ddd, MMM D')}
                        <Badge dot color="#8F8F8F" className="mx-1" size="small" />
                        {totalNumberOfPassengers}{' '}
                        {Number(totalNumberOfPassengers) > 1 ? 'Passengers' : 'Passenger'}
                        <Badge dot color="#8F8F8F" className="mx-1" size="small" />
                        {retrieveFlightClass(airlineFormData.flightSegments[0].FlightCabinClass)}
                    </Typography.Paragraph>
                </Col>
                <Col span={4} className="flex justify-end">
                    <Button
                        type="default"
                        size="middle"
                        className="w-full flex justify-center items-center rounded-lg"
                        danger
                        icon={<ReactSVG src={EditOutlined} />}
                        onClick={() => navigate(`${paths.dashboard.corporateTravel}`)}
                    />
                </Col>
            </Row>
        </Flex>
    );
}

export default HeadSearchResultMobile;
