import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import LeftHeader from '../../../components/shared/LeftHeader';

describe('LeftHeader', () => {
    it('renders title and optional description', () => {
        render(<LeftHeader title="Hello" description="World" />);

        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('omits description when not given', () => {
        render(<LeftHeader title="Hello" />);
        expect(screen.queryByText('World')).not.toBeInTheDocument();
    });

    it('renders close icon and triggers onClose when clicked', () => {
        const onClose = vi.fn();
        const { container } = render(<LeftHeader title="x" onClose={onClose} />);

        const close = container.querySelector('.anticon-close-circle') as Element;
        expect(close).not.toBeNull();
        fireEvent.click(close);
        expect(onClose).toHaveBeenCalled();
    });
});
