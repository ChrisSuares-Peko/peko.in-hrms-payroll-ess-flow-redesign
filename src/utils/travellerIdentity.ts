import dayjs from 'dayjs';

import { TravellerOption } from '@customtypes/savedTraveller';

export interface TravellerIdentity {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    passportNo?: string;
    contactNo?: string;
    email?: string;
}

const norm = (v?: string) => (v ?? '').trim().toLowerCase();

// Loose identity (name + DOB): used to recognise an employee so we don't offer to "save" one.
export const nameDobKey = (r: TravellerIdentity) =>
    [norm(r.firstName), norm(r.lastName), norm(r.dateOfBirth)].join('|');

// Full identity: any change (incl. passport / contact / email) yields a new key, so an edited
// traveller is treated as NEW. Mirrors the backend `travellerKey` so FE uniqueness and BE
// idempotency agree.
export const fullTravellerKey = (r: TravellerIdentity) =>
    [
        norm(r.firstName),
        norm(r.lastName),
        norm(r.dateOfBirth),
        (r.passportNo ?? '').trim().toUpperCase(),
        norm(r.contactNo),
        norm(r.email),
    ].join('|');

// Normalise a dropdown option (employee or saved) into the identity shape.
export const optionToIdentifiable = (o: TravellerOption): TravellerIdentity => {
    const parts = (o.fullName ?? '').trim().split(' ');
    return {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
        dateOfBirth: cleanTravellerDate(o.dateOfBirth),
        passportNo: o.passportNo,
        contactNo: o.mobileNo,
        email: o.email,
    };
};

export const cleanTravellerDate = (v?: string): string | undefined => {
    if (!v || v === 'Invalid date') return undefined;
    const d = dayjs(v);
    return d.isValid() ? d.format('YYYY-MM-DD') : undefined;
};

export const optionIdentityKey = (option: TravellerOption): string => {
    const parts = (option.fullName ?? '').trim().split(' ');
    return fullTravellerKey({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
        dateOfBirth: cleanTravellerDate(option.dateOfBirth),
        passportNo: option.passportNo,
        contactNo: option.mobileNo,
        email: option.email,
    });
};
