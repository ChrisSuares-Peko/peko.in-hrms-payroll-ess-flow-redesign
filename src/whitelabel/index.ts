
import peko from './peko';
import { Whitelabel } from './types';

const brands = {
    peko,
   
} as const;

export type BrandKey = keyof typeof brands;

export const ACTIVE_BRAND: BrandKey = 'peko';

const whitelabel: Whitelabel = brands[ACTIVE_BRAND] ?? peko;

export const isWhitelabelled = whitelabel.isPartner;

export default whitelabel;
