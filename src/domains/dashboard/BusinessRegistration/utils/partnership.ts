import { EMPTY_PERSON } from './person';

// A blank partner row for the Partnership KYC FieldArray (person + profit share).
export const EMPTY_PARTNER = { ...EMPTY_PERSON, profitShare: '' };
