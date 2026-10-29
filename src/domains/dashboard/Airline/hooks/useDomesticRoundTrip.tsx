import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

const useDomesticRoundTrip = () => {
    const { searchData: airlineSearchData } = useAppSelector(state => state.reducer.airline);

    const [isDomesticRoundTrip, setIsDomesticRoundTrip] = useState(false);

    useEffect(() => {
        if (airlineSearchData.destinationCountryCode && airlineSearchData.originCountryCode) {
            const isDRT =
                airlineSearchData.destinationCountryCode === airlineSearchData.originCountryCode &&
                airlineSearchData.originCountryCode === 'IN' &&
                airlineSearchData.tripType === 2;
            setIsDomesticRoundTrip(isDRT);
        }
    }, [airlineSearchData]);

    // Only a domestic round trip books two independent ResultIndex legs (selectedAirline +
    // selectedInbountAirline). A multi-city search returns a single combined itinerary
    // (one ResultIndex spanning all legs, like an international round trip), so it is NOT a
    // two-leg booking.
    return { isDomesticRoundTrip, isTwoLegBooking: isDomesticRoundTrip };
};

export default useDomesticRoundTrip;
