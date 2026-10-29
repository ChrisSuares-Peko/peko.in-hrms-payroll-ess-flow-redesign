const { buildMatchHash, buildRouteHash, normaliseSegments } = require("../flightHoldFingerprint");

// Shaped exactly like a segment in TBO's FlightItinerary.Segments / search Results[].Segments.
const segment = () => ({
    CabinClass: 2,
    Airline: { AirlineCode: "AI", AirlineName: "Air India", FlightNumber: "2439", FareClass: "T" },
    Origin: { Airport: { AirportCode: "DEL" }, DepTime: "2026-09-30T23:00:00" },
    Destination: { Airport: { AirportCode: "BOM" }, ArrTime: "2026-10-01T01:25:00" },
});

const passenger = (overrides = {}) => ({
    Title: "Mr",
    FirstName: "Jfvcf",
    LastName: "Tee",
    PaxType: 1,
    DateOfBirth: "2001-09-06",
    ...overrides,
});

const credentialId = 42;

describe("buildMatchHash", () => {
    it("keeps the departure time as sent, without shifting it into UTC", () => {
        expect(normaliseSegments([segment()])).toEqual(["AI|2439|T|DEL|BOM|2026-09-30T23:00|2"]);
    });

    it("matches the FE's nested journey against a flat Segments array", () => {
        const nested = buildMatchHash({ credentialId, segments: [[segment()]], passengers: [passenger()] });
        const flat = buildMatchHash({ credentialId, segments: [segment()], passengers: [passenger()] });

        expect(nested).toBe(flat);
    });

    // The Book request sends "2001-09-06"; the response echoes "2001-09-06T00:00:00". Parsing
    // those through Date lands them on different calendar days outside UTC.
    it("treats a date-only and a midnight timestamp as the same day", () => {
        const dateOnly = buildMatchHash({ credentialId, segments: [segment()], passengers: [passenger()] });
        const withTime = buildMatchHash({
            credentialId,
            segments: [segment()],
            passengers: [passenger({ DateOfBirth: "2001-09-06T00:00:00" })],
        });

        expect(withTime).toBe(dateOnly);
    });

    it("ignores casing, padding and numeric-vs-string PaxType", () => {
        const clean = buildMatchHash({ credentialId, segments: [segment()], passengers: [passenger()] });
        const messy = buildMatchHash({
            credentialId,
            segments: [segment()],
            passengers: [passenger({ Title: "mr ", FirstName: " JFVCF", PaxType: "1" })],
        });

        expect(messy).toBe(clean);
    });

    it("ignores the order passengers were entered in", () => {
        const party = [passenger(), passenger({ FirstName: "Asha", LastName: "K", DateOfBirth: "1995-01-02" })];

        expect(buildMatchHash({ credentialId, segments: [segment()], passengers: party }))
            .toBe(buildMatchHash({ credentialId, segments: [segment()], passengers: [...party].reverse() }));
    });

    it("separates a different passenger, corporate, flight or fare class", () => {
        const base = buildMatchHash({ credentialId, segments: [segment()], passengers: [passenger()] });

        const otherPassenger = buildMatchHash({
            credentialId, segments: [segment()], passengers: [passenger({ LastName: "Roy" })],
        });
        const otherCorporate = buildMatchHash({
            credentialId: 43, segments: [segment()], passengers: [passenger()],
        });

        const otherFlight = segment();
        otherFlight.Airline.FlightNumber = "2440";

        const otherFareClass = segment();
        otherFareClass.Airline.FareClass = "U";

        expect(otherPassenger).not.toBe(base);
        expect(otherCorporate).not.toBe(base);
        expect(buildMatchHash({ credentialId, segments: [otherFlight], passengers: [passenger()] })).not.toBe(base);
        expect(buildMatchHash({ credentialId, segments: [otherFareClass], passengers: [passenger()] })).not.toBe(base);
    });

    // Without a fingerprint we must fall through to a fresh Book rather than risk a false match.
    it("returns null when there is nothing to fingerprint", () => {
        expect(buildMatchHash({ credentialId, segments: [], passengers: [passenger()] })).toBeNull();
        expect(buildMatchHash({ credentialId, segments: [segment()], passengers: [] })).toBeNull();
    });

    // A segment stripped of its identifying fields would normalise to near-empty and collide
    // with any other such segment — reusing a hold on that would ticket the wrong flight.
    it("refuses to fingerprint a segment missing its identifying fields", () => {
        const noFlightNumber = segment();
        noFlightNumber.Airline.FlightNumber = "";

        const noDepTime = segment();
        noDepTime.Origin.DepTime = "";

        expect(buildMatchHash({ credentialId, segments: [noFlightNumber], passengers: [passenger()] })).toBeNull();
        expect(buildMatchHash({ credentialId, segments: [noDepTime], passengers: [passenger()] })).toBeNull();
        expect(buildMatchHash({ credentialId, segments: [{}], passengers: [passenger()] })).toBeNull();
        // One bad segment invalidates the whole itinerary, not just itself.
        expect(
            buildMatchHash({ credentialId, segments: [segment(), {}], passengers: [passenger()] })
        ).toBeNull();
    });
});

describe("buildRouteHash", () => {
    it("holds the same flights at a different fare class together", () => {
        const cheaper = segment();
        cheaper.Airline.FareClass = "U";

        expect(buildRouteHash({ credentialId, segments: [cheaper], passengers: [passenger()] }))
            .toBe(buildRouteHash({ credentialId, segments: [segment()], passengers: [passenger()] }));
    });

    it("still separates a genuinely different flight", () => {
        const otherFlight = segment();
        otherFlight.Airline.FlightNumber = "2440";

        expect(buildRouteHash({ credentialId, segments: [otherFlight], passengers: [passenger()] }))
            .not.toBe(buildRouteHash({ credentialId, segments: [segment()], passengers: [passenger()] }));
    });
});
