import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatRelativeTime = (date: string | Date): string => {
    if (!date) return '';
    const dateObj = dayjs(date);
    const now = dayjs();
    const diffInHours = now.diff(dateObj, 'hour');
    
    if (diffInHours < 24) {
        return dateObj.fromNow();
    }
    
    return dateObj.format('MMMM D, YYYY [at] h:mm A');
};
