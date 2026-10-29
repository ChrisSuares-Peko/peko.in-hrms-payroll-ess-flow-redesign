import { airlineData } from '../types/airlineTypes';

type IRes = {
    status: boolean;
    error: string;
};

const validateOneway = (res: IRes, data: airlineData, index: number, tripType?: number) => {
    if (data.flightSegments[index].Origin === '') {
        res.status = false;
        res.error = 'Please select a source location';
    } else if (data.flightSegments[index].Destination === '') {
        res.status = false;
        if (tripType === 3) {
            res.error = `Please select a destination for trip ${index + 1}.`;
        } else {
            res.error = 'Please select a return destination';
        }
    } else if (data.flightSegments[index].Origin === data.flightSegments[index].Destination) {
        res.status = false;
        res.error = 'Departure and arrival airports cannot be the same.';
    } else if (
        data.flightSegments[index].PreferredDepartureTime === '' ||
        data.flightSegments[index].PreferredDepartureTime === 'Invalid Date' ||
        !data.flightSegments[index].PreferredDepartureTime
    ) {
        res.status = false;
        if (index === 0) {
            res.error = 'Please select a departure date';
        } else if (index === 1) {
            const tripTypeNum = typeof tripType === 'string' ? parseInt(tripType, 10) : tripType;
            if (tripTypeNum === 2) {
                res.error = 'Please select a return date';
            } else {
                res.error = 'Please select a departure date for the second flight';
            }
        }
    } else if (data.flightSegments[index].FlightCabinClass === null) {
        res.status = false;
        res.error = 'Please select a cabin class';
    } else if (data.passengerData.adultCount === 0) {
        res.status = false;
        res.error = 'Please select a passenget count';
    }
    return res;
};

const validateRoundTrip = (res: IRes, data: airlineData, tripType: number) => {
    const valid = validateOneway(res, data, 1, tripType);
    if (valid.status)
        if (
            data.flightSegments[0].PreferredDepartureTime >
            data.flightSegments[1].PreferredDepartureTime
        ) {
            res.status = false;
            res.error = 'Please select a different dates';
        }
    return res;
};

export const validate = (data: airlineData, tripType: number) => {
    const res = {
        status: true,
        error: '',
    };

    if (tripType === 1) {
        return validateOneway(res, data, 0, tripType);
    }
    if (tripType === 2) {
        const departureDate0 = data.flightSegments[0].PreferredDepartureTime;
        const departureDate1 = data.flightSegments[1].PreferredDepartureTime;

        const date0 = new Date(departureDate0);
        const date1 = new Date(departureDate1);

        if (date0 > date1) {
            res.status = false;
            res.error =
                'The return date must be the same as or later than the departure date. Please adjust your itinerary.';
        }
        const valid = validateOneway(res, data, 0, tripType);
        if (valid.status === true) return validateRoundTrip(res, data, tripType);
    }
    if (tripType === 3) {
        const departureDate0 = data.flightSegments[0].PreferredDepartureTime;
        const departureDate1 = data.flightSegments[1].PreferredDepartureTime;

        const date0 = new Date(departureDate0);
        const date1 = new Date(departureDate1);

        if (date0 > date1) {
            res.status = false;
            res.error = `The second trip's departure date must be the same as or later than the first trip's departure date. Please adjust your itinerary.`;
        }
        const valid = validateOneway(res, data, 0, tripType);
        if (valid.status === true) return validateOneway(res, data, 1, tripType);
    }

    return res;
};
