import { describe, it, expect } from 'vitest';

// Extracted from Invoice.tsx filteredInvoiceData memo logic
const filterInvoices = (data: any[], searchText: string) => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter(
        row =>
            `${row.prefix ?? ''}${row.invoiceNumber ?? ''}`.toLowerCase().includes(lower) ||
            row.name?.toLowerCase().includes(lower) ||
            row.totalAmount?.toLowerCase().includes(lower) ||
            row.invoiceType?.toLowerCase().includes(lower) ||
            row.status?.toLowerCase().includes(lower)
    );
};

const sampleData = [
    {
        prefix: 'INV',
        invoiceNumber: '001',
        name: 'Acme Corp',
        totalAmount: '10000',
        invoiceType: 'standard',
        status: 'pending',
    },
    {
        prefix: 'QUO',
        invoiceNumber: '002',
        name: 'Beta Ltd',
        totalAmount: '5000',
        invoiceType: 'proforma',
        status: 'paid',
    },
    {
        prefix: null,
        invoiceNumber: '003',
        name: 'Gamma Inc',
        totalAmount: '2000',
        invoiceType: 'standard',
        status: 'overdue',
    },
];

describe('filterInvoices', () => {
    it('returns all rows unchanged when searchText is empty', () => {
        const result = filterInvoices(sampleData, '');
        expect(result).toEqual(sampleData);
    });

    it('matches row by combined prefix + invoiceNumber (INV001)', () => {
        const result = filterInvoices(sampleData, 'INV001');
        expect(result).toHaveLength(1);
        expect(result[0].invoiceNumber).toBe('001');
    });

    it('matches row by partial invoiceNumber alone (001)', () => {
        const result = filterInvoices(sampleData, '001');
        expect(result).toHaveLength(1);
        expect(result[0].invoiceNumber).toBe('001');
    });

    it('matches row by customer name', () => {
        const result = filterInvoices(sampleData, 'Acme');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Acme Corp');
    });

    it('matches row by status "pending"', () => {
        const result = filterInvoices(sampleData, 'pending');
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('pending');
    });

    it('returns empty array when search text does not match any row', () => {
        const result = filterInvoices(sampleData, 'XYZ');
        expect(result).toHaveLength(0);
    });

    it('matches row with no prefix by invoiceNumber alone', () => {
        const result = filterInvoices(sampleData, '003');
        expect(result).toHaveLength(1);
        expect(result[0].invoiceNumber).toBe('003');
        expect(result[0].prefix).toBeNull();
    });
});
