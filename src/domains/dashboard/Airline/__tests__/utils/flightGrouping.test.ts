import { describe, expect, it } from 'vitest';

import { Flight } from '../../types/Flight';
import { getFlightGroupKey } from '../../utils/flightGrouping';

const makeFlight = (over: Record<string, unknown>): Flight =>
    ({
        flightCode: '6E',
        flightNumber: '123',
        depart: { datetime: '2026-08-01T06:00:00' },
        arrive: { datetime: '2026-08-01T08:30:00' },
        journey: [[]],
        ...over,
    }) as unknown as Flight;

const seg = (code: string, num: string, dep: string) => ({
    Airline: { AirlineCode: code, FlightNumber: num },
    Origin: { DepTime: dep },
});

describe('getFlightGroupKey', () => {
    it('collapses fare variants of the same physical flight into one key', () => {
        // Same flight, different price — these render as one card, so they must count once.
        const cheap = makeFlight({ price: 4500 });
        const flexible = makeFlight({ price: 5200 });
        expect(getFlightGroupKey(cheap)).toBe(getFlightGroupKey(flexible));
    });

    it('keeps genuinely different flights on different keys', () => {
        expect(getFlightGroupKey(makeFlight({ flightNumber: '123' }))).not.toBe(
            getFlightGroupKey(makeFlight({ flightNumber: '456' }))
        );
        expect(
            getFlightGroupKey(makeFlight({ depart: { datetime: '2026-08-01T06:00:00' } }))
        ).not.toBe(getFlightGroupKey(makeFlight({ depart: { datetime: '2026-08-01T09:00:00' } })));
    });

    it('keys multi-city itineraries on the full journey, not just the first leg', () => {
        // Identical leg 1, different leg 2 — must stay separate cards.
        const itinA = makeFlight({ journey: [[seg('6E', '100', 'T1')], [seg('AI', '200', 'T2')]] });
        const itinB = makeFlight({ journey: [[seg('6E', '100', 'T1')], [seg('AI', '999', 'T3')]] });
        expect(getFlightGroupKey(itinA, true)).not.toBe(getFlightGroupKey(itinB, true));

        // Identical itineraries (fare variants) — one card.
        const itinC = makeFlight({ journey: [[seg('6E', '100', 'T1')], [seg('AI', '200', 'T2')]] });
        expect(getFlightGroupKey(itinA, true)).toBe(getFlightGroupKey(itinC, true));
    });
});
