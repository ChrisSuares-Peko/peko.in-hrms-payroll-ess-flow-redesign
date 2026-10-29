import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LeftHeader from '../../../components/shared/LeftHeader';

describe('LeftHeader', () => {
    it('renders the title and description', () => {
        render(<LeftHeader title="Title" description="Desc" />);
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Desc')).toBeInTheDocument();
    });

    it('renders close icon and calls onClose when clicked', () => {
        const onClose = vi.fn();
        const { container } = render(<LeftHeader title="T" onClose={onClose} />);

        const icon = container.querySelector('.anticon-close-circle');
        expect(icon).toBeTruthy();
        fireEvent.click(icon!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render close icon when onClose is omitted', () => {
        const { container } = render(<LeftHeader title="T" />);
        expect(container.querySelector('.anticon-close-circle')).toBeNull();
    });
});
