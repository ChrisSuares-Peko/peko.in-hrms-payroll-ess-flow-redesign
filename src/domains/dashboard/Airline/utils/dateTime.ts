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

export const shortDateFormat: FormattedDateFn = datetime => {
    const dayOfWeek = datetime.toLocaleString('en-US', { weekday: 'short' });
    const day = datetime.getDate();
    const month = datetime.toLocaleString('en-US', { month: 'short' });

    return `${dayOfWeek} ${day} ${month}`;
};

// Output: "Wednesday 18th December, 2020"
export const wordsFormattedDateOnly: FormattedDateFn = datetime => {
    const dayOfWeek = datetime.toLocaleString('en-US', { weekday: 'long' });
    const day = datetime.getDate();
    const month = datetime.toLocaleString('en-US', { month: 'long' });
    const year = datetime.getFullYear();

    const ordinalSuffix = (date: number) => {
        if (date > 3 && date < 21) return 'th';
        switch (date % 10) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    };

    return `${dayOfWeek} ${day}${ordinalSuffix(day)} ${month}, ${year}`;
};

// '2025-04-09T07:45:00' to '07:45 AM' - usage :  {formattedTimeWithMeridian(new Date('2025-04-09T07:45:00'))}
export const formattedTimeWithMeridian = (datetime: Date): string =>
    datetime.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // this adds AM/PM
    });
