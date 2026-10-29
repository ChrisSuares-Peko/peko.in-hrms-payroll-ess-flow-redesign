import { formatInr } from './commission';
import { ChargeTerms } from '../types/thirdPartyConfiguration';

export type ChargeFormValues = { percentage: string; fixed: string };

const numberOf = (value: number | string | null | undefined) => Number(value) || 0;

export const describeCharge = (
    terms: { percentage: number | string | null; fixed: number | string | null } | null | undefined
) => {
    if (!terms || terms.percentage === null || terms.fixed === null) return null;
    const percentage = numberOf(terms.percentage);
    const fixed = numberOf(terms.fixed);
    if (!percentage && !fixed) return 'None';
    if (!fixed) return `${percentage}%`;
    if (!percentage) return `${formatInr(fixed)} per transaction`;
    return `${percentage}% + ${formatInr(fixed)}`;
};

export const chargeInputs = (terms: ChargeTerms | null | undefined): ChargeFormValues => ({
    percentage: terms ? String(numberOf(terms.percentage)) : '',
    fixed: terms ? String(numberOf(terms.fixed)) : '',
});

export const chargeTermsOf = (values: ChargeFormValues): ChargeTerms => ({
    percentage: numberOf(values.percentage),
    fixed: numberOf(values.fixed),
});
