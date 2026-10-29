type Props = {
    currency: string;
    amount: number;
};

const usd = Number(import.meta.env.VITE_USD_TO_AED);

export function currencyConverter({ currency, amount }: Props) {
    currency = currency.toUpperCase();
    switch (currency) {
        case 'USD':
            return (amount * usd).toFixed(2);
        // case 'INR':
        //     return (amount * 0.04).toFixed(2);
        // default:
        //     return amount;
        default:
            return 0;
    }
}
