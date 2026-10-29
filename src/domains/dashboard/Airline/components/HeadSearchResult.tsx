/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { Button, Col, Row } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { store } from '@src/store/store';

import AirlineSearchForm from './searchResult/AirlineSearchForm';
import useHandleAirlineSearch from '../hooks/useHandleAirlineSearch';
import { resetpriceRange, resetSelectedAirlines } from '../slices/airlineSlice';

import '../assets/style.css';

type props = {
    setFlightResData: any;
    setFlightData: any;
    setIsloading: any;
    setFilterCount: any;
    setInboutFlights: any;
    setProgress: any;
    isLoading: boolean;
    searchHandler: any;
    setFilterValue: any;
    setInbountFilterValue: any;
    setSearchParams?: (params: any) => void;
    onSearchComplete?: (tripData: any) => void;
};

function HeadSearchResult({
    setFilterCount,
    setFlightResData,
    setIsloading,
    setFlightData,
    setInboutFlights,
    onSearchComplete,
    setProgress,
    isLoading,
    searchHandler,
    setFilterValue,
    setInbountFilterValue,
    setSearchParams,
}: props) {
    const location = useLocation();
    const navigate = useNavigate();
    const { flightkey } = location.state || {};
    const dispatch = useAppDispatch();
    const [loaderCheck, setLoaderCheck] = useState<boolean>(false);

    const searchDataSelector = useAppSelector(state => state.reducer.airline.searchData);
    const { priceRange } = useAppSelector(state => state.reducer.airline);
    const { handleAirlineSearch } = useHandleAirlineSearch();

    const handleSearch = async (formTripData?: any) => {
        let currentSearchData = formTripData;
        if (!currentSearchData) {
            try {
                const state = store.getState() as any;
                const storeSearchData = state?.reducer?.reducer?.airline?.searchData;
                
                currentSearchData = storeSearchData || searchDataSelector;
                
            } catch (error) {
                currentSearchData = searchDataSelector;
            }
        }
        
        if (!currentSearchData.tripType) {
            navigate(`${paths.dashboard.corporateTravel}`);
            return;
        }
        if (isLoading) return;
        setFilterValue({ type: 'price', highest: true });
        setInbountFilterValue({ type: 'price', highest: true });
        dispatch(resetpriceRange());
        setLoaderCheck(true);
        dispatch(resetSelectedAirlines({}));
        setProgress(0);
        const tripData = {
            tripType: currentSearchData.tripType,
            fromLocation: currentSearchData.fromLocation,
            toLocation: currentSearchData.toLocation,
            depart: currentSearchData.depart,
            departDay: currentSearchData.departDay,
            arrive: currentSearchData.arrive,
            arriveDay: currentSearchData.arriveDay,
            fromLocation1: currentSearchData.fromLocation1,
            toLocation1: currentSearchData.toLocation1,
            depart1: currentSearchData.depart1,
            departDay1: currentSearchData.departDay1,
            arrive1: currentSearchData.arrive1,
            arriveDay1: currentSearchData.arriveDay1,
            adults: currentSearchData.adults,
            children: currentSearchData.children,
            infants: currentSearchData.infants,
            class: currentSearchData.class,
            originCountryCode: currentSearchData.originCountryCode,
            destinationCountryCode: currentSearchData.destinationCountryCode,
        };
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
            setLoaderCheck(false);
            if (setSearchParams) {
                const params: any = {
                    tripType: tripData.tripType,
                    fromLocation1: tripData.fromLocation1,
                    toLocation1: tripData.toLocation1,
                    depart1: tripData.depart1,
                    originCountryCode: tripData.originCountryCode,
                    destinationCountryCode: tripData.destinationCountryCode,
                };
                if (tripData.tripType === 2 && tripData.arrive) {
                    params.arrive = tripData.arrive;
                }
                setSearchParams(params);
            }
        }
    };

    useEffect(() => {
        if (flightkey === 'searchFlights' || loaderCheck) {
            setIsloading(isLoading);
        } else {
            setIsloading(false);
        }
        setFilterCount({
            lowestPrice: Number.isFinite(priceRange?.lowestPrice)
                ? Math.floor(priceRange.lowestPrice)
                : 0,
            highestPrice: Number.isFinite(priceRange?.highestPrice)
                ? Math.ceil(priceRange.highestPrice)
                : 1000000,
        });
    }, [isLoading, setFilterCount, setIsloading, loaderCheck, priceRange, flightkey]);

    useEffect(() => {
        handleSearch();
    }, []);

    return (
        <Row className="p-0 m-0" gutter={[15, 0]}>
            <Col md={24} lg={20}>
                <AirlineSearchForm isLoading={isLoading} handleSearch={handleSearch} />
            </Col>
            <Col className="flex justify-end items-start ps-2 mt-3 lg:mt-0" md={24} lg={4}>
                <Button
                    danger
                    className="w-full h-16 rounded-lg text-center"
                    type="default"
                    size="small"
                    onClick={() => {
                        if (!isLoading) {
                            const latestState = store.getState() as any;
                            const latestSearchData = 
                                latestState?.reducer?.reducer?.airline?.searchData ||
                                latestState?.reducer?.airline?.searchData ||
                                latestState?.airline?.searchData;
                            
                            handleSearch(latestSearchData);
                        }
                    }}
                    disabled={isLoading}
                >
                    Search
                </Button>
            </Col>
        </Row>
    );
}

export default HeadSearchResult;
