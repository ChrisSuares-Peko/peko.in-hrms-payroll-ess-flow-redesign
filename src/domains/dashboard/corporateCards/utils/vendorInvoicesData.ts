import { RequestStatus } from './types';

export interface VendorInvoiceRow {
    key: string;
    date: string;
    invoice: string;
    vendor: string;
    due: string;
    amount: number;
    status: RequestStatus;
}

export const VENDOR_INVOICES: VendorInvoiceRow[] = [
    {
        key: '1',
        date: '2024-01-12',
        invoice: 'INV-2024-1042',
        vendor: 'AZB & Partners',
        due: '2024-01-12',
        amount: 2400,
        status: 'Approved',
    },
    {
        key: '2',
        date: '2024-02-03',
        invoice: 'INV-2024-1042',
        vendor: 'BrightDesign Studio',
        due: '2024-02-03',
        amount: 790.5,
        status: 'Rejected',
    },
    {
        key: '3',
        date: '2024-03-15',
        invoice: 'INV-2024-1043',
        vendor: 'CrestWave Solutions',
        due: '2024-03-15',
        amount: 7240.5,
        status: 'Approved',
    },
    {
        key: '4',
        date: '2024-04-27',
        invoice: 'INV-2024-1044',
        vendor: 'NovaSphere Creative',
        due: '2024-04-27',
        amount: 5240.5,
        status: 'Pending',
    },
    {
        key: '5',
        date: '2024-05-09',
        invoice: 'INV-2024-1045',
        vendor: 'PixelForge Labs',
        due: '2024-05-09',
        amount: 3150.75,
        status: 'Pending',
    },
];
