/* eslint-disable no-unsafe-optional-chaining */

import { formattedDateOnly } from '@utils/dateFormat';

export const formatDateOrTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
    });
};

export function groupMessagesByDate(messages: any) {
    // Replace null or invalid `createdAt` with the current timestamp
    const processedMessages = messages.map((message: any) => {
        if (!message?.createdAt || !message?.createdAt.seconds) {
            return {
                ...message,
                createdAt: {
                    seconds: Math.floor(Date.now() / 1000), // Use current timestamp in seconds
                    nanoseconds: 0,
                },
            };
        }
        return message;
    });

    // Sort messages by `createdAt` timestamp in ascending order
    const sortedMessages = processedMessages.sort((a: any, b: any) => {
        const timeA = a?.createdAt?.seconds || 0;
        const timeB = b?.createdAt?.seconds || 0;
        return timeA - timeB;
    });

    const groupedMessages = sortedMessages.reduce((groups: any, message: any) => {
        // Extract the date from the Firestore timestamp
        const dateKey = new Date(message?.createdAt?.seconds * 1000).toDateString();

        // Initialize the group if it doesn't exist
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }

        // Add the message to the corresponding group
        groups[dateKey].push(message);

        return groups;
    }, {});

    // Sort the date keys in ascending order (earliest date at the top)
    const sortedGroupKeys = Object.keys(groupedMessages).sort((a: string, b: string) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return dateA - dateB;
    });

    // Create a new sorted object with the dates in reverse order
    const sortedGroupedMessages: any = {};
    sortedGroupKeys.reverse().forEach(key => {
        sortedGroupedMessages[key] = groupedMessages[key];
    });

    return sortedGroupedMessages;
}

export function getDisplayDate(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return formattedDateOnly(date);
}

export function getFileName(fileUrl: string): string {
    if (!fileUrl) return '';

    // Use URL constructor to parse the URL and extract the pathname
    try {
        const url = new URL(fileUrl);
        const pathSegments = url.pathname.split('/');
        return pathSegments.pop() || ''; // Get the last segment
    } catch (error) {
        // Fallback in case the input is not a valid URL
        const pathSegments = fileUrl.split('/');
        return pathSegments.pop() || '';
    }
}
