const { airLineTicketTemplate } = require("../utils/emailTemplates/flights/airLineTicket");

const makeSegment = (overrides = {}) => ({
    airlineLogo: "https://logo.test/AI.gif",
    operatingAirline: "Air India",
    airlineName: "Air India",
    marketingAirline: "Air India",
    marketingAirlineName: "Air India",
    flightNumber: "805",
    cabinClass: "Economy",
    departure: {
        departureAirportCode: "DEL",
        departureTime: "10:00",
        departureDate: "Wed Jul 15 2026",
        departureCountry: "India",
        departureCity: "Delhi",
        departureTerminal: "Terminal 3",
        departureAirportName: "Indira Gandhi International",
    },
    arrival: {
        arrivalAirportCode: "AMD",
        arrivalTime: "11:30",
        arrivalDate: "Wed Jul 15 2026",
        arrivalCountry: "India",
        arrivalCity: "Ahmedabad",
        arrivalTerminal: "Terminal 1",
        arrivalAirportName: "Sardar Vallabhbhai Patel International",
    },
    duration: "1 hrs 30 mins",
    groundTime: "0 hrs 0 mins",
    carryOnBaggage: ["7 KG"],
    checkedInBaggage: ["15 KG"],
    aircraftType: "",
    layOver: "Layover: 0 hrs 0 mins",
    ...overrides,
});

const makeJourney = (segment) => ({
    onPoint: "Delhi",
    offPoint: "Ahmedabad",
    startDate: "Wed Jul 15 2026",
    stopQuantity: 0,
    flightSegments: [segment],
});

const makeTicketData = (overrides = {}) => ({
    flightDetails: [makeJourney(makeSegment())],
    inbountFlightDetails: null,
    passengersDetails: [
        { name: "Mr. Test User", passport: "M1234567", pnr: "8RKDH2", ticket: "0987654321", seat: null },
    ],
    bookingIdLabel: "Confirmation Number: PEKO123",
    bookingStatusMessage: "Confirmed",
    bookedDate: "Wed Jul 9 2026",
    pnr: "8RKDH2",
    inbountPNR: undefined,
    lcc: false,
    isInternational: false,
    contactPhone: "+91-98xxxxxx21",
    contactEmail: "t****@peko.one",
    totalFare: "5,000.00",
    baseFare: "4,000.00",
    taxAmount: "1,000.00",
    surcharge: "0.00",
    totalAncillaryAmount: "0.00",
    ...overrides,
});

const templateDetails = {
    logo: "data:image/png;base64,AAAA",
    branding: "Peko",
    baseUrl: "https://in.peko.one",
};

describe("airLineTicketTemplate", () => {
    describe("domestic ticket", () => {
        const html = airLineTicketTemplate(makeTicketData({ isInternational: false }), templateDetails);

        it("shows cabin baggage, Airline PNR, 2.5-hour arrival, web check-in, GST pointer and confirmation number", () => {
            expect(html).toContain("7 KG");
            expect(html).toContain("Airline PNR");
            expect(html).toContain("2.5 hours");
            expect(html).toContain("Web check-in opens 48 hours");
            expect(html).toContain("Download your GST tax invoice");
            expect(html).toContain("Confirmation Number: PEKO123");
        });

        it("omits international-only and incorrect content", () => {
            expect(html).not.toContain("visa");
            expect(html).not.toContain("16 cm");
            expect(html).not.toContain("Electronic devices which are larger");
            expect(html).not.toContain("Passport No.");
            expect(html).not.toContain("Aircraft: Air India");
        });

        it("renders the logo from a quoted data URI (no alt-text fallback)", () => {
            expect(html).toContain('src="data:image/png;base64,AAAA"');
            expect(html).toContain('alt="Peko"');
        });

        it("renders masked traveller contact", () => {
            expect(html).toContain("+91-98xxxxxx21");
            expect(html).toContain("t****@peko.one");
        });
    });

    describe("international ticket", () => {
        const intlSegment = makeSegment({
            arrival: {
                arrivalAirportCode: "DXB",
                arrivalTime: "13:00",
                arrivalDate: "Wed Jul 15 2026",
                arrivalCountry: "United Arab Emirates",
                arrivalCity: "Dubai",
                arrivalTerminal: "Terminal 3",
                arrivalAirportName: "Dubai International",
            },
        });
        const html = airLineTicketTemplate(
            makeTicketData({ isInternational: true, flightDetails: [makeJourney(intlSegment)] }),
            templateDetails
        );

        it("retains visa/passport guidance and the passport field", () => {
            expect(html).toContain("visa");
            expect(html).toContain("Passport No.");
        });
    });

    describe("aircraft type", () => {
        it("shows the aircraft type when present and never repeats the airline name", () => {
            const segment = makeSegment({ aircraftType: "A320neo" });
            const html = airLineTicketTemplate(
                makeTicketData({ flightDetails: [makeJourney(segment)] }),
                templateDetails
            );
            expect(html).toContain("Aircraft: A320neo");
            expect(html).not.toContain("Aircraft: Air India");
        });
    });
});
