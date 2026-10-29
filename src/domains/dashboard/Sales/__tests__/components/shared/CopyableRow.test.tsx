import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import CopyableRow from '../../../components/shared/CopyableRow';

const writeText = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
    });
});

describe('CopyableRow', () => {
    it('renders title and description', () => {
        render(<CopyableRow title="IFSC" description="HDFC0001234" />);

        expect(screen.getByText('IFSC')).toBeInTheDocument();
        expect(screen.getByText('HDFC0001234')).toBeInTheDocument();
    });

    it('renders copy button by default and writes to clipboard on click', () => {
        const { container } = render(<CopyableRow title="t" description="abc" />);
        const copyBtn = container.querySelector('.bg-\\[\\#FF4F4F\\]') as HTMLElement;
        expect(copyBtn).not.toBeNull();

        fireEvent.click(copyBtn);
        expect(writeText).toHaveBeenCalledWith('abc');
    });

    it('hides the copy button when isCopy is false', () => {
        const { container } = render(
            <CopyableRow title="t" description="abc" isCopy={false} />
        );

        expect(container.querySelector('.bg-\\[\\#FF4F4F\\]')).toBeNull();
    });
});
