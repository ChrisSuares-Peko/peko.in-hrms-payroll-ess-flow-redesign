import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DocTabFilter from '../../../components/shared/DocTabFilter';

vi.mock('../../../constants', () => ({
    RECENT_DOC_TABS: ['All', 'Draft', 'Sent', 'Signed'],
}));

describe('DocTabFilter', () => {
    it('should render all tabs', () => {
        render(<DocTabFilter activeTab="All" onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Draft' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sent' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Signed' })).toBeInTheDocument();
    });

    it('should apply active styling to the active tab', () => {
        render(<DocTabFilter activeTab="Draft" onChange={vi.fn()} />);

        const draftBtn = screen.getByRole('button', { name: 'Draft' });
        expect(draftBtn.className).toContain('border-[#FF3A3A]');
    });

    it('should not apply active styling to inactive tabs', () => {
        render(<DocTabFilter activeTab="All" onChange={vi.fn()} />);

        const draftBtn = screen.getByRole('button', { name: 'Draft' });
        expect(draftBtn.className).not.toContain('border-[#FF3A3A]');
    });

    it('should call onChange with the correct tab when a tab is clicked', () => {
        const onChange = vi.fn();
        render(<DocTabFilter activeTab="All" onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Sent' }));

        expect(onChange).toHaveBeenCalledWith('Sent');
    });

    it('should call onChange when active tab is clicked again', () => {
        const onChange = vi.fn();
        render(<DocTabFilter activeTab="All" onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'All' }));

        expect(onChange).toHaveBeenCalledWith('All');
    });
});
