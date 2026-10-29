import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import VirtualAccountModal from '../../../components/collectPayment/VirtualAccountModal';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));
vi.mock('../../../components/shared/CopyableRow', () => ({
    default: ({ title, description }: any) => (
        <div>
            <span>{title}</span>
            <span>{description}</span>
        </div>
    ),
}));
vi.mock('../../../components/shared/InfoItem', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

describe('VirtualAccountModal', () => {
    it('renders bank account information rows from dummy + override props', () => {
        render(
            <VirtualAccountModal
                open
                onCancel={() => {}}
                details={{ accountName: 'Acme Co', bankName: 'HDFC' } as any}
            />
        );

        expect(screen.getByText('Virtual Account Details')).toBeInTheDocument();
        expect(screen.getByText('Bank Account Information')).toBeInTheDocument();
        expect(screen.getByText('Acme Co')).toBeInTheDocument();
        expect(screen.getByText('HDFC')).toBeInTheDocument();
    });

    it('triggers onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<VirtualAccountModal open onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
        expect(onCancel).toHaveBeenCalled();
    });

    it('triggers onShare when Share with Customer clicked', () => {
        const onShare = vi.fn();
        render(<VirtualAccountModal open onCancel={() => {}} onShare={onShare} />);

        fireEvent.click(screen.getByRole('button', { name: /share with customer/i }));
        expect(onShare).toHaveBeenCalled();
    });

    it('falls back to onCancel when onShare is not provided', () => {
        const onCancel = vi.fn();
        render(<VirtualAccountModal open onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: /share with customer/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});
