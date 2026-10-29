import { formatInr } from './commission';
import { GatewayChargeTerms } from '../types/catalog';

const numberOf = (value: number | string | null | undefined) => Number(value) || 0;

// The two inputs fold into the one set of terms the partner carries: both blank means no
// terms at all, which is not the same as a partner who bears no charge (both zero).
export const gatewayChargeOf = (
    percentage: string,
    fixed: string
): { percentage: number; fixed: number } | null => {
    const pct = percentage.trim();
    const fix = fixed.trim();
    if (pct === '' && fix === '') return null;
    return { percentage: numberOf(pct), fixed: numberOf(fix) };
};

export const describeGatewayCharge = (terms: GatewayChargeTerms | null | undefined) => {
    if (!terms) return null;
    const percentage = numberOf(terms.percentage);
    const fixed = numberOf(terms.fixed);
    if (!percentage && !fixed) return 'None';
    return `${percentage}% + ${formatInr(fixed)}`;
};

export const gatewayChargeInputs = (terms: GatewayChargeTerms | null | undefined) => ({
    gatewayChargePercentage: terms ? String(numberOf(terms.percentage)) : '',
    gatewayChargeFixed: terms ? String(numberOf(terms.fixed)) : '',
});
