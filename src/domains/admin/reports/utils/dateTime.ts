const timeOnlyConfig: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
};

const DateOnlyConfig: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
};

type FormattedTimeFn = (datetime: Date) => string;

type FormattedDateFn = (datetime: Date) => string;

export const formattedTimeOnly: FormattedTimeFn = datetime =>
    datetime.toLocaleString('en-US', timeOnlyConfig);

export const formattedDateOnly: FormattedDateFn = datetime =>
    datetime.toLocaleString('en-US', DateOnlyConfig);

export function generateRandomDate(): Date {
    const currentTime = new Date().getTime();
    const randomOffset = Math.random() * 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const randomTime = currentTime + randomOffset;
    return new Date(randomTime);
}
