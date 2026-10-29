import { useCallback, useEffect, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getFareRulesAPI } from '../api';
import { setFares } from '../slices/airlineSlice';
import { AllFareQuote, FareRules, IFareRules } from '../types/fareRules';

export const useGetFareRules = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { TraceId, selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );
    const [fareRules, setFareRules] = useState<FareRules[]>([]);
    const [fareQuotes, setFareQuotes] = useState<AllFareQuote>();
    const [isLoading, setIsLoading] = useState(true);
    const lastCalledResultIndex = useRef<string | undefined>(undefined);

    const getFareRulesHandler = useCallback(async () => {
        if (!TraceId || !selectedAirline.ResultIndex || !selectedAirline.price) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data: IFareRules | false = await getFareRulesAPI({
                userId: id,
                userType: role,
                TraceId,
                ResultIndex: selectedAirline.ResultIndex,
                InbountResultIndex: selectedInbountAirline.ResultIndex,
            });

            if (data) {
                setFareRules(data.fareRules);
                setFareQuotes(data.fareQuotes);
                dispatch(
                    setFares({
                        outbountFare: data.fareQuotes.outbount.Fare.PublishedFare,
                        inbountFare: data.fareQuotes.inbount?.Fare?.PublishedFare || 0,
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: 'Failed fetching fare rules, please try again later.',
                        variant: 'error',
                    })
                );
                navigate(
                    `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}`
                );
            }
        } finally {
            // Always clear the spinner — the failure branch previously left isLoading=true forever.
            setIsLoading(false);
        }
    }, [
        TraceId,
        id,
        role,
        selectedAirline.ResultIndex,
        selectedAirline.price,
        selectedInbountAirline.ResultIndex,
        navigate,
        dispatch,
    ]);

    useEffect(() => {
        // No fare context (TraceId / selected flight) — happens on a hard refresh or deep-link to the
        // details page, since selectedAirline + TraceId are not persisted. There is nothing to fetch, so
        // send the user back to the results page (which re-runs the search) instead of leaving the
        // spinner running forever.
        if (!TraceId || !selectedAirline.ResultIndex || !selectedAirline.price) {
            lastCalledResultIndex.current = undefined;
            navigate(
                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}`
            );
            return;
        }

        const currentResultIndex = selectedAirline.ResultIndex;
        if (currentResultIndex !== lastCalledResultIndex.current) {
            lastCalledResultIndex.current = currentResultIndex;
            getFareRulesHandler();
        }
    }, [TraceId, selectedAirline.ResultIndex, selectedAirline.price, getFareRulesHandler, navigate]);
    return { fareRules, fareQuotes, isLoading };
};
