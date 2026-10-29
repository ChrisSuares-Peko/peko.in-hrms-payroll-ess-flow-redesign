import { Flight } from '../types/Flight';

/**
 * Signature identifying a single displayed flight card. Genuine fare variants (identical
 * flights, different price) share this key and collapse into one card in SearchResultBody.
 *
 * A multi-city itinerary is one combined fare spanning every leg, and distinct itineraries
 * can share the same first leg, so multi-city keys on the full journey signature to keep
 * those as separate cards. Every place that counts flights against the rendered list (e.g.
 * the layover filter counts) MUST group by this same key, or the count won't match the list.
 */
export const getFlightGroupKey = (flight: Flight, isMultiCity?: boolean): string => {
    if (isMultiCity) {
        return (flight.journey || [])
            .flat()
            .map(seg => `${seg.Airline.AirlineCode}${seg.Airline.FlightNumber}-${seg.Origin.DepTime}`)
            .join('|');
    }
    return `${flight.flightCode}-${flight.flightNumber}-${flight.depart.datetime}-${flight.arrive.datetime}`;
};
