import dayjs from 'dayjs';

export const formatDayWithSuffix = (dateString: string) => {
    const date = dayjs(dateString);
    if (!date.isValid()) return 'N/A';

    const day = date.date();
    const month = date.format('MMMM'); // Full month name
    const year = date.year();

    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    return `${day}${suffix} ${month} ${year}`;
};

export const formatDayWithSuffixForPayDay = (day: number) => {
    

    let suffix = 'th';
    if (day === 1 || day === 21) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    else if(day === 31) return "Last day"

    return `${day}${suffix}`;
};
export function formatEmploymentType(value: string): string {
    if (!value) return '';

    return value
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
}
export const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const formatDate = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
export const getMonthName = (month: number): string => {
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    // Ensure the month value is within the valid range (1 to 12)
    if (month >= 1 && month <= 12) {
        return months[month - 1]; // Subtract 1 to adjust for zero-based indexing
    }
    return ''; // Handle invalid month values
};
export const formattedDate = (isoDate: string) => {
    const date = new Date(isoDate);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month index starts from 0
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};
