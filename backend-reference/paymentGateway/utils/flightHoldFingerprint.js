const crypto = require("crypto");

const text = (value) => String(value ?? "").trim().toUpperCase();

// Read the literal characters, never `new Date`: "2001-09-06" parses as UTC midnight but
// "2001-09-06T00:00:00" as LOCAL midnight, which hashes one date as two outside UTC.
const ISO_LIKE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

const day = (value) => {
    if (!value) return "";
    const match = ISO_LIKE.exec(String(value).trim());
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return text(value).slice(0, 10);
};

const minute = (value) => {
    if (!value) return "";
    const match = ISO_LIKE.exec(String(value).trim());
    if (match) return `${match[1]}-${match[2]}-${match[3]}T${match[4] ?? "00"}:${match[5] ?? "00"}`;
    return text(value).slice(0, 16);
};

// Takes the FE's journey (nested) or FlightItinerary.Segments (flat). Returns [] if a segment
// lacks its identifying fields — a near-empty one would collide and reuse the wrong hold.
const normaliseSegments = (segments) => {
    if (!Array.isArray(segments)) return [];
    const flat = segments.flat ? segments.flat(Infinity) : segments;

    const normalised = [];
    for (const segment of flat.filter(Boolean)) {
        const airlineCode = text(segment?.Airline?.AirlineCode);
        const flightNumber = text(segment?.Airline?.FlightNumber);
        const origin = text(segment?.Origin?.Airport?.AirportCode);
        const destination = text(segment?.Destination?.Airport?.AirportCode);
        const depTime = minute(segment?.Origin?.DepTime ?? segment?.DepTime);

        if (!airlineCode || !flightNumber || !origin || !destination || !depTime) return [];

        normalised.push([
            airlineCode,
            flightNumber,
            text(segment?.Airline?.FareClass),
            origin,
            destination,
            depTime,
            text(segment?.CabinClass),
        ].join("|"));
    }
    return normalised;
};

const normalisePassengers = (passengers) => {
    if (!Array.isArray(passengers)) return [];

    return passengers
        .filter(Boolean)
        .map((passenger) => [
            text(passenger?.Title),
            text(passenger?.FirstName),
            text(passenger?.LastName),
            day(passenger?.DateOfBirth),
            text(passenger?.PaxType),
        ].join("|"))
        .sort();
};

exports.buildMatchHash = ({ credentialId, segments, passengers }) => {
    const normalisedSegments = normaliseSegments(segments);
    const normalisedPassengers = normalisePassengers(passengers);

    if (!normalisedSegments.length || !normalisedPassengers.length) return null;

    const payload = JSON.stringify({
        credentialId: String(credentialId ?? ""),
        segments: normalisedSegments,
        passengers: normalisedPassengers,
    });

    return crypto.createHash("sha256").update(payload).digest("hex");
};

// Ignores fare class, so an older hold on the same flights at a different fare can be released.
exports.buildRouteHash = ({ credentialId, segments, passengers }) => {
    const normalisedSegments = normaliseSegments(segments).map((segment) => {
        const parts = segment.split("|");
        parts[2] = ""; // drop FareClass
        return parts.join("|");
    });
    const normalisedPassengers = normalisePassengers(passengers);

    if (!normalisedSegments.length || !normalisedPassengers.length) return null;

    const payload = JSON.stringify({
        credentialId: String(credentialId ?? ""),
        segments: normalisedSegments,
        passengers: normalisedPassengers,
    });

    return crypto.createHash("sha256").update(payload).digest("hex");
};

exports.normaliseSegments = normaliseSegments;
