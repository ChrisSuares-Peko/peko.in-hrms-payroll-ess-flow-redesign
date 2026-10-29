import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import AddShareholderDrawer, { ShareholderFormData } from '../../components/AddShareholderDrawer';

const editData: ShareholderFormData = {
    name: 'Rahul Verma',
    nationality: 'Indian',
    email: 'rahul@yopmail.com',
    mobile: '9812345678',
    panNumber: 'BCDPS5678L',
};

describe('AddShareholderDrawer', () => {
    it('renders the add-mode title and core fields when open', () => {
        render(<AddShareholderDrawer open onClose={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.getByText('Add shareholder')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email address')).toBeInTheDocument();
        expect(screen.getByText('Mobile Number')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('uses "partner" wording for LLP', () => {
        render(<AddShareholderDrawer open isLLP onClose={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.getByText('Add partner')).toBeInTheDocument();
    });

    it('switches to edit mode with an Update button when editData is provided', () => {
        render(<AddShareholderDrawer open editData={editData} onClose={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.getByText('Edit shareholder')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
        const onClose = vi.fn();
        render(<AddShareholderDrawer open onClose={onClose} onSubmit={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('does not render when closed', () => {
        render(<AddShareholderDrawer open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.queryByText('Add shareholder')).toBeNull();
    });
});
