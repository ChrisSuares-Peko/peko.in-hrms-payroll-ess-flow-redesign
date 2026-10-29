import dayjs from 'dayjs';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { resetFilter, setFormData, setSearchData } from '../slices/airlineSlice';
import { ITripData } from '../types/airlineTypes';
import { validate } from '../utils/validate';

export default function useHandleAirlineSearch() {
    const dispatch = useAppDispatch();
    const handleAirlineSearch = (tripData: ITripData) => {
        const data: any = {
            tripType: tripData.tripType,
            flightSegments: [
                {
                    Origin: tripData.fromLocation1,
                    Destination: tripData.toLocation1,
                    FlightCabinClass: tripData.class,
                    PreferredDepartureTime: dayjs(tripData.depart1, 'DD-MM-YYYY').format(
                        'YYYY-MM-DDTHH:mm:ss'
                    ),
                },
            ],
            passengerData: {
                adultCount: tripData.adults,
                childCount: tripData.children,
                infantCount: tripData.infants,
            },
        };

        if (tripData.tripType === 2) {
            if (!tripData.arrive && tripData.depart1) {
                let parsedDate = dayjs(tripData.depart1, 'DD-MM-YYYY');
                if (!parsedDate.isValid()) {
                    parsedDate = dayjs(tripData.depart1, 'DD MM YYYY');
                }
                if (parsedDate.isValid()) {
                    tripData.arrive = parsedDate.add(1, 'day').format('DD-MM-YYYY');
                }
            }
            if (tripData.arrive) {
                let parsedArrive = dayjs(tripData.arrive, 'DD-MM-YYYY');
                if (!parsedArrive.isValid()) {
                    parsedArrive = dayjs(tripData.arrive, 'DD MM YYYY');
                }
                if (parsedArrive.isValid()) {
                    data.flightSegments.push({
                        Origin: tripData.toLocation1,
                        Destination: tripData.fromLocation1,
                        FlightCabinClass: tripData.class,
                        PreferredDepartureTime: parsedArrive.format('YYYY-MM-DDTHH:mm:ss'),
                    });
                }
            }
        } else if (tripData.tripType === 3) {
            data.flightSegments.push({
                Origin: tripData.fromLocation,
                Destination: tripData.toLocation,
                FlightCabinClass: tripData.class,
                PreferredDepartureTime: dayjs(tripData.depart, 'DD-MM-YYYY').format(
                    'YYYY-MM-DDTHH:mm:ss'
                ),
            });
        }

        const valid = validate(data, tripData.tripType);

        if (valid.status) {
            dispatch(setSearchData(tripData));
            dispatch(setFormData(data));
            dispatch(resetFilter());
            return { status: true, data };
        }
        dispatch(showToast({ description: valid.error, variant: 'error' }));
        return { status: false, data };
    };
    return { handleAirlineSearch };
}
