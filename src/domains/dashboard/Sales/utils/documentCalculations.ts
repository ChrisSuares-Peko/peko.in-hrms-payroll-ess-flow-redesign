import { ItemValues } from '../types/createDocument';

export const computeNetAmount = (item: ItemValues): number => {
    const qty = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const gross = qty * unitPrice;

    if (item.taxMode === 'Inclusive') {
        // Discount applied on inclusive price; GST is embedded — net = what customer pays
        return gross * (1 - discount / 100);
    }

    // Exclusive: GST added on top of discounted price
    return gross * (1 - discount / 100) * (1 + taxRate / 100);
};

export const calcSubtotal = (items: ItemValues[]): string =>
    items
        .reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const taxRate = parseFloat(item.taxRate) || 0;
            const gross = qty * unitPrice;
            // Inclusive: report pre-GST base for tax accounting
            if (item.taxMode === 'Inclusive' && taxRate > 0) {
                return acc + gross / (1 + taxRate / 100);
            }
            return acc + gross;
        }, 0)
        .toFixed(2);

export const calcDiscount = (items: ItemValues[]): string =>
    items
        .reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxRate = parseFloat(item.taxRate) || 0;
            const gross = qty * unitPrice;
            // Inclusive: discount reported on base (for GST accounting)
            if (item.taxMode === 'Inclusive' && taxRate > 0) {
                return acc + (gross / (1 + taxRate / 100)) * (discount / 100);
            }
            return acc + gross * (discount / 100);
        }, 0)
        .toFixed(2);

export const calcTax = (items: ItemValues[]): string =>
    items
        .reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxRate = parseFloat(item.taxRate) || 0;
            const gross = qty * unitPrice;
            if (item.taxMode === 'Inclusive') {
                // GST extracted from the discounted inclusive amount
                const afterDiscount = gross * (1 - discount / 100);
                const base = taxRate > 0 ? afterDiscount / (1 + taxRate / 100) : afterDiscount;
                return acc + (afterDiscount - base);
            }
            return acc + gross * (1 - discount / 100) * (taxRate / 100);
        }, 0)
        .toFixed(2);

export const calcTotal = (items: ItemValues[], shipping: string): string =>
    (items.reduce((acc, item) => acc + computeNetAmount(item), 0) + Number(shipping || 0)).toFixed(
        2
    );

export const calcAmountDue = (total: string, paid: string): string =>
    (parseFloat(total) - Number(paid || 0)).toFixed(2);
