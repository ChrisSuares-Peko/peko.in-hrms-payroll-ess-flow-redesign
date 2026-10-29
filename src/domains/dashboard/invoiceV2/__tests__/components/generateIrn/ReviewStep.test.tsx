import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ReviewStep from '../../../components/generateIrn/ReviewStep';
import {
    BuyerFormValues,
    ItemsFormValues,
    SellerFormValues,
    TransactionFormValues,
} from '../../../types/generateIrn';

vi.mock('../../../utils/generateIrnCalculations', () => ({
    calcTaxable: () => 100,
    calcIgst: () => 18,
    calcCgst: () => 9,
    calcTotal: () => 118,
}));

const transaction: TransactionFormValues = {
    supplyType: 'B2B',
    documentType: 'INV',
    documentPrefix: 'INV',
    documentNumber: '001',
    documentDate: '2026-05-01',
    reverseCharge: false,
    igstOnIntra: false,
};

const seller: SellerFormValues = {
    sellerGstin: '29ABCDE1234F1Z5',
    legalName: 'Acme',
    tradeName: 'Acme Trade',
    address1: 'Addr 1',
    location: 'BLR',
    pinCode: '560001',
    state: 'Karnataka',
};

const buyer: BuyerFormValues = {
    buyerGstin: '29ZZZZZ1234F1Z5',
    legalName: 'Customer Inc',
    tradeName: '',
    phoneNumber: '9999999999',
    address1: 'Buyer Addr',
    location: 'Pune',
    pinCode: '411001',
    state: 'Maharashtra',
    placeOfSupply: 'Maharashtra',
};

const items: ItemsFormValues = {
    items: [
        {
            id: '1',
            description: 'Widget',
            hsnSac: '1234',
            quantity: 1,
            unit: 'PCS',
            unitPrice: 100,
            discount: 0,
            gstRate: 18,
        },
    ],
};

describe('ReviewStep', () => {
    it('renders all three review cards', () => {
        render(<ReviewStep transaction={transaction} seller={seller} buyer={buyer} items={items} />);
        expect(screen.getByText('Transaction')).toBeInTheDocument();
        expect(screen.getByText('Seller')).toBeInTheDocument();
        expect(screen.getByText('Buyer')).toBeInTheDocument();
    });

    it('renders the line items table heading and count', () => {
        render(<ReviewStep transaction={transaction} seller={seller} buyer={buyer} items={items} />);
        expect(screen.getByText(/Line Items \(1\)/)).toBeInTheDocument();
    });

    it('omits Trade Name row when buyer has no tradeName', () => {
        render(<ReviewStep transaction={transaction} seller={seller} buyer={buyer} items={items} />);
        // Seller has tradeName; buyer does not. "Trade Name" should appear exactly once.
        expect(screen.getAllByText('Trade Name')).toHaveLength(1);
    });
});
