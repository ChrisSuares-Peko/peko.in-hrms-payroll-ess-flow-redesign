import AirTickets from '@assets/icons/quickActions/AirTickets.png';
import CreateInvoice from '@assets/icons/quickActions/CreateInvoice.png';
import GetHelp from '@assets/icons/quickActions/GetHelp.png';
import GiftCards from '@assets/icons/quickActions/GiftCards.png';
import MobileRecharge from '@assets/icons/quickActions/MobileRecharge.png';
import UtilityPayments from '@assets/icons/quickActions/UtilityPayments.png';
// import VerificationSuite from '@assets/icons/VerificationSuite.svg';
import { paths } from '@src/routes/paths';

import { accessKeys, serviceCategoryNames } from './accessKeys';

export const quickActions = [
    {
        icon: MobileRecharge,
        imageSize: { width: 67, height: 61 },
        title: serviceCategoryNames.telecom,
        url: `${paths.dashboard.mobileRecharge}`,
    },
    {
        icon: UtilityPayments,
        imageSize: { width: 74, height: 67 },
        title: serviceCategoryNames.utility,
        url: `${paths.dashboard.billPayments}`,
    },
    {
        icon: AirTickets,
        imageSize: { width: 77, height: 52 },
        title: 'Air Tickets',
        url: `/corporate-travel`,
        indexURL: paths.dashboard.corporateTravel,
        accessKey: accessKeys.airline,
    },
    {
        icon: GiftCards,
        imageSize: { width: 88, height: 58 },
        title: 'Gift Cards',
        url: `/gift-cards`,
        indexURL: paths.dashboard.giftCards,
        accessKey: accessKeys.giftCards,
    },
    // {
    //     icon: VerificationSuite,
    //     title: 'Verification Suite',
    //     url: `${paths.dashboard.verificationSuite}`,
    //     indexURL: paths.verificationSuite.index,
    // },
    {
        icon: CreateInvoice,
        imageSize: { width: 70, height: 64 },
        title: 'Create Invoice',
        url: `${paths.dashboard.invoicing}`,
    },
    {
        icon: GetHelp,
        imageSize: { width: 74, height: 68 },
        title: 'Get Help',
        url: paths.dashboard.needHelp,
        state: {
            raiseTicket: true,
        },
    },
];

function generateYears(startYear: number, endYear: number) {
    const years: { value: string; label: string }[] = [];

    for (let year = startYear; year <= endYear; year += 1) {
        years.push({ value: year.toString(), label: year.toString() });
    }

    return years;
}

function generateMonths(): { label: string; value: string }[] {
    const months: { label: string; value: string }[] = [
        { label: 'All', value: 'all' },
        { label: 'January', value: '01' },
        { label: 'February', value: '02' },
        { label: 'March', value: '03' },
        { label: 'April', value: '04' },
        { label: 'May', value: '05' },
        { label: 'June', value: '06' },
        { label: 'July', value: '07' },
        { label: 'August', value: '08' },
        { label: 'September', value: '09' },
        { label: 'October', value: '10' },
        { label: 'November', value: '11' },
        { label: 'December', value: '12' },
    ];

    return months;
}

export const years = generateYears(2014, 2024);
export const months = generateMonths();

export const chartData = [
    {
        name: 'Mobile Payments',
        amt: 2400,
    },
    {
        name: serviceCategoryNames.utility,
        amt: 2210,
    },
    {
        name: 'Air Tickets',
        amt: 2290,
    },
    {
        name: 'Gift Cards',
        amt: 2000,
    },
    {
        name: 'Logistics',
        amt: 2181,
    },
    {
        name: 'Subscriptions',
        amt: 2500,
    },
    {
        name: 'Zero Carbon',
        amt: 2100,
    },
];

// dummy product array
export const dummyRelatedProducts = {
    Stationary: [
        { id: 1, name: 'Notebook' },
        { id: 2, name: 'Pens' },
        { id: 3, name: 'Stapler' },
        { id: 4, name: 'Folders' },
        { id: 5, name: 'Desk Organizer' },
    ],
    Computers: [
        { id: 1, name: 'Laptop' },
        { id: 2, name: 'Desktop PC' },
        { id: 3, name: 'Tablet' },
        { id: 4, name: 'Mouse' },
        { id: 5, name: 'Keyboard' },
    ],
    Printers: [
        { id: 1, name: 'Inkjet Printer' },
        { id: 2, name: 'Laser Printer' },
        { id: 3, name: 'All-in-One Printer' },
        { id: 4, name: 'Photo Printer' },
        { id: 5, name: 'Dot Matrix Printer' },
    ],
    Desktops: [
        { id: 1, name: 'Workstation' },
        { id: 2, name: 'Gaming PC' },
        { id: 3, name: 'Home Office Desktop' },
        { id: 4, name: 'Mini PC' },
        { id: 5, name: 'Media Center PC' },
    ],
    Stamps: [
        { id: 1, name: 'Rubber Stamp' },
        { id: 2, name: 'Self-Inking Stamp' },
        { id: 3, name: 'Date Stamp' },
        { id: 4, name: 'Address Stamp' },
        { id: 5, name: 'Signature Stamp' },
    ],
    'Toner and Ink': [
        { id: 1, name: 'Ink Cartridge' },
        { id: 2, name: 'Toner Cartridge' },
        { id: 3, name: 'Printer Ink Refill' },
        { id: 4, name: 'Laser Toner Refill' },
        { id: 5, name: 'Ink Tank' },
    ],
    Electronics: [
        { id: 1, name: 'Headphones' },
        { id: 2, name: 'Smartphone' },
        { id: 3, name: 'Smartwatch' },
        { id: 4, name: 'Digital Camera' },
        { id: 5, name: 'Bluetooth Speaker' },
    ],
    Essentials: [
        { id: 1, name: 'Cleaning Supplies' },
        { id: 2, name: 'Office Chair' },
        { id: 3, name: 'Desk Lamp' },
        { id: 4, name: 'Storage Bins' },
        { id: 5, name: 'Whiteboard' },
    ],
};

export const orderHistoryData = [
    {
        key: '1',
        date: '2024-01-01',
        productName: 'Product 1',
        orderId: 'ORD1',
        amount: '$100',
        status: 'Completed',
    },
    {
        key: '2',
        date: '2024-01-02',
        productName: 'Product 2',
        orderId: 'ORD2',
        amount: '$200',
        status: 'Pending',
    },
    {
        key: '3',
        date: '2024-01-02',
        productName: 'Product 2',
        orderId: 'ORD2',
        amount: '$200',
        status: 'Pending',
    },
    {
        key: '4',
        date: '2024-01-02',
        productName: 'Product 2',
        orderId: 'ORD2',
        amount: '$200',
        status: 'Pending',
    },
    {
        key: '5',
        date: '2024-01-02',
        productName: 'Product 2',
        orderId: 'ORD2',
        amount: '$200',
        status: 'Pending',
    },
];

export const getFileExtensionFromUrl = (url: string): string => {
    try {
        // Extract the part after the last dot in the URL
        const parts = typeof url === 'string' ? url.split('.') : [];
        const extension = parts.length > 1 ? parts.pop() : '';
        // Check if it contains a file extension (ignore fragments and queries)
        return extension ? extension.split('?')[0] : '';
    } catch (error) {
        // Log or handle the error if needed
        console.error('Error extracting file extension:', error);
        return '';
    }
};
