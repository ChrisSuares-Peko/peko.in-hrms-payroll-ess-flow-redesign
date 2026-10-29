import { Journey } from '../types/airlineList';
import { AncType, SelectedAirline } from '../types/slices';

export const getPropertyByAncType = (ancType: 'meal' | 'baggage' | 'seat'): AncType => {
    const types: {
        meal: 'MealDynamic';
        baggage: 'Baggage';
        seat: 'SeatDynamic';
    } = {
        meal: 'MealDynamic',
        baggage: 'Baggage',
        seat: 'SeatDynamic',
    };

    return types[ancType];
};


export const isMealBaggageRequired = (selectedAirline: SelectedAirline, selectedInbountAirline: SelectedAirline) => {
    let isRequired = false;
    if (selectedAirline) {
        isRequired = isMealBaggageRequiredHelper(selectedAirline.journey);
    }
    if (!isRequired && selectedInbountAirline) {
        isRequired = isMealBaggageRequiredHelper(selectedInbountAirline.journey);
    }

    return isRequired;

    // iterates the segment and return true if the segment include airline which require meal and baggage
    function isMealBaggageRequiredHelper(segments: Journey[][]) {
        const airlineWithMealAndBaggageRequired = ['I5'];
        let value = false;
        segments.forEach(segment => {
            segment.forEach(flight => {
                if (airlineWithMealAndBaggageRequired.includes(flight.Airline.AirlineCode)) {
                    value = true;
                }
            });
        });
        return value;
    }
}
