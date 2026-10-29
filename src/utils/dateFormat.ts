import dayjs from 'dayjs';

const DateOnlyConfig: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
};

const DateTimeConfig: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true, // For AM/PM format
};

const TimeConfig: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true, // For AM/PM format
};

type FormattedDateFn = (datetime: Date) => string;

type FormattedDateTimeFn = (datetime: Date) => string;

export const formattedDateOnly: FormattedDateFn = datetime =>
    datetime.toLocaleString('en-US', DateOnlyConfig);

export const formattedDateWithDefault: FormattedDateFn = datetime =>
    datetime.toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

export const formattedDateTime: FormattedDateTimeFn = datetime =>
    datetime?.toLocaleString('en-US', DateTimeConfig);

export const formattedTime: FormattedDateFn = datetime =>
    datetime.toLocaleString('en-US', TimeConfig);

// Output Format: "December 31, 2024 at 3:37 PM"
export const formatCompleteDate = (date: string | Date | undefined): string => {
    if (!date) return ''; // Handle undefined or null date gracefully
    return dayjs(date).format('MMMM D, YYYY [at] h:mm A');
};

// "YYYY-MM-DD" (e.g., "2024-10-27") to "27 October 2024".
export const formattedTimetoText: FormattedDateFn = datetime => {
    const date = new Date(datetime);
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

export const formatToDDMMYYYY = (datetime: string | Date): string =>
    dayjs(datetime).format('DD/MM/YYYY');
