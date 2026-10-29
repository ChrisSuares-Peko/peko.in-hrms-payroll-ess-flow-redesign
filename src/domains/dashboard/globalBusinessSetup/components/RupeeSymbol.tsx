import { currencySymbol } from '../utils/pricingCalc';

interface RupeeSymbolProps {
    size?: number;
    className?: string;
    // Pricing is shown in its native currency; pass it so non-INR prices render
    // the right symbol. Omitted/INR keeps the rupee glyph (unchanged look).
    currency?: string;
}

const RupeeSymbol = ({ size = 20, className = '', currency }: RupeeSymbolProps) => {
    const isInr = !currency || currency.toUpperCase() === 'INR';

    return (
        <span
            className={`inline-flex align-middle mr-1 ${className}`}
            style={{ fontSize: `${size}px`, lineHeight: 1 }}
        >
            {isInr ? '₹' : currencySymbol(currency)}
        </span>
    );
};

export default RupeeSymbol;
