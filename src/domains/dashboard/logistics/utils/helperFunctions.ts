import dayjs from 'dayjs';

export const dateFormatter = (date: string) => {
    const formattedDate = dayjs(date).format('DD-MM-YYYY HH:mm:ss');
    return formattedDate;
};

export const formalTextFormatter = (data: string) =>
    data ? `${data.charAt(0)}${data.slice(1).toLocaleLowerCase()}` : '';
