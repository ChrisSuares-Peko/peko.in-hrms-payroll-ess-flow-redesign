export const convertMBtoGB = (mbValue: string | number = 0) => {
    const gbValue = Number(mbValue) / 1024;
    return gbValue % 1 === 0 ? `${gbValue}` : `${gbValue.toFixed(1)}`;
};

export const formatPlanName = (input: string) => {
    // Replace underscores with spaces
    let formatted = input.replace(/_/g, ' ');

    // Fix spacing around 'GB'
    formatted = formatted.replace(/\sGB\s?/, 'GB ');

    // Replace ' d' with ' Days'
    formatted = formatted.replace(/\s\d+\s+d/, match => match.replace(' d', ' Days'));

    // Add hyphen between the data amount and the days
    formatted = formatted.replace(/(\d+GB)\s+(\d+)\s+Days/, '$1 - $2 Days');

    return formatted;
};
