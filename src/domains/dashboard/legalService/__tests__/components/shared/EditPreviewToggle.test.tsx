import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EditPreviewToggle from '../../../components/shared/EditPreviewToggle';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

vi.mock('../../../assets/icons/edit.svg', () => ({ default: '/edit.svg' }));
vi.mock('../../../assets/icons/eye.svg', () => ({ default: '/eye.svg' }));

describe('EditPreviewToggle', () => {
    it('should render Edit and Preview buttons', () => {
        render(<EditPreviewToggle mode="edit" onModeChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    });

    it('should apply active styling to Edit button when mode is edit', () => {
        render(<EditPreviewToggle mode="edit" onModeChange={vi.fn()} />);

        const editBtn = screen.getByRole('button', { name: /edit/i });
        expect(editBtn.className).toContain('!text-[#FF3A3A]');
    });

    it('should apply active styling to Preview button when mode is preview', () => {
        render(<EditPreviewToggle mode="preview" onModeChange={vi.fn()} />);

        const previewBtn = screen.getByRole('button', { name: /preview/i });
        expect(previewBtn.className).toContain('!text-[#FF3A3A]');
    });

    it('should call onModeChange with edit when Edit button is clicked', () => {
        const onModeChange = vi.fn();
        render(<EditPreviewToggle mode="preview" onModeChange={onModeChange} />);

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        expect(onModeChange).toHaveBeenCalledWith('edit');
    });

    it('should call onModeChange with preview when Preview button is clicked', () => {
        const onModeChange = vi.fn();
        render(<EditPreviewToggle mode="edit" onModeChange={onModeChange} />);

        fireEvent.click(screen.getByRole('button', { name: /preview/i }));

        expect(onModeChange).toHaveBeenCalledWith('preview');
    });
});
