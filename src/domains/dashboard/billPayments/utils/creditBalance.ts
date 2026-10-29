export const creditBalanceOf = (billAmount: unknown): number | null => {
    const amount = Number(billAmount);
    return Number.isFinite(amount) && amount < 0 ? Math.abs(amount) : null;
};
