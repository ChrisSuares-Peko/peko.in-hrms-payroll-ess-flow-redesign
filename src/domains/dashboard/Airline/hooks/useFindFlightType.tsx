import { useAppSelector } from '@src/hooks/store';

import { Journey } from '../types/airlineList';

const useFindFlightType = () => {
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    const getFlightType = (originCode: string, destinationCode: string) => {
        const { journey } = selectedAirline;
        let type: string = '';

        type = isFullJourney(originCode, destinationCode, journey);
        if (type) return type;

        type = isSegment(originCode, destinationCode, journey);
        if (type) return type;

        type = isFullJourney(originCode, destinationCode, selectedInbountAirline.journey);
        if (type) return 'Return';

        type = isSegment(originCode, destinationCode, selectedInbountAirline.journey);
        if (type) return 'Return';

        return '';
    };

    const isFullJourney = (originCode: string, destinationCode: string, journey: Journey[][]) => {
        for (let i = 0; i < journey.length; i += 1) {
            const curr = journey[i];
            const firstSegment = curr[0];
            const lastSegment = curr[curr.length - 1];

            if (
                firstSegment.Origin.Airport.AirportCode === originCode &&
                lastSegment.Destination.Airport.AirportCode === destinationCode
            ) {
                if (firstSegment.TripIndicator === 1) return 'Onward';
                return 'Return';
            }
        }
        return '';
    };

    const isSegment = (originCode: string, destinationCode: string, journey: Journey[][]) => {
        const segments = journey.flat();
        for (let i = 0; i < segments.length; i += 1) {
            const segment = segments[i];
            if (
                segment.Destination.Airport.AirportCode === destinationCode &&
                segment.Origin.Airport.AirportCode === originCode
            ) {
                if (segment.TripIndicator === 1) return 'Onward';
                return 'Return';
            }
        }

        return '';
    };

    return { getFlightType };
};

export default useFindFlightType;
