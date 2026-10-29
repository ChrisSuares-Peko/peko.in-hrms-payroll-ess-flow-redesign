import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import UnavailableItemsModal from '../../components/modals/UnavailableItemsModal';
import { UnavailableCartItem } from '../../utils/unavailableCartItems';

const item: UnavailableCartItem = {
    productId: 1,
    ondcProductId: 'SKU-1',
    productName: 'A4 paper',
    image: '',
    vendorName: 'Office Mart',
    reason: 'The seller cannot deliver this to your pincode.',
    stockUnavailable: false,
};

describe('UnavailableItemsModal', () => {
    it('lists the product and seller', () => {
        render(
            <UnavailableItemsModal
                open
                items={[item]}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
            />
        );

        expect(screen.getByText('Some items cannot be ordered')).toBeInTheDocument();
        expect(screen.getByText('A4 paper')).toBeInTheDocument();
        expect(screen.getByText('Office Mart')).toBeInTheDocument();
        expect(
            screen.queryByText('The seller cannot deliver this to your pincode.')
        ).not.toBeInTheDocument();
    });

    it('does not delete when Keep items or the header close is used', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        render(
            <UnavailableItemsModal open items={[item]} onClose={onClose} onConfirm={onConfirm} />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Keep items' }));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(2);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('asks to remove only when Remove items is clicked', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        render(
            <UnavailableItemsModal open items={[item]} onClose={onClose} onConfirm={onConfirm} />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Remove items' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });
});
