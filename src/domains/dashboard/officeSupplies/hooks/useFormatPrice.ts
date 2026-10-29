export function useFormatPrice(price: any): string {
    return new Intl.NumberFormat('en-IN').format(Number(price) ?? 0) ?? '0';
}
