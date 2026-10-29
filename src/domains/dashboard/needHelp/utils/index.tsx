import { formattedDateOnly } from '@utils/dateFormat';

import { Chat } from '../types/type';

const groupMessagesByDate = (messages: Chat[]) => {
    const grouped: { messages: Chat[]; date: string }[] = [];

    messages.forEach(message => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset today's date to midnight for comparison

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0); // Set yesterday's date to midnight for comparison

        const messageDate = new Date(message.created_at);
        messageDate.setHours(0, 0, 0, 0); // Reset message's date to midnight for comparison

        let dateString: string;

        if (messageDate.getTime() === today.getTime()) {
            dateString = 'Today';
        } else if (messageDate.getTime() === yesterday.getTime()) {
            dateString = 'Yesterday';
        } else {
            dateString = formattedDateOnly(messageDate); // Use your existing date formatting function
        }

        const groupIndex = grouped.findIndex(group => group.date === dateString);

        if (groupIndex === -1) {
            grouped.push({
                date: dateString,
                messages: [message],
            });
        } else {
            grouped[groupIndex].messages.push(message);
        }
    });

    return grouped;
};

export default groupMessagesByDate;
