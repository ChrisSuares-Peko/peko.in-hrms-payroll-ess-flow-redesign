export const taxRegimeOptions = [
    { label: 'Old Tax Regime', value: 'Old Tax Regime' },
    { label: 'New Tax Regime', value: 'New Tax Regime' },
];

const currentYear = new Date().getFullYear();

export const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - i;
    return { label: year.toString(), value: year.toString() };
});
