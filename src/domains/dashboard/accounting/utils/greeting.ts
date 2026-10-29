export const getGreeting = (date: Date = new Date()): string => {
    const hour = date.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

export const getCurrentMonthYear = (date: Date = new Date()): string =>
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const getCurrentFinancialYear = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = (startYear + 1) % 100;
    return `FY ${startYear}–${endYear.toString().padStart(2, '0')}`;
};
