import { RankingData, ScheduledReminderRow } from "../types/payments";

export const DUMMY_VIRTUAL_ACCOUNT_DETAILS = {
    companyName: 'Tata Consultancy Services',
    documentNo: 'INV-001',
    accountName: 'Peko India - Demo Business',
    bankName: 'HDFC Bank',
    iban: 'GB29NWBK60161331926819',
    swiftCode: 'TRWIGB22',
    accountNumber: '3024567890123456',
    currency: 'USD',
    routingNumber: '026073150',
    bankAddress: '56 Shoreditch High Street, London E1 6JJ, United Kingdom',
};
export const ACTIVITY_DATA: RankingData[] = [
    {
        id: '1',
        name: 'BlueStar Enterprises · INV-0042',
        subtitle: 'Reminder sent',
        time: '1 hour ago',
    },
    {
        id: '2',
        name: 'TechNova Pvt Ltd · INV-0043',
        subtitle: 'Reminder Viewed',
        time: '2 hours ago',
    },
    {
        id: '3',
        name: 'Global Nexus Ltd · INV-0044',
        subtitle: 'Customer Responded',
        time: '3 hours ago',
    },
];

export const DUMMY_DATA: ScheduledReminderRow[] = [
    {
        id: '1',
        invoiceId: 'PAY-001',
        customer: 'Acme Corp',
        outstanding: 18500,
        dueDate: '2026-03-05',
        reminderStatus: 'Sent',
        nextReminder: '05 Mar 2026',
    },
    {
        id: '2',
        invoiceId: 'PAY-002',
        customer: 'Tech Solutions',
        outstanding: 18500,
        dueDate: '2026-03-05',
        reminderStatus: 'Scheduled',
        nextReminder: '05 Mar 2026',
    },
    {
        id: '3',
        invoiceId: 'PAY-003',
        customer: 'Innovative Designs',
        outstanding: 18500,
        dueDate: '2026-03-05',
        reminderStatus: 'No response',
        nextReminder: '05 Mar 2026',
    },
];