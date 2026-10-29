import dayjs from 'dayjs';
import moment from 'moment';

export default function formatDate(date: string | number | Date | undefined) {
    if (!date) return '';
    const formattedDate = dayjs(date).format('HH:mm').toLowerCase();
    return formattedDate;
}

export const formatDisplayDate = (date: string | number | Date | undefined) => {
    if (!date) return '';
    const inputDate = moment(date);
    const now = moment();

    if (inputDate.isSame(now, 'day')) return inputDate.format('HH:mm').toLowerCase();
    if (inputDate.isSame(now, 'week')) return inputDate.format('ddd');
    return inputDate.format('DD MMM');
};
